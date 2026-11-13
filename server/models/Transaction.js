import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true, unique: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agreedPrice: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['ARRANGING', 'COMPLETED', 'CANCELLED'], default: 'ARRANGING' },
  completedAt: Date,
}, { timestamps: true });
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });
export default mongoose.model('Transaction', transactionSchema);
