/** @format */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import multer from "multer";
import User from "../models/User.js";
import { uploadBuffer } from "../services/cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Hardcoded admin credentials for admin-login route
const ADMIN_EMAIL = "admin@store.com";
const ADMIN_PASSWORD = "Admin@123";

// --------------------- REGISTER ---------------------
router.post(
  "/register",
  upload.single("avatar"),
  [
    body("username").notEmpty().withMessage("username is required"),
    body("email").isEmail().withMessage("email must be valid"),
    body("password")
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        "password must be 8+ chars and include upper, lower, number, symbol"
      ),
    body("confirmPassword")
      .optional()
      .custom((value, { req }) => !value || value === req.body.password)
      .withMessage("confirmPassword must match password"),
    body("phone").notEmpty().withMessage("phone is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { username, email, password, phone } = req.body;

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return res.status(409).json({ error: "Email already exists" });

      // Check if phone already exists
      const existingPhone = await User.findOne({ phone });
      if (existingPhone)
        return res.status(409).json({ error: "Phone number already exists" });

      const passwordHash = await bcrypt.hash(password, 10);

      let avatarUrl;
      if (req.file) {
        const up = await uploadBuffer(req.file.buffer, "avatars");
        avatarUrl = up.secure_url;
      }

      const userCount = await User.countDocuments();
      const role = userCount === 0 ? "admin" : "user";

      const user = await User.create({
        username,
        email,
        phone,
        passwordHash,
        role,
        avatarUrl,
      });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: { id: user.id, username, email, role: user.role },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// --------------------- LOGIN ---------------------
router.post(
  "/login",
  [body("email").isEmail(), body("password").isString()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: { id: user.id, username: user.username, email, role: user.role },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// --------------------- ADMIN LOGIN ---------------------
router.post("/admin-login", upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Ensure an admin user exists
    let user = await User.findOne({ email: ADMIN_EMAIL });
    if (!user) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await User.create({
        username: "Admin",
        email: ADMIN_EMAIL,
        phone: "admin",
        passwordHash,
        role: "admin",
      });
    } else if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
