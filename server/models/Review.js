import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['VISIBLE', 'HIDDEN'], default: 'VISIBLE' },
}, { timestamps: true });
reviewSchema.index({ transaction: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ recipient: 1, createdAt: -1 });
export default mongoose.model('Review', reviewSchema);
