import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

// 🔑 Setup __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Serve folder uploads sebagai static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);

sequelize
  .sync()
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
