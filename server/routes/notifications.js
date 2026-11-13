import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import requireUser from '../middleware/requireUser.js';

const router = Router();
router.use(requireUser);
router.get('/', async (req, res) => {
  try {
    const [notifications, unread] = await Promise.all([
      Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(60),
      Notification.countDocuments({ recipient: req.user._id, readAt: null }),
    ]);
    res.json({ notifications, unread });
  } catch { res.status(500).json({ message: 'Could not load notifications.' }); }
});

router.patch('/:id/read', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Notification not found.' });
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id, readAt: null }, { readAt: new Date() }, { new: true });
    res.json({ notification });
  } catch { res.status(500).json({ message: 'Could not update the notification.' }); }
});

router.post('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, readAt: null }, { readAt: new Date() });
    res.json({ message: 'Notifications marked as read.' });
  } catch { res.status(500).json({ message: 'Could not update notifications.' }); }
});
export default router;
