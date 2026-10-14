"use strict";

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "No autorizado. Falta información del usuario.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Acceso denegado. Se requieren privilegios de Administrador.",
    });
  }

  next();
};

export const isClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "No autorizado. Falta información del usuario.",
    });
  }

  if (req.user.role !== "cliente") {
    return res.status(403).json({
      message: "Acceso denegado. Se requieren privilegios de Cliente.",
    });
  }

  next();
};