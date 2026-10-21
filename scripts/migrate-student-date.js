import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";
import Student from "../models/Student.js";
import User from "../models/User.js";

async function migrate() {
  try {
    await sequelize.authenticate();

    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("students");

    if (!columns.tanggalKeberangkatan) {
      throw new Error("Kolom tanggalKeberangkatan tidak ditemukan.");
    }

    const type = String(columns.tanggalKeberangkatan.type || "").toLowerCase();

    if (type.includes("varchar") || type.includes("character varying")) {
      console.log("Kolom sudah berupa VARCHAR. Migrasi dilewati.");
      return;
    }

    const backupDir =
      process.env.DB_BACKUP_DIR ||
      path.resolve(process.cwd(), "private-backups");

    await fs.mkdir(backupDir, {
      recursive: true,
      mode: 0o700,
    });

    // Backup kedua tabel sebelum mengubah struktur.
    const [students, users] = await Promise.all([
      Student.findAll({ raw: true }),
      User.findAll({ raw: true }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      originalColumnType: type,
      tables: {
        students: { count: students.length, data: students },
        users: { count: users.length, data: users },
      },
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const backupPath = path.join(backupDir, `pre-migration-${timestamp}.json`);

    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });

    console.log("Backup selesai:", backupPath);

    // Konversi kolom. Nilai tanggal lengkap yang sudah ada
    // dipertahankan sebagai string YYYY-MM-DD jika database
    // menyimpannya sebagai DATE/DATETIME standar.
    await queryInterface.changeColumn("students", "tanggalKeberangkatan", {
      type: DataTypes.STRING(10),
      allowNull: true,
    });

    const verified = await queryInterface.describeTable("students");
    const newType = String(
      verified.tanggalKeberangkatan.type || ""
    ).toLowerCase();

    if (!newType.includes("varchar")) {
      throw new Error(`Verifikasi gagal. Tipe kolom baru: ${newType}`);
    }

    console.log("Migrasi berhasil.");
    console.log("Tipe kolom baru:", newType);
    console.log("Jumlah siswa yang dicadangkan:", students.length);
    console.log("Jumlah pengguna yang dicadangkan:", users.length);
  } catch (error) {
    console.error("Migrasi gagal:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

migrate();
