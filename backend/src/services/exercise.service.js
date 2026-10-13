"use strict";

import Exercise from "../models/exercise.model.js";

// 1. Crear un ejercicio (Exclusivo o principal para el Administrador)
export const createExerciseService = async (body) => {
  const { nombre, descripcion, url_video, categoria, id_usuario } = body;

  const newExercise = new Exercise({
    id_usuario: id_usuario || null, // Si no se asigna, queda como ejercicio general del catálogo
    nombre,
    descripcion,
    url_video,
    categoria,
  });

  return await newExercise.save();
};

// 2. Obtener todos los ejercicios del catálogo (Para que el admin los vea y seleccione)
export const getExercisesService = async () => {
  const exercises = await Exercise.find().populate("id_usuario", "nombre email");
  return exercises;
};

// 3. Actualizar un ejercicio (Principalmente gestionado por el admin)
export const updateExerciseService = async (exerciseId, body) => {
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) {
    throw new Error("Ejercicio no encontrado.");
  }

  const updatedExercise = await Exercise.findByIdAndUpdate(exerciseId, body, { new: true });
  return updatedExercise;
};

// 4. Eliminar un ejercicio del catálogo
export const deleteExerciseService = async (exerciseId) => {
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) {
    throw new Error("Ejercicio no encontrado.");
  }

  await Exercise.findByIdAndDelete(exerciseId);
  return { message: "Ejercicio eliminado exitosamente del catálogo." };
};