# TaskFlow - Simple Task Management App

A straightforward task management application for small teams.

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT tokens
- **Hosting**: Vercel (frontend) + Railway (backend)

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React App  │────▶│  Express API │────▶│  PostgreSQL  │
│   (Vercel)   │     │  (Railway)   │     │  (Railway)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Features

- User registration and login
- Create, edit, delete tasks
- Assign tasks to team members
- Due date reminders (email)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/forgot-password` - Request password reset

### Tasks
- `GET /api/tasks` - List user's tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile

## Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
SENDGRID_API_KEY=...
```

## Running Locally

```bash
npm install
npm run dev
```
