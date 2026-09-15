// controllers/studentController.js
import Student from "../models/Student.js";
import { cloudinary } from "../middlewares/upload.js";

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

// ===== Helper: ekstrak public_id dari URL Cloudinary =====
// URL contoh: https://res.cloudinary.com/cloud/image/upload/v123/student-photos/abc.jpg
// public_id : student-photos/abc
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const fileWithExt = parts[parts.length - 1]; // abc.jpg
  const folder = parts[parts.length - 2]; // student-photos
  const fileName = fileWithExt.split(".")[0]; // abc
  return `${folder}/${fileName}`;
};

// ===== Helper: hapus foto dari Cloudinary =====
const deleteCloudinaryPhoto = async (fotoUrl) => {
  if (!fotoUrl) return;
  const publicId = getPublicIdFromUrl(fotoUrl);
  if (!publicId) return;
  try {
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (err) {
    console.error("Gagal hapus foto Cloudinary:", err.message);
  }
};

// =================== CREATE (Hanya Data Dasar) ===================
export const createStudent = async (req, res) => {
  try {
    const { nama, alamat, umur, telp } = req.body;

    const data = {
      nama,
      alamat: alamat || null,
      umur: umur ? parseInt(umur, 10) : null,
      telp: telp || null,
      uid: req.body.uid || generateUID(),
      id: req.body.id || (await generateStudentID()),
      // req.file.path berisi URL Cloudinary lengkap
      foto: req.file ? req.file.path : null,
      statusInterview: "belum",
    };

    const student = await Student.create(data);
    res.status(201).json(student);
  } catch (err) {
    // Kalau gagal, hapus foto yang sudah terlanjur ter-upload
    if (req.file && req.file.path) {
      await deleteCloudinaryPhoto(req.file.path);
    }
    res.status(400).json({ error: err.message });
  }
};

// =================== UPDATE DATA DASAR ===================
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ error: "Siswa tidak ditemukan" });

    const data = {
      nama: req.body.nama,
      alamat: req.body.alamat || null,
      umur: req.body.umur ? parseInt(req.body.umur, 10) : null,
      telp: req.body.telp || null,
    };

    if (req.file) {
      // Hapus foto lama dari Cloudinary
      if (student.foto) await deleteCloudinaryPhoto(student.foto);
      data.foto = req.file.path;
    }

    await student.update(data);
    res.json(student);
  } catch (err) {
    if (req.file && req.file.path) {
      await deleteCloudinaryPhoto(req.file.path);
    }
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

    const allowed = ["belum", "lulus", "tidak lulus"];
    if (!allowed.includes(statusInterview)) {
      return res.status(400).json({ error: "Status interview tidak valid" });
    }

    if (statusInterview === "lulus" && !perusahaanLulus) {
      return res.status(400).json({ error: "Perusahaan lulus wajib diisi" });
    }

    const data = {
      statusInterview,
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

    // Hapus foto dari Cloudinary
    if (student.foto) await deleteCloudinaryPhoto(student.foto);

    await student.destroy();
    res.json({ message: "Siswa dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
