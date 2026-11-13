import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
  emailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationExpires: Date,
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: Date,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
