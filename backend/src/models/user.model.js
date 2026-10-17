"use strict";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import ROLES from "../constants/roles.constants.js";

// Sub-esquema para el historial de mediciones del cliente
const historialMedicionSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      required: false,
      default: Date.now,
    },
    peso: {
      type: Number,
      required: false,
    },
    imc: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

// Sub-esquema para el perfil del cliente
const perfilClienteSchema = new mongoose.Schema(
  {
    edad: {
      type: Number,
    },
    altura: {
      type: Number,
    },
    peso: {
      type: Number,
    },
    imc: {
      type: Number,
    },
    informacion_medica: {
      type: String,
      default: "",
    },
    terminos_aceptados: {
      type: Boolean,
      default: false,
    },
    fecha_inicio_plan: {
      type: Date,
    },
    fecha_termino_plan: {
      type: Date,
    },
    historial_mediciones: [historialMedicionSchema],
  },
  { _id: false }
);

// 🔹 NUEVO: Sub-esquema para guardar tokens y autenticación de Google OAuth 2.0
const googleAuthSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      default: null,
    },
    accessToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null, 
    },
    tokenExpiryDate: {
      type: Date,
      default: null,
    },
    isAuthorized: {
      type: Boolean,
      default: false, 
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      match: [/^\p{L}+(?:\s+\p{L}+)*$/u, "El nombre solo puede contener letras y espacios."],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.com$/i, "Ingresa un correo válido que termine en .com."],
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "cliente",
      required: true,
    },
    celular: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+569\d{8}$/, "Ingresa un celular chileno válido con prefijo +56 y 9 dígitos."],
    },
    perfilCliente: {
      type: perfilClienteSchema,
      default: null,
    },
    googleAuth: {
      type: googleAuthSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Método estático para encriptar la contraseña antes de guardarla
userSchema.statics.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Método estático para comparar contraseñas en el Login
userSchema.statics.comparePassword = async (password, receivedPassword) => {
  return await bcrypt.compare(password, receivedPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
