import Student from "../models/Student.js";
import { Op } from "sequelize";

export const getStats = async (req, res) => {
  try {
    const total = await Student.count();

    // Hitung yang lulus interview
    // ⚠️ Ini butuh field `statusInterview` di model Student
    let totalLulusInterview = 0;
    try {
      totalLulusInterview = await Student.count({
        where: { statusInterview: "lulus" },
      });
    } catch {
      // Kalau field statusInterview belum ada, biarkan 0
      totalLulusInterview = 0;
    }

    // Hitung yang sudah berangkat
    const totalBerangkat = await Student.count({
      where: { tanggalKeberangkatan: { [Op.not]: null } },
    });

    // Ambil 5 foto terbaru
    const photos = await Student.findAll({
      attributes: ["foto", "nama"],
      where: { foto: { [Op.not]: null } }, // hanya yang punya foto
      limit: 5,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      total,
      totalLulusInterview,
      totalBerangkat,
      photos: photos.map((p) => ({
        nama: p.nama,
        foto: p.foto,
      })),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};
