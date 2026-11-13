import { Router } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';
import requireUser from '../middleware/requireUser.js';
import { createNotification } from '../services/notifications.js';
import User from '../models/User.js';

const router = Router();
router.get('/user/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Member not found.' });
    const user = await User.findById(req.params.id).select('name createdAt');
    if (!user) return res.status(404).json({ message: 'Member not found.' });
    const reviews = await Review.find({ recipient: user._id, status: 'VISIBLE' }).populate('reviewer', 'name').sort({ createdAt: -1 }).limit(100);
    const average = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
    res.json({ member: { id: user._id, name: user.name, since: user.createdAt }, average: Number(average.toFixed(1)), count: reviews.length, reviews });
  } catch { res.status(500).json({ message: 'Could not load this member profile.' }); }
});

router.get('/mine', requireUser, async (req, res) => {
  try {
    const [received, given] = await Promise.all([
      Review.find({ recipient: req.user._id, status: 'VISIBLE' }).populate('reviewer', 'name').populate('transaction', 'listing agreedPrice').sort({ createdAt: -1 }),
      Review.find({ reviewer: req.user._id }).populate('recipient', 'name').populate('transaction', 'listing agreedPrice').sort({ createdAt: -1 }),
    ]);
    res.json({ received, given });
  } catch { res.status(500).json({ message: 'Could not load your reviews.' }); }
});

router.post('/', requireUser, async (req, res) => {
  try {
    const { transactionId, rating, comment = '' } = req.body;
    if (!mongoose.isValidObjectId(transactionId)) return res.status(400).json({ message: 'Choose a valid completed transaction.' });
    const transaction = await Transaction.findOne({ _id: transactionId, status: 'COMPLETED', $or: [{ buyer: req.user._id }, { seller: req.user._id }] });
    if (!transaction) return res.status(404).json({ message: 'Only members in a completed transaction can leave a review.' });
    const recipient = transaction.buyer.equals(req.user._id) ? transaction.seller : transaction.buyer;
    const review = await Review.create({ transaction: transaction._id, reviewer: req.user._id, recipient, rating: Number(rating), comment });
    await review.populate('recipient', 'name');
    await createNotification({ recipient, actor: req.user._id, type: 'REVIEW', title: 'New member review', body: `${req.user.name} left you a ${Number(rating)}-star review.`, listing: transaction.listing });
    res.status(201).json({ review });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You already reviewed this transaction.' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
    res.status(500).json({ message: 'Could not save your review.' });
  }
});
export default router;
