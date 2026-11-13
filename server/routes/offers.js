import { Router } from 'express';
import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
import Listing from '../models/Listing.js';
import requireUser from '../middleware/requireUser.js';
import Transaction from '../models/Transaction.js';
import { createNotification } from '../services/notifications.js';

const router = Router();
router.use(requireUser);

router.get('/', async (req, res) => {
  try {
    const side = req.query.side === 'received' ? 'seller' : 'buyer';
    const offers = await Offer.find({ [side]: req.user._id }).populate('listing', 'title images price status').populate('buyer', 'name').populate('seller', 'name').sort({ createdAt: -1 }).limit(100);
    res.json({ offers });
  } catch { res.status(500).json({ message: 'Could not load your offers.' }); }
});

router.post('/', async (req, res) => {
  try {
    const { listingId, amount, message = '' } = req.body;
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Choose a valid listing.' });
    if (!Number.isFinite(Number(amount)) || Number(amount) < 1) return res.status(400).json({ message: 'Enter a valid offer amount.' });
    const listing = await Listing.findOne({ _id: listingId, status: 'ACTIVE' });
    if (!listing) return res.status(404).json({ message: 'This listing is no longer available.' });
    if (listing.seller.equals(req.user._id)) return res.status(400).json({ message: 'You cannot make an offer on your own listing.' });
    const existing = await Offer.findOne({ listing: listing._id, buyer: req.user._id, status: 'PENDING' });
    if (existing) return res.status(409).json({ message: 'You already have a pending offer for this item.' });
    const offer = await Offer.create({ listing: listing._id, buyer: req.user._id, seller: listing.seller, amount: Number(amount), message });
    await offer.populate([{ path: 'listing', select: 'title images price status' }, { path: 'buyer', select: 'name' }, { path: 'seller', select: 'name' }]);
    await createNotification({ recipient: offer.seller._id, actor: req.user._id, type: 'OFFER', title: 'New price offer', body: `${offer.buyer.name} offered ₹${offer.amount.toLocaleString('en-IN')} for ${offer.listing.title}.`, listing: offer.listing._id });
    res.status(201).json({ offer });
  } catch (error) { res.status(500).json({ message: error.name === 'ValidationError' ? 'Check your offer and try again.' : 'Could not send your offer.' }); }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Offer not found.' });
    const { status, counterPrice } = req.body;
    if (!['ACCEPTED', 'REJECTED', 'COUNTERED'].includes(status)) return res.status(400).json({ message: 'Choose accept, reject, or counter.' });
    if (status === 'COUNTERED' && (!Number.isFinite(Number(counterPrice)) || Number(counterPrice) < 1)) return res.status(400).json({ message: 'Enter a valid counteroffer amount.' });
    const offer = await Offer.findOne({ _id: req.params.id, seller: req.user._id, status: 'PENDING' });
    if (!offer) return res.status(404).json({ message: 'Pending offer not found.' });
    let transaction;
    if (status === 'ACCEPTED') {
      const listing = await Listing.findOneAndUpdate({ _id: offer.listing, status: 'ACTIVE' }, { status: 'RESERVED' }, { new: true });
      if (!listing) return res.status(409).json({ message: 'This listing is no longer available to accept offers.' });
      try {
        transaction = await Transaction.create({ listing: offer.listing, offer: offer._id, buyer: offer.buyer, seller: offer.seller, agreedPrice: offer.amount });
        offer.status = status;
        await offer.save();
      } catch (error) {
        if (transaction) await transaction.deleteOne();
        await Listing.updateOne({ _id: offer.listing, status: 'RESERVED' }, { status: 'ACTIVE' });
        throw error;
      }
    } else {
      offer.status = status;
      if (status === 'COUNTERED') offer.counterPrice = Number(counterPrice);
      await offer.save();
    }
    await offer.populate([{ path: 'listing', select: 'title images price status' }, { path: 'buyer', select: 'name' }, { path: 'seller', select: 'name' }]);
    await createNotification({ recipient: offer.buyer._id, actor: req.user._id, type: 'OFFER_UPDATE', title: status === 'ACCEPTED' ? 'Offer accepted' : status === 'REJECTED' ? 'Offer declined' : 'Counteroffer received', body: status === 'COUNTERED' ? `${offer.seller.name} countered at ₹${offer.counterPrice.toLocaleString('en-IN')} for ${offer.listing.title}.` : `${offer.seller.name} ${status.toLowerCase()} your offer for ${offer.listing.title}.`, listing: offer.listing._id });
    res.json({ offer });
  } catch { res.status(500).json({ message: 'Could not update this offer.' }); }
});

export default router;
