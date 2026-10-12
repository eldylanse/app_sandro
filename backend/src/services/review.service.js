"use strict";

import Review from "../models/review.model.js";

// Servicio para crear una nueva reseña
export const createReviewService = async (id_cliente, body) => {
  const { estrellas, comentario } = body;

  // Validar que vengan los campos obligatorios
  if (!estrellas || !comentario) {
    throw new Error("Las estrellas y el comentario son obligatorios.");
  }

  // Crear la instancia del modelo con los atributos del diagrama
  const newReview = new Review({
    id_cliente,
    estrellas,
    comentario,
  });

  const savedReview = await newReview.save();
  return savedReview;
};

// Servicio para obtener todas las reseñas
export const getReviewsService = async () => {
  // .populate() nos permite traer los datos del usuario (nombre, email) vinculado en id_cliente
  const reviews = await Review.find()
    .populate("id_cliente", "nombre email role")
    .sort({ fecha_creacion: -1 }); // Opcional: ordenar de la más reciente a la más antigua

  return reviews;
};

// Servicio para eliminar una reseña
export const deleteReviewService = async (reviewId, userId, userRole) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error("Reseña no encontrada.");
  }

  // Validar si el usuario es el dueño de la reseña o es administrador
  if (review.id_cliente.toString() !== userId && userRole !== "admin") {
    throw new Error("No tienes permisos para eliminar esta reseña.");
  }

  await Review.findByIdAndDelete(reviewId);
  return { message: "Reseña eliminada exitosamente." };
};

// Servicio para alternar/seleccionar reseña para la página principal (máximo 2)
export const toggleFeaturedReviewService = async (reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error("Reseña no encontrada.");
  }

  // Si ya está destacada, permitimos quitarla
  if (review.destacada) {
    review.destacada = false;
    await review.save();
    return { message: "Reseña removida de la página principal.", review };
  }

  // Si no está destacada, verificamos cuántas hay activas actualmente
  const countFeatured = await Review.countDocuments({ destacada: true });
  if (countFeatured >= 2) {
    throw new Error("Límite alcanzado: Solo puedes seleccionar un máximo de 2 reseñas para la página inicial.");
  }

  review.destacada = true;
  await review.save();
  return { message: "Reseña seleccionada para la página principal exitosamente.", review };
};

// Servicio para obtener únicamente las reseñas seleccionadas para el Home
export const getFeaturedReviewsService = async () => {
  const reviews = await Review.find({ destacada: true })
    .populate("id_cliente", "nombre email")
    .sort({ fecha_creacion: -1 });
  
  return reviews;
};