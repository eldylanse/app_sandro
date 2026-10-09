"use strict";

import { registerService, loginService } from "../services/auth.service.js";

// Controlador de Registro
export const register = async (req, res) => {
  try {
    const newUser = await registerService(req.body);

    return res.status(201).json({
      message: "¡Usuario registrado exitosamente!",
      user: newUser,
    });
  } catch (error) {
    console.error("Error en el registro:", error.message);
    return res.status(400).json({
      message: error.message || "Error interno del servidor al registrar el usuario.",
    });
  }
};

// Controlador de Login
export const login = async (req, res) => {
  try {
    const authData = await loginService(req.body);

    return res.status(200).json({
      message: "¡Inicio de sesión exitoso!",
      ...authData,
    });
  } catch (error) {
    console.error("Error en el login:", error.message);
    return res.status(401).json({
      message: error.message || "Error interno del servidor al iniciar sesión.",
    });
  }
};