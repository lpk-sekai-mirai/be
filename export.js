// export.js
import fs from "fs";
import sequelize from "./config/database.js";
import Student from "./models/Student.js";
import User from "./models/User.js";

async function exportData() {
  try {
    const students = await Student.findAll({ raw: true });
    const users = await User.findAll({ raw: true });

    fs.writeFileSync("students.json", JSON.stringify(students, null, 2));
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    console.log(`✅ Export selesai: ${students.length} students, ${users.length} users`);
  } catch (err) {
    console.error("❌ Gagal export:", err);
  } finally {
    await sequelize.close();
  }
}

exportData();