import express from "express";
import { getStats } from "../controllers/dashboardController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", verifyToken, getStats);

export default router;
