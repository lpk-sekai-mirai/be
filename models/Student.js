import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    uid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alamat: DataTypes.TEXT,
    foto: DataTypes.STRING,
    umur: DataTypes.INTEGER,
    telp: DataTypes.STRING,

    // ===== FIELD BARU: Hasil Interview =====
    statusInterview: {
      type: DataTypes.ENUM("belum", "lulus", "tidak lulus"),
      defaultValue: "belum",
      allowNull: false,
    },
    perusahaanLulus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tanggalKeberangkatan: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  { timestamps: true, tableName: "Students" }
);

export default Student;
