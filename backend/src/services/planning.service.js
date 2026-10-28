"use strict";

import Planning from "../models/planning.model.js";
import User from "../models/user.model.js";
import TrainingDaySurvey from "../models/training-day-survey.model.js";

const validateExerciseGoals = (data) => {
  for (const week of data.microciclos || []) {
    for (const day of week.dias_entrenamiento || []) {
      for (const exercise of day.ejercicios || []) {
        if (exercise.peso_planificado !== undefined && exercise.peso_planificado !== null && exercise.peso_planificado !== "") {
          const weight = Number(exercise.peso_planificado);
          if (!Number.isFinite(weight) || weight <= 0) {
            throw new Error("El peso planificado debe ser un número mayor que cero o quedar vacío.");
          }
        }
        const type = exercise.tipo_objetivo || "repeticiones";
        if (type === "tiempo" && (!Number.isFinite(Number(exercise.tiempo_segundos)) || Number(exercise.tiempo_segundos) < 1)) {
          throw new Error("Los ejercicios por tiempo deben tener una duración de al menos 1 segundo.");
        }
        if (type === "repeticiones" && !String(exercise.repeticiones_planificadas || "").trim()) {
          throw new Error("Indica las repeticiones planificadas para cada ejercicio.");
        }
        if (!["repeticiones", "tiempo"].includes(type)) {
          throw new Error("El tipo de objetivo del ejercicio no es válido.");
        }
      }
    }
  }
};

// 1. Crear una planificación
export const createPlanningService = async (data) => {
  validateExerciseGoals(data);
  const client = await User.findOne({ _id: data.id_cliente, role: "cliente" }).select("_id");
  if (!client) throw new Error("Selecciona un cliente válido para la planificación.");
  const newPlanning = new Planning(data);
  return await newPlanning.save();
};

export const updatePlanningService = async (planningId, data) => {
  validateExerciseGoals(data);
  const planning = await Planning.findById(planningId);
  if (!planning) throw new Error("Planificación no encontrada.");

  const client = await User.findOne({ _id: data.id_cliente, role: "cliente" }).select("_id");
  if (!client) throw new Error("Selecciona un cliente válido para la planificación.");

  planning.id_cliente = data.id_cliente;
  planning.nombre = data.nombre;
  planning.objetivo = data.objetivo;
  planning.fecha_inicio = data.fecha_inicio;
  planning.fecha_termino = data.fecha_termino;
  planning.microciclos = data.microciclos;
  await planning.save();
  return planning;
};

// 2. Obtener planificaciones (Si es cliente ve las suyas, si es admin ve todas)
export const getPlanningsService = async (userId, userRole) => {
  if (userRole !== "admin" && userRole !== "cliente") {
    throw new Error("Acceso denegado a las planificaciones.");
  }
  const query = userRole === "cliente" ? { id_cliente: userId } : {};

  const plannings = await Planning.find(query)
    .populate("id_cliente", "nombre email")
    .populate("microciclos.dias_entrenamiento.ejercicios.id_ejercicio", "nombre categoria url_video");

  if (userRole !== "admin" || !plannings.length) return plannings;

  const surveys = await TrainingDaySurvey.find({
    id_planificacion: { $in: plannings.map((planning) => planning._id) },
  }).select("id_planificacion id_dia_entrenamiento").lean();
  const surveyDayIdsByPlanning = new Map();
  for (const survey of surveys) {
    const planningId = survey.id_planificacion.toString();
    const dayIds = surveyDayIdsByPlanning.get(planningId) || new Set();
    dayIds.add(survey.id_dia_entrenamiento.toString());
    surveyDayIdsByPlanning.set(planningId, dayIds);
  }

  return plannings.map((planning) => ({
    ...planning.toObject(),
    dias_con_encuesta: [...(surveyDayIdsByPlanning.get(planning._id.toString()) || [])],
  }));
};

const accessiblePlanningQuery = (planningId, userId, userRole) => {
  if (userRole === "admin") return { _id: planningId };
  if (userRole === "cliente" && userId) return { _id: planningId, id_cliente: userId };
  throw new Error("Acceso denegado a las planificaciones.");
};

// 3. Obtener una planificación por ID
export const getPlanningByIdService = async (planningId, userId, userRole) => {
  const planning = await Planning.findOne(accessiblePlanningQuery(planningId, userId, userRole))
    .populate("id_cliente", "nombre email")
    .populate("microciclos.dias_entrenamiento.ejercicios.id_ejercicio", "nombre descripcion categoria url_video");

  if (!planning) {
    throw new Error("Planificación no encontrada.");
  }

  return planning;
};

export const updateTrainingDayStatusService = async ({ planningId, clientId, microcicloIndex, diaIndex, finalizado }) => {
  if (!Number.isInteger(microcicloIndex) || !Number.isInteger(diaIndex) || typeof finalizado !== "boolean") {
    throw new Error("El día y su estado de término no son válidos.");
  }

  const planning = await Planning.findOne({ _id: planningId, id_cliente: clientId });
  if (!planning) {
    throw new Error("Planificación no encontrada para este cliente.");
  }

  const day = planning.microciclos[microcicloIndex]?.dias_entrenamiento[diaIndex];
  if (!day) {
    throw new Error("Día de entrenamiento no encontrado en la planificación.");
  }

  day.finalizado = finalizado;
  await planning.save();
  return planning;
};

// Eliminar una planificación
export const deletePlanningService = async (planningId) => {
  const planning = await Planning.findByIdAndDelete(planningId);
  if (!planning) {
    throw new Error("Planificación no encontrada.");
  }
  return { message: "Planificación eliminada exitosamente." };
};
