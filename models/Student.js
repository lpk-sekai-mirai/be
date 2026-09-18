import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Student = sequelize.define(
  "students",
  {
    uid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alamat: {
      type: DataTypes.TEXT,
    },
    perusahaanLulus: {
      type: DataTypes.STRING,
    },
    namaJepang: {
      type: DataTypes.STRING,
    },
    alamatJepang: {
      type: DataTypes.TEXT,
    },
    perusahaanLulusJepang: {
      type: DataTypes.STRING,
    },
    foto: {
      type: DataTypes.STRING,
    },
    umur: {
      type: DataTypes.INTEGER,
    },
    telp: {
      type: DataTypes.STRING,
    },
    tanggalKeberangkatan: {
      type: DataTypes.DATE,
    },
    statusInterview: {
      type: DataTypes.ENUM("belum", "lulus"),
      defaultValue: "belum",
    },
  },
  {
    hooks: {},
  }
);

// Override toJSON() — dipanggil otomatis saat res.json(student)
const originalToJSON = Student.prototype.toJSON;
Student.prototype.toJSON = function () {
  const values = originalToJSON.call(this);

  // Format tanggalKeberangkatan menjadi YYYY-MM-DD tanpa timezone
  if (values.tanggalKeberangkatan) {
    const d = new Date(values.tanggalKeberangkatan);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      values.tanggalKeberangkatan = `${year}-${month}-${day}`;
    }
  }

  return values;
};

export default Student;
