import { Router } from 'express';
import { db } from '../database/db.ts'; // ✅ using pool

const router = Router();

router.get('/ping', (req, res) => {
  res.json({ message: 'Server is running 🚀' });
});

router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
