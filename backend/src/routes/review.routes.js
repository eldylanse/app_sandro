"use strict";

import { Router } from "express";
import { createReview, getReviews } from "../controllers/review.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/reviews - Listar todas las reseñas (pública o protegida, según prefieras)
router.get("/", getReviews);

// POST /api/reviews - Crear reseña (Protegida por el middleware de autenticación)
router.post("/", verifyAccessToken, createReview);

export default router;