"use strict";

import Planning from "../models/planning.model.js";

// 1. Crear una planificación
export const createPlanningService = async (data) => {
  const newPlanning = new Planning(data);
  return await newPlanning.save();
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

// 5. Eliminar una planificación
export const deletePlanningService = async (planningId) => {
  const planning = await Planning.findByIdAndDelete(planningId);
  if (!planning) {
    throw new Error("Planificación no encontrada.");
  }
  return { message: "Planificación eliminada exitosamente." };
};