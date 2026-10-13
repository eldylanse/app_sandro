"use strict";

import { Router } from "express";
import {
  createExercise,
  getExercises,
  updateExercise,
  deleteExercise,
} from "../controllers/exercise.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Middleware base para todas las rutas de ejercicios
router.use(verifyAccessToken);

// Opcional: Podrías añadir un middleware de verificación de rol de administrador aquí si ya lo tienes,
// por ejemplo: router.use(verifyAdminRole);

router.get("/", getExercises);
router.post("/", createExercise);
router.put("/:id", updateExercise);
router.delete("/:id", deleteExercise);

export default router;