"use strict";

import { Router } from "express";
import { 
  createReview, 
  getReviews, 
  deleteReview, 
  toggleFeaturedReview, 
  getFeaturedReviews 
} from "../controllers/review.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isClient } from "../middlewares/authorization.middleware.js";

const router = Router();

// GET /api/reviews - Listar todas las reseñas
router.get("/", getReviews);

// GET /api/reviews/featured - Obtener solo las reseñas destacadas para la página principal (pública)
router.get("/featured", getFeaturedReviews);

// POST /api/reviews - Crear reseña (Protegida)
router.post("/", verifyAccessToken, isClient, createReview);

// DELETE /api/reviews/:id - Eliminar una reseña (Protegida: dueño o admin)
router.delete("/:id", verifyAccessToken, deleteReview);

// PATCH /api/reviews/:id/featured - Alternar estado destacada para el home (Protegida)
router.patch("/:id/featured", verifyAccessToken, isAdmin, toggleFeaturedReview);

export default router;
