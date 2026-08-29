import express from "express";

import protect from "../middleware/authMiddleware.js";

import { getSalesReport } from "../controllers/reportController.js";

const router = express.Router();

router.use(protect);

router.get("/sales", getSalesReport);

export default router;
