import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const name = String(process.env.ADMIN_NAME || 'FurniLoop Admin').trim();

if (!process.env.MONGODB_URI) {
  console.error('Set MONGODB_URI in .env before creating an admin account.');
  process.exit(1);
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Set a valid ADMIN_EMAIL in .env.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Set ADMIN_PASSWORD in .env to a password with at least 12 characters.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    {
      $set: { name, email, passwordHash, role: 'admin', status: 'ACTIVE', emailVerified: true },
      $unset: { emailVerificationTokenHash: 1, emailVerificationExpires: 1 },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.log(`Admin account ready for ${email}. The password was not printed.`);
} catch (error) {
  console.error(`Could not create admin account: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
