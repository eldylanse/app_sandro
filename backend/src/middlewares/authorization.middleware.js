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

export const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "No autorizado. Falta información del usuario.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}.`,
      });
    }

    next();
  };
};