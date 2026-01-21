# Infrastructure

## AWS Architecture

### VPC Layout

```
VPC: 10.0.0.0/16
│
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   ├── NAT Gateway
│   └── ALB (Application Load Balancer)
│
├── Private Subnets - Application (10.0.10.0/24, 10.0.11.0/24)
│   ├── EKS Worker Nodes
│   └── Kong API Gateway
│
├── Private Subnets - Data (10.0.20.0/24, 10.0.21.0/24)
│   ├── RDS PostgreSQL (Multi-AZ)
│   ├── ElastiCache Redis Cluster
│   └── Amazon MQ (RabbitMQ)
│
└── Private Subnets - Management (10.0.30.0/24)
    ├── HashiCorp Vault
    └── Bastion Host
```

### Security Groups

#### ALB Security Group
```
Inbound:
  - 443/tcp from 0.0.0.0/0 (HTTPS)
  - 80/tcp from 0.0.0.0/0 (HTTP → redirect to HTTPS)

Outbound:
  - All traffic to EKS worker nodes SG
```

#### EKS Worker Nodes Security Group
```
Inbound:
  - All traffic from ALB SG
  - All traffic from self (pod-to-pod)
  - 22/tcp from Bastion SG

Outbound:
  - 5432/tcp to RDS SG (PostgreSQL)
  - 6379/tcp to ElastiCache SG (Redis)
  - 5672/tcp to MQ SG (RabbitMQ)
  - 443/tcp to 0.0.0.0/0 (external APIs)
```

#### RDS Security Group
```
Inbound:
  - 5432/tcp from EKS Worker Nodes SG only

Outbound:
  - None
```

#### ElastiCache Security Group
```
Inbound:
  - 6379/tcp from EKS Worker Nodes SG only

Outbound:
  - None
```

### EKS Configuration

```yaml
# Cluster config
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: financehub-prod
  region: us-east-1

nodeGroups:
  - name: workers
    instanceType: m5.xlarge
    desiredCapacity: 6
    minSize: 3
    maxSize: 12
    privateNetworking: true

    securityGroups:
      attachIDs:
        - sg-workers

iam:
  withOIDC: true
  serviceAccounts:
    - metadata:
        name: vault-auth
        namespace: default
      attachPolicyARNs:
        - arn:aws:iam::xxx:policy/VaultAuth
```

### RDS Configuration

```
Engine: PostgreSQL 15
Instance: db.r6g.xlarge
Multi-AZ: Yes
Storage: 500GB gp3 (encrypted)
Backup: 7-day retention, daily snapshots
Encryption: AWS KMS (CMK)
IAM Auth: Enabled
SSL: Required
```

### Secrets Management (HashiCorp Vault)

```
Secrets stored:
├── secret/data/stripe
│   ├── secret_key
│   └── webhook_secret
├── secret/data/plaid
│   ├── client_id
│   └── secret
├── secret/data/twilio
│   ├── account_sid
│   └── auth_token
├── secret/data/auth0
│   ├── client_id
│   └── client_secret
├── secret/data/database
│   ├── auth_service_password
│   ├── payment_service_password
│   └── invoice_service_password
└── secret/data/jwt
    ├── private_key
    └── public_key

Authentication:
  - Kubernetes auth method (service accounts)
  - AppRole for CI/CD
  - OIDC for human access
```

## Kubernetes Resources

### Namespace Isolation

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: financehub
  labels:
    istio-injection: enabled
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: financehub
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Service Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: financehub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    spec:
      serviceAccountName: auth-service
      containers:
        - name: auth-service
          image: financehub/auth-service:v1.2.3
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: auth-service-secrets
                  key: database-url
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"
            requests:
              memory: "256Mi"
              cpu: "250m"
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
```

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

      - name: SAST Scan
        uses: github/codeql-action/analyze@v2

  build:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - name: Build and push image
        # ...

      - name: Sign image
        uses: sigstore/cosign-installer@main
        # ...

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via ArgoCD
        # ...
```

## Monitoring Stack

### DataDog Configuration

```yaml
# Metrics collected:
- Request latency (p50, p95, p99)
- Error rates
- Database connection pool
- Redis memory usage
- RabbitMQ queue depth

# APM Tracing:
- All HTTP requests
- Database queries
- External API calls
- Message queue operations

# Security Monitoring:
- Failed authentication attempts
- Rate limit violations
- WAF blocked requests
- Anomaly detection
```

### Alerting Rules

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|--------------|
| High Error Rate | >5% 5xx in 5min | P1 | PagerDuty |
| Payment Failures | >10% failures in 10min | P1 | PagerDuty |
| Database CPU | >80% for 10min | P2 | Slack |
| Certificate Expiry | <30 days | P3 | Email |
| Failed Logins Spike | >100/min | P2 | PagerDuty |
| Unusual Traffic | >3x baseline | P2 | Slack |

## Backup & Recovery

### Database Backups
- Automated daily snapshots (RDS)
- Point-in-time recovery (35 days)
- Cross-region replication
- Weekly backup testing

### Disaster Recovery
- RTO: 4 hours
- RPO: 1 hour
- Hot standby in us-west-2
- Documented runbooks
