"use strict";

import User from "../models/user.model.js";
import ROLES from "../constants/roles.constants.js";
import jwt from "jsonwebtoken";
import { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } from "../config/configEnv.js";

// Servicio para registrar un nuevo usuario
export const registerService = async (body) => {
  const { nombre, email, password, celular, fecha_inicio_plan, fecha_termino_plan } = body;

  const normalizedName = String(nombre || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPhone = String(celular || "").trim();
  const phoneCharactersValid = /^[+\d\s()-]+$/.test(rawPhone);
  const phoneCompact = rawPhone.replace(/[\s()-]/g, "");
  const phoneNational = phoneCompact.replace(/^\+?56/, "");

  if (!/^\p{L}+(?:\s+\p{L}+)*$/u.test(normalizedName)) {
    throw new Error("El nombre solo puede contener letras y espacios.");
  }
  if (!/^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.com$/i.test(normalizedEmail)) {
    throw new Error("Ingresa un correo válido que termine en .com.");
  }
  if (!phoneCharactersValid || !/^9\d{8}$/.test(phoneNational)) {
    throw new Error("Ingresa un celular chileno válido: 9 dígitos, con o sin el prefijo +56.");
  }

  const startDate = new Date(fecha_inicio_plan);
  const endDate = new Date(fecha_termino_plan);
  if (!fecha_inicio_plan || Number.isNaN(startDate.getTime()) || !fecha_termino_plan || Number.isNaN(endDate.getTime())) {
    throw new Error("Las fechas de inicio y término del plan son obligatorias y deben ser válidas.");
  }
  if (endDate < startDate) {
    throw new Error("La fecha de término del plan no puede ser anterior a la fecha de inicio.");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
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
    nombre: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    role: "cliente",
    celular: `+56${phoneNational}`,
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
    { id: userFound._id, role: userFound.role, tokenVersion: userFound.tokenVersion || 0 },
    ACCESS_JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Token de refresco (larga duración, ej: 7 días)
  const refreshToken = jwt.sign(
    { id: userFound._id, tokenVersion: userFound.tokenVersion || 0 },
    REFRESH_JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Retornar los tokens y los datos limpios del usuario
  return {
    accessToken,
    refreshToken,
  };
};
