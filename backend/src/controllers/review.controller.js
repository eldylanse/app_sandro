"use strict";

import { 
  createReviewService, 
  getReviewsService, 
  deleteReviewService, 
  toggleFeaturedReviewService, 
  getFeaturedReviewsService 
} from "../services/review.service.js";

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

// Controlador para eliminar una reseña
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params; // ID de la reseña a eliminar
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await deleteReviewService(id, userId, userRole);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al eliminar la reseña:", error.message);
    const statusCode = error.message.includes("permisos") ? 403 : 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

// Controlador para alternar el estado de destacada (máximo 5 para el home)
export const toggleFeaturedReview = async (req, res) => {
  try {
    const { id } = req.params; // ID de la reseña

    const result = await toggleFeaturedReviewService(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al actualizar reseña destacada:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

// Controlador para obtener las reseñas destacadas del Home
export const getFeaturedReviews = async (req, res) => {
  try {
    const featuredReviews = await getFeaturedReviewsService();
    return res.status(200).json({
      message: "Reseñas destacadas obtenidas exitosamente.",
      reviews: featuredReviews,
    });
  } catch (error) {
    console.error("Error al obtener reseñas destacadas:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};
