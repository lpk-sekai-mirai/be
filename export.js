import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sequelize from "./config/database.js";
import Student from "./models/Student.js";
import User from "./models/User.js";

async function exportData() {
  try {
    await sequelize.authenticate();

    // Atur DB_BACKUP_DIR ke direktori privat di server.
    const backupDir =
      process.env.DB_BACKUP_DIR ||
      path.resolve(process.cwd(), "private-backups");

    await fs.mkdir(backupDir, {
      recursive: true,
      mode: 0o700,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const [students, users] = await Promise.all([
      Student.findAll({ raw: true }),
      User.findAll({ raw: true }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      tables: {
        students: {
          count: students.length,
          data: students,
        },
        users: {
          count: users.length,
          data: users,
        },
      },
    };

    const filePath = path.join(backupDir, `database-backup-${timestamp}.json`);

    await fs.writeFile(filePath, JSON.stringify(backup, null, 2), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });

    console.log("Export database berhasil.");
    console.log(`Students: ${students.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Lokasi backup: ${filePath}`);
  } catch (error) {
    console.error("Gagal export database:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

exportData();
