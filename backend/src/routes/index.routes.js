"use strict";

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import reviewRoutes from "./review.routes.js";
import userRoutes from "./user.routes.js";
import sesionRoutes from "./sesion.routes.js";
const router = Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de reseñas
router.use("/reviews", reviewRoutes);

//Rutas de user
router.use("/users",userRoutes);

//Rutas de sesiones
router.use("/sesion", sesionRoutes);


export default router;