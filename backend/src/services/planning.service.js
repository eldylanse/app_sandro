"use strict";

import Planning from "../models/planning.model.js";
import User from "../models/user.model.js";

const validateExerciseGoals = (data) => {
  for (const week of data.microciclos || []) {
    for (const day of week.dias_entrenamiento || []) {
      for (const exercise of day.ejercicios || []) {
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
  let query = {};
  if (userRole === "cliente") {
    query = { id_cliente: userId };
  }

  const plannings = await Planning.find(query)
    .populate("id_cliente", "nombre email")
    .populate("microciclos.dias_entrenamiento.ejercicios.id_ejercicio", "nombre categoria url_video");

  return plannings;
};

// 3. Obtener una planificación por ID
export const getPlanningByIdService = async (planningId) => {
  const planning = await Planning.findById(planningId)
    .populate("id_cliente", "nombre email")
    .populate("microciclos.dias_entrenamiento.ejercicios.id_ejercicio", "nombre descripcion categoria url_video");

  if (!planning) {
    throw new Error("Planificación no encontrada.");
  }

  return planning;
};

// 4. Registrar avance en el historial de rendimiento de un ejercicio
export const addPerformanceRecordService = async ({ planningId, microcicloIndex, diaIndex, ejercicioIndex, registro }) => {
  const planning = await Planning.findById(planningId);
  if (!planning) {
    throw new Error("Planificación no encontrada.");
  }

  // Acceder al ejercicio específico dentro del día y microciclo
  const targetExercise = planning.microciclos[microcicloIndex]?.dias_entrenamiento[diaIndex]?.ejercicios[ejercicioIndex];

  if (!targetExercise) {
    throw new Error("Ejercicio no encontrado en la planificación.");
  }

  // Insertar el nuevo registro de rendimiento (serie, peso, repeticiones reales)
  targetExercise.historial_rendimiento.push(registro);

  await planning.save();
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

// 5. Eliminar una planificación
export const deletePlanningService = async (planningId) => {
  const planning = await Planning.findByIdAndDelete(planningId);
  if (!planning) {
    throw new Error("Planificación no encontrada.");
  }
  return { message: "Planificación eliminada exitosamente." };
};
