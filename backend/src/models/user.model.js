"use strict";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import ROLES from "../constants/roles.constants.js"

// Sub-esquema para el historial de mediciones del cliente
const historialMedicionSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    peso: {
      type: Number,
      required: true,
    },
    imc: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
); // _id: false evita que se genere un _id único por cada mini-medición si no lo necesitas

// Sub-esquema para el perfil del cliente (solo aplica si el rol es cliente)
const perfilClienteSchema = new mongoose.Schema(
  {
    edad: {
      type: Number,
    },
    altura: {
      type: Number, // en metros, ej: 1.75 o cm, según prefieran
    },
    peso: {
      type: Number, // en kg
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

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    },
    // El perfil de cliente se anidará aquí dentro del documento del usuario
    perfilCliente: {
      type: perfilClienteSchema,
      default: null, // Si es admin, puede estar en null o vacío
    },
  },
  {
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
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