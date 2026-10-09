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