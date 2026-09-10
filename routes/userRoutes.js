import express from "express";
import {
  getUsers,
  approveUser,
  changeRole,
} from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getUsers);
router.put("/:id/approve", verifyToken, isAdmin, approveUser);
router.put("/:id/role", verifyToken, isAdmin, changeRole);

export default router;
