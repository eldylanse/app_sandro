"use strict";

import { createReviewService, getReviewsService } from "../services/review.service.js";

// Controlador para crear una reseña
export const createReview = async (req, res) => {
  try {
    // Tomamos el id del cliente desde el usuario autenticado (si ya usas middleware de token)
    // O temporalmente desde el body si lo estás probando de forma directa.
    const id_cliente = req.user ? req.user.id : req.body.id_cliente;

    if (!id_cliente) {
      return res.status(401).json({
        message: "No autorizado. Se requiere un ID de cliente válido.",
      });
    }

    const newReview = await createReviewService(id_cliente, req.body);

    return res.status(201).json({
      message: "¡Reseña creada exitosamente!",
      review: newReview,
    });
  } catch (error) {
    console.error("Error al crear la reseña:", error.message);
    return res.status(400).json({
      message: error.message || "Error interno del servidor al crear la reseña.",
    });
  }
};

// Controlador para listar todas las reseñas
export const getReviews = async (req, res) => {
  try {
    const reviews = await getReviewsService();

    return res.status(200).json({
      message: "Reseñas obtenidas exitosamente.",
      reviews,
    });
  } catch (error) {
    console.error("Error al obtener las reseñas:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor al obtener las reseñas.",
      error: error.message,
    });
  }
};