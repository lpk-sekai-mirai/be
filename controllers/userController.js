import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    user.status = "approved";
    await user.save();
    res.json({ message: "User berhasil disetujui", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    user.role = role;
    await user.save();
    res.json({ message: "Role berhasil diubah", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
