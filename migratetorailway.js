import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.migrate" });

// ===== SOURCE (MySQL Lokal) =====
const source = new Sequelize(
  process.env.SRC_DB_NAME,
  process.env.SRC_DB_USER,
  process.env.SRC_DB_PASS,
  {
    host: process.env.SRC_DB_HOST,
    port: process.env.SRC_DB_PORT,
    dialect: "mysql",
    logging: false,
  }
);

// ===== TARGET (Railway MySQL) =====
const target = new Sequelize(
  process.env.TGT_DB_NAME,
  process.env.TGT_DB_USER,
  process.env.TGT_DB_PASS,
  {
    host: process.env.TGT_DB_HOST,
    port: process.env.TGT_DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: { max: 1, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  }
);

// ⚠️ Boleh tulis huruf besar/kecil, script akan auto-detect nama aslinya
const TABLES_IN_ORDER = [
  "Users",
  "Students",
  // tambahkan tabel lain...
];

async function getActualTableName(sequelize, table, dbName) {
  const [rows] = await sequelize.query(
    `SELECT table_name AS name FROM information_schema.tables 
     WHERE table_schema = ? AND LOWER(table_name) = LOWER(?)`,
    { replacements: [dbName, table] }
  );
  return rows[0]?.name || null;
}

async function migrate() {
  const log = [];
  const push = (msg) => {
    console.log(msg);
    log.push(msg);
  };

  try {
    await source.authenticate();
    push("✅ Source (MySQL lokal) connected");

    await target.authenticate();
    push("✅ Target (Railway) connected");

    // ==========================================
    // STEP 1: CLEAN SLATE
    // ==========================================
    push("\n🧹 Membersihkan database target...");
    await target.query("SET FOREIGN_KEY_CHECKS = 0");

    const [existingTables] = await target.query("SHOW TABLES");
    const tableKey = `Tables_in_${process.env.TGT_DB_NAME}`;

    if (existingTables.length > 0) {
      for (const row of existingTables) {
        const tableName = row[tableKey] || Object.values(row)[0];
        push(`   🗑️  DROP TABLE \`${tableName}\``);
        await target.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
      push(`   ✅ ${existingTables.length} tabel lama dihapus`);
    } else {
      push("   ℹ️  Tidak ada tabel lama di target");
    }

    // ==========================================
    // STEP 2: Migrasi tiap tabel
    // ==========================================
    for (const table of TABLES_IN_ORDER) {
      push(`\n⏳ Migrating: ${table}`);

      // Cari nama asli di source (case-insensitive match)
      const sourceTable = await getActualTableName(
        source,
        table,
        process.env.SRC_DB_NAME
      );

      if (!sourceTable) {
        push(`   ⚠️  Tabel "${table}" tidak ada di source — skip`);
        continue;
      }

      // Ambil struktur CREATE TABLE
      const [createRows] = await source.query(
        `SHOW CREATE TABLE \`${sourceTable}\``
      );
      const createSQL = createRows[0]["Create Table"];

      // 🔑 Extract nama tabel ASLI dari SQL (case-sensitive!)
      const match = createSQL.match(/CREATE TABLE `([^`]+)`/i);
      const actualTableName = match ? match[1] : sourceTable;

      push(`   📛 Nama asli tabel: \`${actualTableName}\``);

      // Buat tabel di target
      await target.query(createSQL);
      push(`   ✅ Struktur tabel dibuat`);

      // Ambil data dari source
      const [rows] = await source.query(`SELECT * FROM \`${sourceTable}\``);
      if (rows.length === 0) {
        push(`   ⏭️  Tidak ada data — skip`);
        continue;
      }

      // Bersihkan Buffer
      const cleaned = rows.map((row) => {
        const obj = { ...row };
        for (const key in obj) {
          if (Buffer.isBuffer(obj[key])) obj[key] = obj[key].toString();
        }
        return obj;
      });

      // 🔑 bulkInsert pakai actualTableName (case-sensitive!)
      const BATCH = 500;
      for (let i = 0; i < cleaned.length; i += BATCH) {
        const chunk = cleaned.slice(i, i + BATCH);
        await target.getQueryInterface().bulkInsert(actualTableName, chunk);
      }

      push(`   ✅ ${cleaned.length} baris di-import`);
    }

    // ==========================================
    // STEP 3: Re-enable FK
    // ==========================================
    await target.query("SET FOREIGN_KEY_CHECKS = 1");
    push("\n🔒 FK checks re-enabled");

    fs.writeFileSync("migrate-log.txt", log.join("\n"));
    push("\n🎉 MIGRASI SELESAI!");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ MIGRASI GAGAL:");
    console.error(err.message);
    fs.writeFileSync(
      "migrate-log.txt",
      log.join("\n") + "\n\nERROR:\n" + err.stack
    );
    process.exit(1);
  }
}

migrate();
