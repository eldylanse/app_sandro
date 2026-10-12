"use strict";

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import reviewRoutes from "./review.routes.js";
import exerciseRoutes from "./exercise.routes.js";
import planningRoutes from "./planning.routes.js";

const router = Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de reseñas
router.use("/reviews", reviewRoutes);

// Rutas de ejercicios
router.use("/exercises", exerciseRoutes);

// Rutas de planificación
router.use("/plannings", planningRoutes);

export default router;