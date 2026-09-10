import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Student = sequelize.define("students", {
  uid: { type: DataTypes.STRING, allowNull: false, unique: true },
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    unique: true,
  },
  nama: { type: DataTypes.STRING, allowNull: false },
  alamat: DataTypes.TEXT,
  foto: DataTypes.STRING,
  umur: DataTypes.INTEGER,
  telp: DataTypes.STRING,
  perusahaanLulus: DataTypes.STRING,
  tanggalKeberangkatan: DataTypes.DATE,
  statusInterview: {
    type: DataTypes.ENUM("belum", "lulus"),
    defaultValue: "belum",
  },
});

export default Student;
