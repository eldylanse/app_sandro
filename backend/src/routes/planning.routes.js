"use strict";

import { Router } from "express";
import {
  createPlanning,
  updatePlanning,
  getPlannings,
  getPlanningById,
  addPerformanceRecord,
  deletePlanning,
  updateTrainingDayStatus,
} from "../controllers/planning.controller.js";
import {
  getPlanningTrainingDaySurveys,
  getTrainingDaySurvey,
  saveTrainingDaySurvey,
} from "../controllers/training-day-survey.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isClient, hasRole } from "../middlewares/authorization.middleware.js";

const router = Router();

// Todas las rutas de planificación requieren estar autenticado
router.use(verifyAccessToken);

// Rutas accesibles por Admin y Cliente
router.get("/", hasRole("admin", "cliente"), getPlannings);
router.get("/:id", hasRole("admin", "cliente"), getPlanningById);
router.post("/:id/performance", hasRole("admin", "cliente"), addPerformanceRecord);
router.patch("/:id/dias/estado", isClient, updateTrainingDayStatus);
router.get("/:planningId/dias/:dayId/encuesta", isClient, getTrainingDaySurvey);
router.put("/:planningId/dias/:dayId/encuesta", isClient, saveTrainingDaySurvey);
router.get("/:planningId/encuestas", isAdmin, getPlanningTrainingDaySurveys);

// Rutas exclusivas para el Admin
router.post("/", isAdmin, createPlanning);
router.put("/:id", isAdmin, updatePlanning);
router.delete("/:id", isAdmin, deletePlanning);

export default router;
