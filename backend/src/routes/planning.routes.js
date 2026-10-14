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
import { isAdmin, isClient, hasRole } from "../middlewares/authorization.middleware.js";

const router = Router();

// Todas las rutas de planificación requieren estar autenticado
router.use(verifyAccessToken);

// Rutas accesibles por Admin y Cliente
router.get("/", hasRole("admin", "cliente"), getPlannings);
router.get("/:id", hasRole("admin", "cliente"), getPlanningById);
router.post("/:id/performance", hasRole("admin", "cliente"), addPerformanceRecord);

// Rutas exclusivas para el Admin
router.post("/", isAdmin, createPlanning);
router.delete("/:id", isAdmin, deletePlanning);

export default router;