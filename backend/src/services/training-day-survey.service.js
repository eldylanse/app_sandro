"use strict";

import mongoose from "mongoose";
import Planning from "../models/planning.model.js";
import TrainingDaySurvey from "../models/training-day-survey.model.js";

async function findOwnedTrainingDay({ clientId, planningId, dayId }) {
  if (![clientId, planningId, dayId].every(mongoose.isValidObjectId)) {
    throw new Error("La planificación o el día de entrenamiento no son válidos.");
  }

  const planning = await Planning.findOne({ _id: planningId, id_cliente: clientId });
  if (!planning) {
    throw new Error("No encontramos esa planificación para este cliente.");
  }

  const day = planning.microciclos
    .flatMap((cycle) => cycle.dias_entrenamiento)
    .find((trainingDay) => trainingDay._id.toString() === dayId);

  if (!day) {
    throw new Error("El día no pertenece a esta planificación.");
  }

  return day;
}

export async function getTrainingDaySurveyService({ clientId, planningId, dayId }) {
  await findOwnedTrainingDay({ clientId, planningId, dayId });
  return TrainingDaySurvey.findOne({
    id_cliente: clientId,
    id_planificacion: planningId,
    id_dia_entrenamiento: dayId,
  });
}

export async function getPlanningTrainingDaySurveysService(planningId) {
  if (!mongoose.isValidObjectId(planningId)) {
    throw new Error("La planificación no es válida.");
  }

  const planning = await Planning.findById(planningId).populate("id_cliente", "nombre email");
  if (!planning) {
    throw new Error("No encontramos esa planificación.");
  }

  const surveys = await TrainingDaySurvey.find({ id_planificacion: planningId })
    .populate("id_cliente", "nombre email")
    .sort({ createdAt: -1 });

  return surveys.map((survey) => {
    const trainingDay = planning.microciclos
      .flatMap((cycle) => cycle.dias_entrenamiento)
      .find((day) => day._id.toString() === survey.id_dia_entrenamiento.toString());

    return {
      ...survey.toObject(),
      dia_entrenamiento: trainingDay
        ? {
            fecha: trainingDay.fecha,
            finalizado: trainingDay.finalizado,
            numero_semana: planning.microciclos.find((cycle) =>
              cycle.dias_entrenamiento.some((day) => day._id.toString() === trainingDay._id.toString())
            )?.numero_semana,
          }
        : null,
    };
  });
}

export async function saveTrainingDaySurveyService({ clientId, planningId, dayId, surveyData }) {
  await findOwnedTrainingDay({ clientId, planningId, dayId });

  const { nivel_exigencia, tuvo_molestia, detalle_molestia = "", comentarios_adicionales = "" } = surveyData;
  if (!Number.isInteger(Number(nivel_exigencia)) || Number(nivel_exigencia) < 1 || Number(nivel_exigencia) > 5) {
    throw new Error("Selecciona un nivel de exigencia entre 1 y 5.");
  }
  if (typeof tuvo_molestia !== "boolean") {
    throw new Error("Indica si tuviste alguna molestia durante el entrenamiento.");
  }
  if (typeof detalle_molestia !== "string" || typeof comentarios_adicionales !== "string") {
    throw new Error("Los comentarios de la encuesta no son válidos.");
  }

  return TrainingDaySurvey.findOneAndUpdate(
    { id_cliente: clientId, id_planificacion: planningId, id_dia_entrenamiento: dayId },
    {
      $set: {
        nivel_exigencia: Number(nivel_exigencia),
        tuvo_molestia,
        detalle_molestia: detalle_molestia.slice(0, 1000),
        comentarios_adicionales: comentarios_adicionales.slice(0, 2000),
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}
