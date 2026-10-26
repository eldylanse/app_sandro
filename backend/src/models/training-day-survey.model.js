"use strict";

import mongoose from "mongoose";

const trainingDaySurveySchema = new mongoose.Schema(
  {
    id_cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    id_planificacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Planning",
      required: true,
    },
    id_dia_entrenamiento: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    nivel_exigencia: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    tuvo_molestia: {
      type: Boolean,
      required: true,
    },
    detalle_molestia: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    comentarios_adicionales: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

trainingDaySurveySchema.index(
  { id_cliente: 1, id_planificacion: 1, id_dia_entrenamiento: 1 },
  { unique: true }
);

const TrainingDaySurvey = mongoose.model("TrainingDaySurvey", trainingDaySurveySchema);
export default TrainingDaySurvey;
