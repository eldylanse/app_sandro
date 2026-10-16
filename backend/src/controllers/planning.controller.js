"use strict";

import {
  createPlanningService,
  updatePlanningService,
  getPlanningsService,
  getPlanningByIdService,
  addPerformanceRecordService,
  deletePlanningService,
  updateTrainingDayStatusService,
} from "../services/planning.service.js";

// Crear una planificación
export const createPlanning = async (req, res) => {
  try {
    const planning = await createPlanningService(req.body);
    return res.status(201).json({
      message: "¡Planificación creada exitosamente!",
      planning,
    });
  } catch (error) {
    console.error("Error al crear planificación:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const updatePlanning = async (req, res) => {
  try {
    const planning = await updatePlanningService(req.params.id, req.body);
    return res.status(200).json({ message: "Planificación actualizada correctamente.", planning });
  } catch (error) {
    return res.status(400).json({ message: error.message || "No se pudo actualizar la planificación." });
  }
};

// Obtener planificaciones
export const getPlannings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const plannings = await getPlanningsService(userId, userRole);
    return res.status(200).json({
      message: "Planificaciones obtenidas exitosamente.",
      plannings,
    });
  } catch (error) {
    console.error("Error al obtener planificaciones:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Obtener una planificación por ID
export const getPlanningById = async (req, res) => {
  try {
    const { id } = req.params;
    const planning = await getPlanningByIdService(id);
    return res.status(200).json({
      message: "Planificación obtenida exitosamente.",
      planning,
    });
  } catch (error) {
    console.error("Error al obtener planificación:", error.message);
    return res.status(404).json({ message: error.message });
  }
};

// Registrar progreso de entrenamiento / historial de peso y repeticiones
export const addPerformanceRecord = async (req, res) => {
  try {
    const { id } = req.params; // ID de la planificación
    const { microcicloIndex, diaIndex, ejercicioIndex, registro } = req.body;

    const updatedPlanning = await addPerformanceRecordService({
      planningId: id,
      microcicloIndex,
      diaIndex,
      ejercicioIndex,
      registro,
    });

    return res.status(200).json({
      message: "¡Rendimiento registrado exitosamente!",
      planning: updatedPlanning,
    });
  } catch (error) {
    console.error("Error al registrar rendimiento:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const updateTrainingDayStatus = async (req, res) => {
  try {
    const planning = await updateTrainingDayStatusService({
      planningId: req.params.id,
      clientId: req.user.id,
      microcicloIndex: req.body.microcicloIndex,
      diaIndex: req.body.diaIndex,
      finalizado: req.body.finalizado,
    });
    return res.status(200).json({ message: "Estado del entrenamiento actualizado.", planning });
  } catch (error) {
    return res.status(400).json({ message: error.message || "No se pudo actualizar el estado del día." });
  }
};

// Eliminar planificación
export const deletePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deletePlanningService(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al eliminar planificación:", error.message);
    return res.status(400).json({ message: error.message });
  }
};
