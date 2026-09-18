import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Student = sequelize.define("students", {
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

  // =========================
  // DATA INDONESIA
  // =========================
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

  // =========================
  // DATA BAHASA JEPANG
  // =========================
  namaJepang: {
    type: DataTypes.STRING,
  },

  alamatJepang: {
    type: DataTypes.TEXT,
  },

  perusahaanLulusJepang: {
    type: DataTypes.STRING,
  },

  // =========================
  // DATA LAINNYA
  // =========================
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
});

export default Student;