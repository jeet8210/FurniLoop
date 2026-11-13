import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import mongoose from "mongoose";
import User from "../models/User.js";
import requireUser from "../middleware/requireUser.js";
import { sendAccountLink } from "../services/mail.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 12 : 100,
  // Let local development accounts be retried freely; keep the stricter cap in production.
  skip: () => process.env.NODE_ENV !== "production",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again in a little while.",
  },
});
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const makeToken = () => randomBytes(32).toString("hex");
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});
function issueSession(user, res) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("furniloop_token", token, cookieOptions());
  return publicUser(user);
}

router.post("/register", authLimiter, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res
        .status(503)
        .json({
          message:
            "Accounts are temporarily unavailable because the database is not connected. Configure MONGODB_URI and restart the API.",
        });
    }
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || name.length > 80)
      return res
        .status(400)
        .json({ message: "Name must be between 2 and 80 characters." });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    if (await User.exists({ email }))
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const bootstrapAdmin =
      String(process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase() === email && Boolean(process.env.ADMIN_EMAIL);
    const token = makeToken();
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: bootstrapAdmin ? "admin" : "user",
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await sendAccountLink({
      to: email,
      subject: "Verify your FurniLoop email",
      heading: "Welcome to FurniLoop",
      text: "Verify your email address to activate your account. This link expires in 24 hours.",
      tokenName: "verify",
      token,
    });
    res
      .status(201)
      .json({
        message: "Account created. Check your email for a verification link.",
      });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    console.error("Account registration failed:", error.message);
    res.status(500).json({ message: "Could not create your account." });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (
      !user ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        user.passwordHash,
      ))
    )
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    if (!user.emailVerified)
      return res
        .status(403)
        .json({
          message: "Verify your email before signing in.",
          code: "EMAIL_UNVERIFIED",
        });
    res.json({ user: issueSession(user, res) });
  } catch {
    res.status(500).json({ message: "Could not sign you in." });
  }
});

router.post("/admin-login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email, role: "admin" }).select(
      "+passwordHash",
    );
    if (
      !user ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        user.passwordHash,
      ))
    )
      return res
        .status(401)
        .json({ message: "Administrator email or password is incorrect." });
    if (user.status !== "ACTIVE")
      return res
        .status(403)
        .json({ message: "This administrator account is disabled." });
    if (!user.emailVerified)
      return res
        .status(403)
        .json({
          message: "Verify this email before signing in.",
          code: "EMAIL_UNVERIFIED",
        });
    res.json({ user: issueSession(user, res) });
  } catch {
    res.status(500).json({ message: "Could not sign in to the admin panel." });
  }
});

router.post("/verify", authLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || "");
    if (token.length < 32)
      return res
        .status(400)
        .json({ message: "Verification link is invalid or expired." });
    const user = await User.findOneAndUpdate(
      {
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpires: { $gt: new Date() },
      },
      {
        $set: { emailVerified: true },
        $unset: { emailVerificationTokenHash: 1, emailVerificationExpires: 1 },
      },
      { new: true },
    );
    if (!user)
      return res
        .status(400)
        .json({ message: "Verification link is invalid or expired." });
    res.json({ message: "Email verified. You can now sign in." });
  } catch {
    res.status(500).json({ message: "Could not verify this email." });
  }
});

router.post("/resend-verification", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email, emailVerified: false });
    if (user) {
      const token = makeToken();
      user.emailVerificationTokenHash = hashToken(token);
      user.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );
      await user.save();
      await sendAccountLink({
        to: user.email,
        subject: "Verify your FurniLoop email",
        heading: "Verify your email",
        text: "Use this link to activate your FurniLoop account. It expires in 24 hours.",
        tokenName: "verify",
        token,
      });
    }
    res.json({
      message: "If the account needs verification, a fresh link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification failed:", error);
    res.status(500).json({ message: "Could not send a verification link." });
  }
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email, status: "ACTIVE" });
    if (user) {
      const token = makeToken();
      user.passwordResetTokenHash = hashToken(token);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendAccountLink({
        to: user.email,
        subject: "Reset your FurniLoop password",
        heading: "Choose a new password",
        text: "Use this link to reset your password. It expires in one hour.",
        tokenName: "reset",
        token,
      });
    }
    res.json({
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch {
    res.status(500).json({ message: "Could not send a password reset link." });
  }
});

router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
      status: "ACTIVE",
    }).select("+passwordHash");
    if (!user)
      return res
        .status(400)
        .json({ message: "Password reset link is invalid or expired." });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.emailVerified = true;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: "Password updated. You can sign in now." });
  } catch {
    res.status(500).json({ message: "Could not reset your password." });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("furniloop_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ message: "Signed out." });
});

router.get("/me", requireUser, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);
router.get("/favorites", requireUser, async (req, res) => {
  try {
    const user = await req.user.populate({
      path: "favorites",
      match: { status: "ACTIVE" },
      populate: { path: "seller", select: "name" },
    });
    res.json({ listings: user.favorites });
  } catch {
    res.status(500).json({ message: "Could not load your saved listings." });
  }
});

export default router;
