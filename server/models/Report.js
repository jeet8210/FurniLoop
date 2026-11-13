import mongoose from 'mongoose';
const reportSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['Misleading information', 'Prohibited item', 'Suspicious seller', 'Duplicate listing', 'Other'], required: true },
  details: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['OPEN', 'REVIEWED', 'DISMISSED'], default: 'OPEN' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
reportSchema.index({ listing: 1, reporter: 1 }, { unique: true });
export default mongoose.model('Report', reportSchema);
