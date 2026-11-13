import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['MESSAGE', 'OFFER', 'OFFER_UPDATE', 'TRANSACTION', 'REVIEW'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 240 },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  readAt: Date,
}, { timestamps: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });
export default mongoose.model('Notification', notificationSchema);
