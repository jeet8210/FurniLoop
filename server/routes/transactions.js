import { Router } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Listing from '../models/Listing.js';
import requireUser from '../middleware/requireUser.js';
import { createNotification } from '../services/notifications.js';

const router = Router();
router.use(requireUser);
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] }).populate('listing', 'title images status').populate('buyer', 'name').populate('seller', 'name').sort({ createdAt: -1 }).limit(100);
    res.json({ transactions });
  } catch { res.status(500).json({ message: 'Could not load your transaction history.' }); }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Transaction not found.' });
    if (!['COMPLETED', 'CANCELLED'].includes(req.body.status)) return res.status(400).json({ message: 'Choose completed or cancelled.' });
    const changes = { status: req.body.status };
    if (req.body.status === 'COMPLETED') changes.completedAt = new Date();
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, $or: [{ buyer: req.user._id }, { seller: req.user._id }], status: 'ARRANGING' },
      { $set: changes }, { new: true },
    );
    if (!transaction) return res.status(404).json({ message: 'Active transaction not found.' });
    await Listing.updateOne({ _id: transaction.listing }, { status: req.body.status === 'COMPLETED' ? 'SOLD' : 'ACTIVE' });
    await transaction.populate([{ path: 'listing', select: 'title images status' }, { path: 'buyer', select: 'name' }, { path: 'seller', select: 'name' }]);
    const recipient = transaction.buyer._id.equals(req.user._id) ? transaction.seller._id : transaction.buyer._id;
    await createNotification({ recipient, actor: req.user._id, type: 'TRANSACTION', title: req.body.status === 'COMPLETED' ? 'Sale marked complete' : 'Arrangement cancelled', body: `${req.user.name} updated the arrangement for ${transaction.listing?.title || 'your furniture'}.`, listing: transaction.listing?._id });
    res.json({ transaction });
  } catch { res.status(500).json({ message: 'Could not update this transaction.' }); }
});
export default router;
