"use strict";

import jwt from "jsonwebtoken";
import { ACCESS_JWT_SECRET } from "../config/configEnv.js";
import User from "../models/user.model.js";

export const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Acceso denegado. No se proporcionó un token o el formato es incorrecto.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verificar el token usando la clave secreta de acceso
    const decoded = jwt.verify(token, ACCESS_JWT_SECRET);

    // Buscar al usuario en la base de datos para asegurar que sigue activo
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        message: "El usuario asociado a este token ya no existe.",
      });
    }

    // Inyectar los datos del usuario en la petición (req.user)
    req.user = {
      id: user._id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Error al verificar el token:", error.message);
    return res.status(403).json({
      message: "Token inválido o expirado.",
    });
  }
};