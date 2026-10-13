"use strict";

import { Router } from "express";
import {
  createPlanning,
  getPlannings,
  getPlanningById,
  addPerformanceRecord,
  deletePlanning,
} from "../controllers/planning.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas de planificación requieren estar autenticado
router.use(verifyAccessToken);

router.get("/", getPlannings);
router.get("/:id", getPlanningById);
router.post("/", createPlanning);
router.post("/:id/performance", addPerformanceRecord); // Ruta para registrar peso y repeticiones reales
router.delete("/:id", deletePlanning);

export default router;