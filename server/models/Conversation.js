import mongoose from 'mongoose';
const conversationSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });
conversationSchema.index({ listing: 1, buyer: 1 }, { unique: true });
export default mongoose.model('Conversation', conversationSchema);
