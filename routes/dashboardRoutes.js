import express from "express";
import { getStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getStats);

export default router;
