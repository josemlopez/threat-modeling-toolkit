/**
 * Authorization Security Tests
 * Generated from threat model: 2026-01-20
 *
 * Tests for authorization-related threats:
 * - THREAT-003: BOLA - Task Update
 * - THREAT-004: BOLA - Task Delete
 */

const request = require('supertest');
const app = require('../src/app');

describe('Authorization Security', () => {

  let userAToken, userBToken;
  let userATaskId;

  beforeAll(async () => {
    // Create two users and get their tokens
    // User A creates a task, User B tries to access it

    // Register and login User A
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'usera@test.com', password: 'password123', name: 'User A' });

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usera@test.com', password: 'password123' });
    userAToken = loginA.body.token;

    // Register and login User B
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'userb@test.com', password: 'password123', name: 'User B' });

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ email: 'userb@test.com', password: 'password123' });
    userBToken = loginB.body.token;

    // User A creates a task
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'User A Private Task', description: 'Secret' });
    userATaskId = task.body.id;
  });

  // ============================================================
  // THREAT-003: BOLA - Task Update
  // GAP-001: Missing object-level authorization
  // ============================================================
  describe('Object-Level Authorization - Update', () => {

    it('TEST-011: Should allow user to update their own task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Updated by Owner' });

      expect(response.status).toBe(200);
    });

    it('TEST-012: [EXPECTED FAIL] Should block user from updating others task', async () => {
      // NOTE: This test documents GAP-001
      // Currently NO ownership check - test should fail until fixed

      const response = await request(app)
        .put(`/api/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'Hacked by User B' });

      // Should return 403 Forbidden (FAILS until GAP-001 fixed)
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('unauthorized');
    });

    it('TEST-013: Should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/99999999')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Update non-existent' });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // THREAT-004: BOLA - Task Delete
  // GAP-002: Missing object-level authorization
  // ============================================================
  describe('Object-Level Authorization - Delete', () => {

    let taskToDelete;

    beforeEach(async () => {
      // Create a fresh task for each delete test
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Task to Delete' });
      taskToDelete = task.body.id;
    });

    it('TEST-014: Should allow user to delete their own task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Task deleted');
    });

    it('TEST-015: [EXPECTED FAIL] Should block user from deleting others task', async () => {
      // NOTE: This test documents GAP-002
      // Currently NO ownership check - test should fail until fixed

      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${userBToken}`);

      // Should return 403 Forbidden (FAILS until GAP-002 fixed)
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('unauthorized');
    });

    it('TEST-016: Should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999999')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // Additional Authorization Tests
  // ============================================================
  describe('General Authorization', () => {

    it('TEST-017: Should only return users own tasks', async () => {
      // Create tasks for both users
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'User A Task' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'User B Task' });

      // User A should only see their tasks
      const responseA = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`);

      const userATasks = responseA.body.tasks;
      const hasBTask = userATasks.some(t => t.title === 'User B Task');

      expect(hasBTask).toBe(false);
    });

    it('TEST-018: Should require authentication for all task routes', async () => {
      const routes = [
        { method: 'get', path: '/api/tasks' },
        { method: 'post', path: '/api/tasks' },
        { method: 'put', path: '/api/tasks/1' },
        { method: 'delete', path: '/api/tasks/1' },
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });
  });
});
