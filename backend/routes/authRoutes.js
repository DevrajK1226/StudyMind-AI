import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import { generateVerificationCode, sendVerificationEmail } from "../utils/emailService.js";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const CODE_EXPIRY_MINUTES = 10;

// Basic email format check (syntax only — real ownership is confirmed by the code)
function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register — creates an unverified user and emails a code
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const code = generateVerificationCode();
    const expires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    let user;
    if (existingUser && !existingUser.isVerified) {
      // They registered before but never verified — update their details and resend a code
      existingUser.name = name;
      existingUser.password = password; // will be re-hashed by the pre-save hook
      existingUser.verificationCode = code;
      existingUser.verificationCodeExpires = expires;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        isVerified: false,
        verificationCode: code,
        verificationCodeExpires: expires,
      });
    }

    try {
      await sendVerificationEmail(user.email, user.name, code);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      return res.status(500).json({
        message:
          "Account created but the verification email failed to send. Check your EMAIL_USER/EMAIL_APP_PASSWORD setup and try resending.",
      });
    }

    res.status(201).json({
      message: "Verification code sent to your email",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-email — confirms the code and activates the account
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ message: "No verification code found. Please request a new one." });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: "This code has expired. Please request a new one." });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/resend-code — generates and sends a fresh code
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    const code = generateVerificationCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.name, code);

    res.json({ message: "A new verification code has been sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        email: user.email,
        needsVerification: true,
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me (protected)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;