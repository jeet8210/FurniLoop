import mongoose from 'mongoose';
const offerSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  counterPrice: { type: Number, min: 1 },
  message: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED'], default: 'PENDING' },
}, { timestamps: true });
offerSchema.index({ listing: 1, buyer: 1, status: 1 });
export default mongoose.model('Offer', offerSchema);
