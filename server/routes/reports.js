import { Router } from 'express';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Listing from '../models/Listing.js';
import requireUser from '../middleware/requireUser.js';

const router = Router();
router.post('/', requireUser, async (req, res) => {
  try {
    const { listingId, reason, details = '' } = req.body;
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Choose a valid listing.' });
    if (!['Misleading information', 'Prohibited item', 'Suspicious seller', 'Duplicate listing', 'Other'].includes(reason)) return res.status(400).json({ message: 'Choose a report reason.' });
    const listing = await Listing.findOne({ _id: listingId, status: 'ACTIVE' });
    if (!listing) return res.status(404).json({ message: 'This listing is no longer available.' });
    if (listing.seller.equals(req.user._id)) return res.status(400).json({ message: 'You cannot report your own listing.' });
    const report = await Report.create({ listing: listing._id, reporter: req.user._id, reason, details });
    res.status(201).json({ report: { id: report._id, status: report.status } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You already reported this listing.' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
    res.status(500).json({ message: 'Could not send this report.' });
  }
});
export default router;
