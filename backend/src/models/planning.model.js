"use strict";

import mongoose from "mongoose";

const planningSchema = new mongoose.Schema(
  {
    id_cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true, // Ej: "Rutina Hipertrofia Fase 1"
    },
    objetivo: {
      type: String,
      required: true,
      trim: true, // Ej: "Ganancia muscular"
    },
    fecha_inicio: {
      type: Date,
      required: true,
    },
    fecha_termino: {
      type: Date,
      required: true,
    },
    microciclos: [
      {
        numero_semana: { type: Number, required: true },
        dias_entrenamiento: [
          {
            fecha: { type: Date, required: true },
            finalizado: { type: Boolean, default: false },
            ejercicios: [
              {
                id_ejercicio: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "Exercise",
                  required: true,
                },
                series_planificadas: { type: Number },
                peso_planificado: { type: Number, min: 0.1, default: null }, // Kilogramos; opcional.
                tipo_objetivo: { type: String, enum: ["repeticiones", "tiempo"], default: "repeticiones" },
                repeticiones_planificadas: { type: String }, // Ej: "10-12"
                tiempo_segundos: {
                  type: Number,
                  min: 1,
                  required: function () { return this.tipo_objetivo === "tiempo"; },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Planning = mongoose.model("Planning", planningSchema);
export default Planning;
