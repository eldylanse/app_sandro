"use strict";

import {
  createSessionService,
  getSessionsService,
  getSessionByIdService,
  updateSessionService,
  cancelSessionService,
} from "../services/sesion.service.js";

// Crear sesión
export const createSessionController = async (req, res) => {
  try {
    const session = await createSessionService({ ...req.body, id_admin: req.user.id });
    res.status(201).json({
      status: "Success",
      message: "Sesión agendada correctamente y enlace de Meet generado.",
      data: session,
    });
  } catch (error) {
    res.status(400).json({ status: "Error", message: error.message, ...(error.code && { code: error.code }) });
  }
};

// Listar todas las sesiones (admite filtros como ?id_cliente=xxx o ?estado=pendiente)
export const getSessionsController = async (req, res) => {
  try {
    const filters = {};
    if (req.query.id_cliente) filters.id_cliente = req.query.id_cliente;
    if (req.query.id_admin) filters.id_admin = req.query.id_admin;
    if (req.query.estado) filters.estado = req.query.estado;

    const sessions = await getSessionsService(filters);
    res.status(200).json({ status: "Success", data: sessions });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
};

// Obtener detalle de una sesión
export const getSessionByIdController = async (req, res) => {
  try {
    const session = await getSessionByIdService(req.params.id);
    res.status(200).json({ status: "Success", data: session });
  } catch (error) {
    res.status(404).json({ status: "Error", message: error.message });
  }
};

// Actualizar estado o notas de una sesión
export const updateSessionController = async (req, res) => {
  try {
    const updatedSession = await updateSessionService(req.params.id, req.body);
    res.status(200).json({
      status: "Success",
      message: "Sesión actualizada correctamente.",
      data: updatedSession,
    });
  } catch (error) {
    res.status(400).json({ status: "Error", message: error.message });
  }
};

// Cancelar una sesión
export const cancelSessionController = async (req, res) => {
  try {
    const canceledSession = await cancelSessionService(req.params.id);
    res.status(200).json({
      status: "Success",
      message: "Sesión cancelada con éxito.",
      data: canceledSession,
    });
  } catch (error) {
    res.status(400).json({ status: "Error", message: error.message });
  }
};
