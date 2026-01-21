# TaskFlow API

## Authentication

All endpoints except `/auth/*` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### POST /api/auth/login

Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

### POST /api/auth/forgot-password

Request a password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

### GET /api/tasks

Get all tasks for the authenticated user.

**Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete project",
      "description": "Finish the API",
      "status": "in_progress",
      "dueDate": "2025-02-01",
      "assigneeId": "uuid"
    }
  ]
}
```

### POST /api/tasks

Create a new task.

**Request:**
```json
{
  "title": "New task",
  "description": "Task details",
  "dueDate": "2025-02-01",
  "assigneeId": "uuid"
}
```

### PUT /api/tasks/:id

Update an existing task.

### DELETE /api/tasks/:id

Delete a task.

## Error Responses

All errors return:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common status codes:
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error
