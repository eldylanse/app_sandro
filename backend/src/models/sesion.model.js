"use strict";

import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    id_cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    id_admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fecha_reunion: {
      type: Date,
      required: true,
    },
    link_meet: {
      type: String,
      default: "",
    },
    estado: {
      type: String,
      enum: ["pendiente", "completada", "cancelada"],
      default: "pendiente",
      required: true,
    },
    // 🔹 Campos opcionales recomendados para integrar con la API de Google
    googleEventId: {
      type: String,
      default: null, // Guardar el ID del evento de Google permite editar o eliminar la reunión en Google Calendar más adelante
    },
    notas: {
      type: String,
      default: "", // Para anotaciones breves de la sesión
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;