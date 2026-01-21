const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tasks - Get user's tasks
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ tasks: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  const { title, description, dueDate, assigneeId } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO tasks (title, description, due_date, assignee_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, dueDate, assigneeId, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
// WARNING: Missing object-level authorization check!
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status, dueDate } = req.body;

  try {
    // BUG: Should check if user owns this task!
    const result = await db.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, due_date = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [title, description, status, dueDate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete task
// WARNING: Missing object-level authorization check!
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // BUG: Should check if user owns this task!
    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
