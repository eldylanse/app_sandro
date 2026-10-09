"use strict";

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import reviewRoutes from "./review.routes.js";

const router = Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de reseñas
router.use("/reviews", reviewRoutes);

export default router;