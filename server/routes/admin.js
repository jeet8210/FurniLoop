import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Offer from '../models/Offer.js';
import Report from '../models/Report.js';
import Review from '../models/Review.js';
import requireUser from '../middleware/requireUser.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = Router();
router.use(requireUser, requireAdmin);

router.get('/summary', async (_req, res) => {
  try {
    const [users, active, pending, sold, openReports, offers] = await Promise.all([
      User.countDocuments(), Listing.countDocuments({ status: 'ACTIVE' }), Listing.countDocuments({ status: 'PENDING' }),
      Listing.countDocuments({ status: 'SOLD' }), Report.countDocuments({ status: 'OPEN' }), Offer.countDocuments({ status: 'PENDING' }),
    ]);
    res.json({ users, activeListings: active, pendingListings: pending, soldListings: sold, openReports, pendingOffers: offers });
  } catch { res.status(500).json({ message: 'Could not load marketplace statistics.' }); }
});

router.get('/listings', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const listings = await Listing.find(filter).populate('seller', 'name email').sort({ createdAt: -1 }).limit(100);
    res.json({ listings });
  } catch { res.status(500).json({ message: 'Could not load listings for moderation.' }); }
});

router.patch('/listings/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Listing not found.' });
    if (!['ACTIVE', 'REJECTED', 'INACTIVE'].includes(req.body.status)) return res.status(400).json({ message: 'Choose an allowed moderation status.' });
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    res.json({ listing });
  } catch { res.status(500).json({ message: 'Could not update this listing.' }); }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('name email role status createdAt').sort({ createdAt: -1 }).limit(200);
    res.json({ users });
  } catch { res.status(500).json({ message: 'Could not load users.' }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' });
    if (!['ACTIVE', 'BLOCKED'].includes(req.body.status)) return res.status(400).json({ message: 'Choose an allowed account status.' });
    if (String(req.user._id) === req.params.id && req.body.status === 'BLOCKED') return res.status(400).json({ message: 'You cannot block your own admin account.' });
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select('name email role status');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch { res.status(500).json({ message: 'Could not update this account.' }); }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find(req.query.status ? { status: req.query.status } : {}).populate('listing', 'title images status seller').populate('reporter', 'name email').sort({ createdAt: -1 }).limit(200);
    res.json({ reports });
  } catch { res.status(500).json({ message: 'Could not load reports.' }); }
});

router.patch('/reports/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Report not found.' });
    if (!['REVIEWED', 'DISMISSED'].includes(req.body.status)) return res.status(400).json({ message: 'Choose reviewed or dismissed.' });
    const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status, reviewedBy: req.user._id }, { new: true }).populate('listing', 'title status').populate('reporter', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json({ report });
  } catch { res.status(500).json({ message: 'Could not update this report.' }); }
});

router.get('/reviews', async (_req, res) => {
  try {
    const reviews = await Review.find().populate('reviewer', 'name').populate('recipient', 'name').populate('transaction', 'listing').sort({ createdAt: -1 }).limit(200);
    res.json({ reviews });
  } catch { res.status(500).json({ message: 'Could not load reviews.' }); }
});

router.patch('/reviews/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Review not found.' });
    if (!['VISIBLE', 'HIDDEN'].includes(req.body.status)) return res.status(400).json({ message: 'Choose visible or hidden.' });
    const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('reviewer', 'name').populate('recipient', 'name');
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    res.json({ review });
  } catch { res.status(500).json({ message: 'Could not update this review.' }); }
});

export default router;
