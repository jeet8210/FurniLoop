import { Router } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import requireUser from '../middleware/requireUser.js';
import { createNotification } from '../services/notifications.js';
import { emitToConversation } from '../services/realtime.js';

const router = Router();
router.use(requireUser);

router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id }).populate('listing', 'title images price status').populate('buyer', 'name').populate('seller', 'name').sort({ lastMessageAt: -1 }).limit(50);
    res.json({ conversations });
  } catch { res.status(500).json({ message: 'Could not load your conversations.' }); }
});

router.post('/', async (req, res) => {
  try {
    const { listingId, message = '' } = req.body;
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Choose a valid listing.' });
    const listing = await Listing.findOne({ _id: listingId, status: 'ACTIVE' });
    if (!listing) return res.status(404).json({ message: 'This listing is no longer available.' });
    if (listing.seller.equals(req.user._id)) return res.status(400).json({ message: 'You cannot message yourself about your own listing.' });
    let conversation = await Conversation.findOne({ listing: listing._id, buyer: req.user._id });
    if (!conversation) {
      try { conversation = await Conversation.create({ listing: listing._id, buyer: req.user._id, seller: listing.seller, participants: [req.user._id, listing.seller] }); }
      catch (error) { if (error.code === 11000) conversation = await Conversation.findOne({ listing: listing._id, buyer: req.user._id }); else throw error; }
    }
    const body = String(message).trim();
    if (body) {
      const newMessage = await Message.create({ conversation: conversation._id, sender: req.user._id, body });
      conversation.lastMessageAt = newMessage.createdAt;
      await conversation.save();
    }
    await conversation.populate('listing', 'title images price status');
    res.status(201).json({ conversation });
  } catch (error) { res.status(500).json({ message: error.name === 'ValidationError' ? 'Message is too long.' : 'Could not start this conversation.' }); }
});

router.get('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Conversation not found.' });
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    const messages = await Message.find({ conversation: conversation._id }).populate('sender', 'name').sort({ createdAt: 1 }).limit(100);
    res.json({ messages });
  } catch { res.status(500).json({ message: 'Could not load messages.' }); }
});

router.post('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Conversation not found.' });
    const body = String(req.body.body || '').trim();
    if (!body || body.length > 2000) return res.status(400).json({ message: 'Message must be between 1 and 2,000 characters.' });
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    const message = await Message.create({ conversation: conversation._id, sender: req.user._id, body });
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    await message.populate('sender', 'name');
    const recipient = conversation.participants.find((participant) => !participant.equals(req.user._id));
    await createNotification({ recipient, actor: req.user._id, type: 'MESSAGE', title: 'New message', body: `${req.user.name}: ${body.slice(0, 150)}`, conversation: conversation._id, listing: conversation.listing });
    emitToConversation(conversation._id.toString(), 'message:new', message.toObject());
    res.status(201).json({ message });
  } catch { res.status(500).json({ message: 'Could not send this message.' }); }
});

export default router;
