import { Router } from 'express';
import { Badge } from '../types/api';
import { readDB, writeDB } from '../services/storage';

const router = Router();

// Get all badges for a user
router.get('/', async (req, res) => {
  const db = await readDB();
  const badges: Badge[] = db.badges || [];
  res.json(badges.filter(b => !b.userId || b.userId === req.query.userId));
});

// Unlock a new badge for a user
router.post('/unlock', async (req, res) => {
  const { badgeId, userId } = req.body;
  
  const db = await readDB();
  const badges: Badge[] = db.badges || [];
  
  const badge = badges.find(b => b.id === badgeId);
  if (!badge) {
    return res.status(404).json({ error: 'Badge not found' });
  }

  if (badge.unlockedAt) {
    return res.status(400).json({ error: 'Badge already unlocked' });
  }

  badge.unlockedAt = new Date().toISOString();
  badge.userId = userId;

  await writeDB({ ...db, badges });

  res.json(badge);
});

export default router;