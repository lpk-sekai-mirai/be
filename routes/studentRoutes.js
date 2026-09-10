import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateInterview, // ⬅️ tambah
  deleteStudent,
} from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", upload.single("foto"), createStudent);
router.put("/:id", upload.single("foto"), updateStudent);
router.put("/:id/interview", updateInterview);
router.delete("/:id", deleteStudent);

export default router;
