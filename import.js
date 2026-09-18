// import.js
import fs from "fs";
import sequelize from "./config/database.js";
import Student from "./models/Student.js";
import User from "./models/User.js";

// ====== KONFIGURASI ======
// "skip"     -> lewati jika data dengan ID yang sama sudah ada
// "overwrite"-> update jika sudah ada, insert jika belum
// "fresh"    -> hapus semua data lama dulu, baru insert (HATI-HATI!)
const MODE = "skip";
// =========================

async function importData() {
  try {
    // 1. Cek file ada
    if (!fs.existsSync("students.json") || !fs.existsSync("users.json")) {
      throw new Error(
        "File students.json atau users.json tidak ditemukan. Jalankan export.js dulu."
      );
    }

    const students = JSON.parse(fs.readFileSync("students.json", "utf-8"));
    const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));

    console.log(`📦 Ditemukan: ${students.length} students, ${users.length} users`);

    // 2. Mode "fresh" -> hapus semua data lama
    if (MODE === "fresh") {
      console.log("⚠️  Mode FRESH: menghapus semua data lama...");
      await Student.destroy({ where: {}, truncate: true, cascade: true });
      await User.destroy({ where: {}, truncate: true, cascade: true });
    }

    // 3. Import Users
    let userInserted = 0,
      userUpdated = 0,
      userSkipped = 0;

    for (const u of users) {
      const existing = await User.findByPk(u.id);
      if (existing) {
        if (MODE === "overwrite") {
          await existing.update(u);
          userUpdated++;
        } else {
          userSkipped++;
        }
      } else {
        await User.create(u);
        userInserted++;
      }
    }

    // 4. Import Students
    let studentInserted = 0,
      studentUpdated = 0,
      studentSkipped = 0;

    for (const s of students) {
      const existing = await Student.findByPk(s.id);
      if (existing) {
        if (MODE === "overwrite") {
          await existing.update(s);
          studentUpdated++;
        } else {
          studentSkipped++;
        }
      } else {
        await Student.create(s);
        studentInserted++;
      }
    }

    // 5. Reset auto-increment sequence untuk PostgreSQL (opsional)
    // Supaya ID baru setelah import tidak bentrok
    if (sequelize.getDialect() === "postgres") {
      await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))`
      );
      console.log("🔧 Sequence 'users.id' sudah direset.");
    }

    // 6. Ringkasan
    console.log("\n✅ Import selesai!");
    console.log("👤 Users:");
    console.log(`   - Inserted: ${userInserted}`);
    console.log(`   - Updated : ${userUpdated}`);
    console.log(`   - Skipped : ${userSkipped}`);
    console.log("🎓 Students:");
    console.log(`   - Inserted: ${studentInserted}`);
    console.log(`   - Updated : ${studentUpdated}`);
    console.log(`   - Skipped : ${studentSkipped}`);
  } catch (err) {
    console.error("❌ Gagal import:", err.message);
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

importData();