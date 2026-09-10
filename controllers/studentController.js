import Student from "../models/Student.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Helper: generate UID unik =====
const generateUID = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SMC-${timestamp}-${random}`;
};

// ===== Helper: generate ID berurutan =====
const generateStudentID = async () => {
  const lastStudent = await Student.findOne({ order: [["createdAt", "DESC"]] });
  let nextNumber = 1;
  if (lastStudent && lastStudent.id) {
    const match = lastStudent.id.match(/(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }
  return `SMC-${String(nextNumber).padStart(4, "0")}`;
};

// ===== Helper: hapus foto lama =====
const deleteOldPhoto = (fotoPath) => {
  if (!fotoPath) return;
  const filename = path.basename(fotoPath);
  const filePath = path.join(__dirname, "..", "uploads", filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// =================== CREATE (Hanya Data Dasar) ===================
export const createStudent = async (req, res) => {
  try {
    // 🔑 Whitelist — hanya field dasar yang boleh masuk
    const { nama, alamat, umur, telp } = req.body;

    const data = {
      nama,
      alamat: alamat || null,
      umur: umur ? parseInt(umur, 10) : null,
      telp: telp || null,
      uid: req.body.uid || generateUID(),
      id: req.body.id || (await generateStudentID()),
      foto: req.file ? `/uploads/${req.file.filename}` : null,
      statusInterview: "belum", // default
    };

    const student = await Student.create(data);
    res.status(201).json(student);
  } catch (err) {
    if (req.file) deleteOldPhoto(`/uploads/${req.file.filename}`);
    res.status(400).json({ error: err.message });
  }
};

// =================== UPDATE DATA DASAR ===================
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ error: "Siswa tidak ditemukan" });

    // 🔑 Whitelist — hanya data dasar yang bisa diubah di sini
    const data = {
      nama: req.body.nama,
      alamat: req.body.alamat || null,
      umur: req.body.umur ? parseInt(req.body.umur, 10) : null,
      telp: req.body.telp || null,
    };

    if (req.file) {
      if (student.foto) deleteOldPhoto(student.foto);
      data.foto = `/uploads/${req.file.filename}`;
    }

    await student.update(data);
    res.json(student);
  } catch (err) {
    if (req.file) deleteOldPhoto(`/uploads/${req.file.filename}`);
    res.status(400).json({ error: err.message });
  }
};

// =================== UPDATE HASIL INTERVIEW ===================
export const updateInterview = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ error: "Siswa tidak ditemukan" });

    const { statusInterview, perusahaanLulus, tanggalKeberangkatan } = req.body;

    // Validasi status
    const allowed = ["belum", "lulus", "tidak lulus"];
    if (!allowed.includes(statusInterview)) {
      return res.status(400).json({ error: "Status interview tidak valid" });
    }

    // Kalau status "lulus", perusahaan wajib diisi
    if (statusInterview === "lulus" && !perusahaanLulus) {
      return res.status(400).json({ error: "Perusahaan lulus wajib diisi" });
    }

    const data = {
      statusInterview,
      // Kalau tidak lulus, kosongkan perusahaan & tanggal
      perusahaanLulus: statusInterview === "lulus" ? perusahaanLulus : null,
      tanggalKeberangkatan:
        statusInterview === "lulus" && tanggalKeberangkatan
          ? tanggalKeberangkatan
          : null,
    };

    await student.update(data);
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =================== READ ===================
export const getStudents = async (req, res) => {
  try {
    const students = await Student.findAll({ order: [["createdAt", "DESC"]] });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ error: "Siswa tidak ditemukan" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =================== DELETE ===================
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ error: "Siswa tidak ditemukan" });
    if (student.foto) deleteOldPhoto(student.foto);
    await student.destroy();
    res.json({ message: "Siswa dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
