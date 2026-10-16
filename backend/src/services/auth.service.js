"use strict";

import User from "../models/user.model.js";
import ROLES from "../constants/roles.constants.js";
import jwt from "jsonwebtoken";
import { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } from "../config/configEnv.js";

// Servicio para registrar un nuevo usuario
export const registerService = async (body) => {
  const { nombre, email, password, celular, fecha_inicio_plan, fecha_termino_plan } = body;

  const startDate = new Date(fecha_inicio_plan);
  const endDate = new Date(fecha_termino_plan);
  if (!fecha_inicio_plan || Number.isNaN(startDate.getTime()) || !fecha_termino_plan || Number.isNaN(endDate.getTime())) {
    throw new Error("Las fechas de inicio y término del plan son obligatorias y deben ser válidas.");
  }
  if (endDate < startDate) {
    throw new Error("La fecha de término del plan no puede ser anterior a la fecha de inicio.");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("El correo electrónico ya se encuentra registrado.");
  }
  const hashedPassword = await User.encryptPassword(password);

  const clientProfileData = {
    edad: null,
    altura: null,
    peso: null,
    imc: null,
    informacion_medica: "",
    terminos_aceptados: false,
    fecha_inicio_plan: startDate,
    fecha_termino_plan: endDate,
    historial_mediciones: []
  };

  const newUser = new User({
    nombre,
    email,
    password: hashedPassword,
    role: "cliente",
    celular,
    perfilCliente: clientProfileData,
    
  });

  const savedUser = await newUser.save();
  
  return {
    id: savedUser._id,
    nombre: savedUser.nombre,
    email: savedUser.email,
    role: savedUser.role,
    celular: savedUser.celular,
    perfilCliente: savedUser.perfilCliente,
  };
};


// Servicio para iniciar sesión
export const loginService = async (body) => {
  const { email, password } = body;

  // 1. Buscar al usuario
  const userFound = await User.findOne({ email });
  if (!userFound) {
    throw new Error("Correo electrónico o contraseña incorrectos.");
  }

  // 2. Validar la contraseña
  const isMatch = await User.comparePassword(password, userFound.password);
  if (!isMatch) {
    throw new Error("Correo electrónico o contraseña incorrectos.");
  }

  // 3. Generar los tokens usando los secretos de configEnv.js
  // Token de acceso (corta duración, ej: 15 minutos o 1 hora)
  const accessToken = jwt.sign(
    { id: userFound._id, role: userFound.role },
    ACCESS_JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Token de refresco (larga duración, ej: 7 días)
  const refreshToken = jwt.sign(
    { id: userFound._id },
    REFRESH_JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Retornar los tokens y los datos limpios del usuario
  return {
    accessToken,
    refreshToken,
  };
};
