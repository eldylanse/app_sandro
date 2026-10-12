"use strict";

import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Si es null/undefined, es un ejercicio clásico/global de la plataforma. Si tiene ID, es exclusivo de ese usuario.
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    url_video: {
      type: String,
      required: false,
      trim: true,
    },
    categoria: {
      type: String,
      required: true,
      trim: true, // Ej: "pecho", "pierna", "espalda", etc.
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);
export default Exercise;