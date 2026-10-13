"use strict";

import User from "../models/user.model.js";
import ROLES from "../constants/roles.constants.js";
import jwt from "jsonwebtoken";
import { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } from "../config/configEnv.js";

// Servicio para registrar un nuevo usuario
export const registerService = async (body) => {
  const { nombre, email, password, celular } = body;

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
    fecha_inicio_plan: null,
    fecha_termino_plan: null,
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
    user: {
      id: userFound._id,
      nombre: userFound.nombre,
      email: userFound.email,
      role: userFound.role,
      perfilCliente: userFound.perfilCliente,
    },
  };
};