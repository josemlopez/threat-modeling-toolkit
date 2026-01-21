import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { z } from 'zod';
import { redis, db, vault, auditLog } from '../lib';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  name: z.string().min(2).max(100),
  organizationName: z.string().min(2).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  mfaCode: z.string().optional(),
});

// Rate limiters
const loginLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_fail',
  points: 5,
  duration: 60 * 15, // 15 minutes
  blockDuration: 60 * 60, // Block for 1 hour
});

const passwordResetLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'pwd_reset',
  points: 3,
  duration: 60 * 60, // 1 hour
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check password against breached passwords
    const isBreached = await checkBreachedPassword(data.password);
    if (isBreached) {
      return res.status(400).json({
        error: 'PASSWORD_BREACHED',
        message: 'This password has been found in data breaches. Please choose a different password.',
      });
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create organization and user in transaction
    const result = await db.transaction(async (trx) => {
      const org = await trx('organizations').insert({
        name: data.organizationName,
      }).returning('*');

      const user = await trx('users').insert({
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        name: data.name,
        organization_id: org[0].id,
        role: 'owner',
      }).returning(['id', 'email', 'name', 'organization_id']);

      return user[0];
    });

    await auditLog.log({
      action: 'USER_REGISTERED',
      userId: result.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'EMAIL_EXISTS' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase();

    // Check rate limit
    try {
      await loginLimiter.consume(email);
    } catch (rateLimitError) {
      await auditLog.log({
        action: 'LOGIN_RATE_LIMITED',
        metadata: { email },
        ip: req.ip,
      });
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000),
      });
    }

    // Get user
    const user = await db('users')
      .where({ email })
      .first();

    if (!user) {
      // Constant time response to prevent timing attacks
      await bcrypt.compare(data.password, '$2b$12$invalidhashtopreventtimingattacks');
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        error: 'ACCOUNT_LOCKED',
        lockedUntil: user.locked_until,
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      await handleFailedLogin(user, req.ip);
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!data.mfaCode) {
        return res.status(200).json({ mfaRequired: true });
      }

      const validMfa = authenticator.verify({
        token: data.mfaCode,
        secret: user.mfa_secret,
      });

      if (!validMfa) {
        await auditLog.log({
          action: 'MFA_FAILED',
          userId: user.id,
          ip: req.ip,
        });
        return res.status(401).json({ error: 'INVALID_MFA_CODE' });
      }
    }

    // Generate tokens
    const jwtPrivateKey = await vault.read('secret/data/jwt', 'private_key');
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: user.role,
      },
      jwtPrivateKey,
      {
        algorithm: 'RS256',
        expiresIn: '1h',
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      jwtPrivateKey,
      {
        algorithm: 'RS256',
        expiresIn: '7d',
      }
    );

    // Store session in Redis
    await redis.setex(
      `session:${user.id}:${refreshToken.slice(-16)}`,
      7 * 24 * 60 * 60,
      JSON.stringify({
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        createdAt: new Date().toISOString(),
      })
    );

    // Reset failed attempts
    await db('users').where({ id: user.id }).update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login: new Date(),
    });

    // Delete rate limit key on success
    await loginLimiter.delete(email);

    await auditLog.log({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      accessToken,
      refreshToken,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Rate limit
    await passwordResetLimiter.consume(email);
  } catch (rateLimitError) {
    // Still return success to prevent enumeration
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  try {
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await db('users')
      .where({ email: email.toLowerCase() })
      .update({
        reset_token: resetTokenHash,
        reset_token_expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

    // TODO: Send email with reset link containing unhashed token
    // await sendPasswordResetEmail(email, resetToken);

    await auditLog.log({
      action: 'PASSWORD_RESET_REQUESTED',
      metadata: { email },
      ip: req.ip,
    });

    // Always return success to prevent user enumeration
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    // Still return success to prevent enumeration
    res.json({ message: 'If the email exists, a reset link has been sent' });
  }
});

// POST /auth/mfa/enable
router.post('/mfa/enable', authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await db('users').where({ id: userId }).first();

    if (user.mfa_enabled) {
      return res.status(400).json({ error: 'MFA_ALREADY_ENABLED' });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'FinanceHub', secret);

    // Store temporarily (not enabled until verified)
    await redis.setex(`mfa_setup:${userId}`, 600, secret);

    await auditLog.log({
      action: 'MFA_SETUP_STARTED',
      userId,
      ip: req.ip,
    });

    res.json({
      secret,
      otpauthUrl,
      message: 'Scan QR code and verify with a code to enable MFA',
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /auth/mfa/verify
router.post('/mfa/verify', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { code } = req.body;

  try {
    const secret = await redis.get(`mfa_setup:${userId}`);

    if (!secret) {
      return res.status(400).json({ error: 'MFA_SETUP_EXPIRED' });
    }

    const valid = authenticator.verify({ token: code, secret });

    if (!valid) {
      return res.status(400).json({ error: 'INVALID_CODE' });
    }

    // Generate recovery codes
    const crypto = await import('crypto');
    const recoveryCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Enable MFA
    await db('users').where({ id: userId }).update({
      mfa_enabled: true,
      mfa_secret: secret,
      mfa_recovery_codes: JSON.stringify(recoveryCodes),
    });

    await redis.del(`mfa_setup:${userId}`);

    await auditLog.log({
      action: 'MFA_ENABLED',
      userId,
      ip: req.ip,
    });

    res.json({
      message: 'MFA enabled successfully',
      recoveryCodes,
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// Helper functions
async function handleFailedLogin(user: any, ip: string) {
  const failedAttempts = user.failed_login_attempts + 1;
  const updates: any = { failed_login_attempts: failedAttempts };

  // Lock account after 5 failed attempts
  if (failedAttempts >= 5) {
    const lockDurations = [1, 5, 15, 60]; // minutes
    const lockIndex = Math.min(Math.floor((failedAttempts - 5) / 5), lockDurations.length - 1);
    const lockMinutes = lockDurations[lockIndex];
    updates.locked_until = new Date(Date.now() + lockMinutes * 60 * 1000);

    await auditLog.log({
      action: 'ACCOUNT_LOCKED',
      userId: user.id,
      metadata: { lockMinutes },
      ip,
    });
  }

  await db('users').where({ id: user.id }).update(updates);

  await auditLog.log({
    action: 'LOGIN_FAILED',
    userId: user.id,
    metadata: { failedAttempts },
    ip,
  });
}

async function checkBreachedPassword(password: string): Promise<boolean> {
  // Check against HaveIBeenPwned API using k-anonymity
  const crypto = await import('crypto');
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    return text.includes(suffix);
  } catch {
    // Fail open - don't block registration if API is down
    return false;
  }
}

export default router;
