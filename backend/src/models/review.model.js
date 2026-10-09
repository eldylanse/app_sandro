"use strict";

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    id_cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Referencia al modelo User que ya creamos
      required: true,
    },
    estrellas: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comentario: {
      type: String,
      required: true,
      trim: true,
    },
    fecha_creacion: {
      type: Date,
      default: Date.now, // Toma la fecha y hora actual automáticamente al crearse
    },
  },
  {
    versionKey: false, // Evita el campo __v por defecto de Mongoose
  }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;