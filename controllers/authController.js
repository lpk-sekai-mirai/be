import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import { sendResetEmail } from "../utils/email.js";

export const register = async (req, res) => {
  try {
    const { username, email, noHp, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      noHp,
      password: hashed,
      role: "user",
      status: "pending",
    });
    res.status(201).json({
      message: "Registrasi berhasil, silakan tunggu approval admin",
      user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { username: identifier },
          { noHp: identifier },
        ],
      },
    });
    if (!user) return res.status(401).json({ error: "User tidak ditemukan" });
    if (user.status !== "approved")
      return res.status(403).json({ error: "Akun belum disetujui admin" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Password salah" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email tidak terdaftar" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendResetEmail(user.email, token);
    res.json({ message: "Email reset password terkirim" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });
    if (!user)
      return res
        .status(400)
        .json({ error: "Token tidak valid atau kadaluwarsa" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ message: "Password berhasil direset" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
