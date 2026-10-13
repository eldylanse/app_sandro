"use strict";

import {
  createExerciseService,
  getExercisesService,
  updateExerciseService,
  deleteExerciseService,
} from "../services/exercise.service.js";

export const createExercise = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const exercise = await createExerciseService(req.body, userId, userRole);
    return res.status(201).json({
      message: "¡Ejercicio creado exitosamente!",
      exercise,
    });
  } catch (error) {
    console.error("Error al crear ejercicio:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const getExercises = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : "cliente";

    const exercises = await getExercisesService(userId, userRole);
    return res.status(200).json({
      message: "Ejercicios obtenidos exitosamente.",
      exercises,
    });
  } catch (error) {
    console.error("Error al obtener ejercicios:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const updated = await updateExerciseService(id, req.body, userId, userRole);
    return res.status(200).json({
      message: "¡Ejercicio actualizado exitosamente!",
      exercise: updated,
    });
  } catch (error) {
    console.error("Error al actualizar ejercicio:", error.message);
    const statusCode = error.message.includes("permisos") ? 403 : 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await deleteExerciseService(id, userId, userRole);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al eliminar ejercicio:", error.message);
    const statusCode = error.message.includes("permisos") ? 403 : 400;
    return res.status(statusCode).json({ message: error.message });
  }
};