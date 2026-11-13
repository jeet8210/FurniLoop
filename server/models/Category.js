import mongoose from 'mongoose';
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 40 },
  icon: { type: String, trim: true, maxlength: 8, default: '✳' },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('Category', categorySchema);
