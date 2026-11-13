import mongoose from 'mongoose';
const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 3000 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  price: { type: Number, required: true, min: 1 },
  originalPrice: { type: Number, min: 1 },
  condition: { type: String, enum: ['Like new', 'Very good', 'Good', 'Fair'], required: true },
  material: { type: String, trim: true, maxlength: 80 },
  dimensions: { type: String, trim: true, maxlength: 120 },
  purchaseYear: { type: Number, min: 1900, max: new Date().getFullYear() },
  images: [{ type: String }],
  location: { city: { type: String, required: true, trim: true, maxlength: 100 }, area: { type: String, trim: true, maxlength: 100 } },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'ACTIVE', 'RESERVED', 'SOLD', 'INACTIVE', 'REJECTED'], default: 'ACTIVE' },
  views: { type: Number, default: 0 },
}, { timestamps: true });
listingSchema.index({ title: 'text', description: 'text', 'location.city': 'text', 'location.area': 'text' });
listingSchema.index({ status: 1, 'location.city': 1, 'location.area': 1 });
export default mongoose.model('Listing', listingSchema);
