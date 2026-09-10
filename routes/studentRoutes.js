import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateInterview,
  deleteStudent,
} from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", verifyToken, upload.single("foto"), createStudent);
router.put("/:id", verifyToken, upload.single("foto"), updateStudent);
router.put("/:id/interview", verifyToken, updateInterview);
router.delete("/:id", verifyToken, deleteStudent);

export default router;
