import sequelize from "../config/database.js";
import Student from "../models/Student.js";

// Data referensi untuk generate dummy
const namaDepan = [
  "Ahmad","Budi","Citra","Dewi","Eko","Fajar","Gita","Hadi","Indah","Joko",
  "Kartika","Lukman","Maya","Nanda","Oki","Putri","Rizki","Sari","Tono","Umi",
  "Vina","Wahyu","Yanti","Zainal","Ani"
];
const namaBelakang = [
  "Pratama","Saputra","Wijaya","Lestari","Nugroho","Hidayat","Ramadhan",
  "Permata","Setiawan","Kusuma"
];
const kota = [
  "Jakarta","Bandung","Surabaya","Yogyakarta","Medan",
  "Semarang","Makassar","Bali","Malang","Palembang"
];
const perusahaan = [
  "PT. Astra Indonesia","PT. Toyota Motor","PT. Unilever","PT. Pertamina",
  "PT. Telkom Indonesia","PT. Bank Mandiri","PT. Garuda Indonesia",
  "PT. Bukit Asam","PT. Wijaya Karya","PT. Kalbe Farma"
];
const statusList = ["belum", "lulus", "tidak lulus"];

// Helper
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate tanggal random (YYYY-MM-DD) dalam 1 tahun ke depan
const randDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + randInt(1, 365));
  return d.toISOString().split("T")[0];
};

// Generate 50 data dummy
const generateStudents = () => {
  const students = [];
  for (let i = 1; i <= 50; i++) {
    const nama = `${rand(namaDepan)} ${rand(namaBelakang)}`;
    const statusInterview = rand(statusList);

    // Logika bisnis: hanya yang "lulus" yang punya perusahaan & tanggal keberangkatan
    const isLulus = statusInterview === "lulus";

    students.push({
      id: `STD-${String(i).padStart(4, "0")}`,
      uid: `UID-${Date.now()}-${i}`, // harus unik
      nama,
      alamat: `${rand(kota)}, Indonesia`,
      foto: `/uploads/dummy-${(i % 5) + 1}.jpg`, // gunakan 5 file dummy berulang
      umur: randInt(18, 30),
      telp: `08${randInt(1000000000, 9999999999)}`,
      statusInterview,
      perusahaanLulus: isLulus ? rand(perusahaan) : null,
      tanggalKeberangkatan: isLulus ? randDate() : null,
    });
  }
  return students;
};

// Jalankan seeder
const runSeeder = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    // Sinkronisasi tabel (buat kalau belum ada)
    await sequelize.sync();

    const data = generateStudents();

    // bulkCreate = insert banyak sekaligus (efisien, bukan loop satu-satu)
    await Student.bulkCreate(data, { validate: true });

    console.log(`✅ Berhasil insert ${data.length} data dummy.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal seed:", err);
    process.exit(1);
  }
};

runSeeder();