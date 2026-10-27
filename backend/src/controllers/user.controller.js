"use strict";

import {
  getGoogleAuthUrlService,
  getClientProfileService,
  getClientsService,
  deleteClientService,
  saveGoogleAuthTokensService,
  completeClientProfileService,
  addClientMeasurementService,
  getGoogleConnectionStatusService,
  changeClientPasswordService,
  resetClientPasswordService,
} from "../services/user.service.js";

export const getClients = async (_req, res) => {
  try {
    const clients = await getClientsService();
    return res.status(200).json({ clients });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const result = await deleteClientService(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const getClientProfile = async (req, res) => {
  try {
    const profile = await getClientProfileService(req.user.id);
    return res.status(200).json({ data: profile });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const changeClientPassword = async (req, res) => {
  try {
    await changeClientPasswordService(req.user.id, req.body?.currentPassword, req.body?.newPassword);
    return res.status(200).json({ message: "Contraseña actualizada. Vuelve a iniciar sesión." });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const resetClientPassword = async (req, res) => {
  try {
    await resetClientPasswordService(req.params.id, req.body?.newPassword);
    return res.status(200).json({ message: "Contraseña restablecida correctamente." });
  } catch (error) {
    return res.status(error.message === "Cliente no encontrado." ? 404 : 400).json({ message: error.message });
  }
};

export const getGoogleAuthUrlController = async (req, res) => {
  try {
    // Usamos el ID del usuario autenticado (del middleware de autenticación)
    const userId = req.user.id; 
    const url = await getGoogleAuthUrlService(userId);
    res.status(200).json({ status: "Success", data: { url } });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
};

export const getGoogleConnectionStatusController = async (req, res) => {
  try {
    const isConnected = await getGoogleConnectionStatusService(req.user.id);
    return res.status(200).json({ data: { isConnected } });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

// 🔹 Callback que recibe el código de autorización desde Google
export const googleCallbackController = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const { code, state, error: providerError } = req.query;

    if (providerError) {
      return res.redirect(`${frontendUrl}/admin/sesiones?googleAuth=error`);
    }
    if (!code) {
      return res.redirect(`${frontendUrl}/admin/sesiones?googleAuth=error`);
    }

    // Guardamos los tokens intercambiados en MongoDB
    await saveGoogleAuthTokensService(state, code);

    // Redirigimos de vuelta a tu Frontend (Vercel / React)
    // Cambia esta URL por la pantalla de ajustes/perfil de tu frontend
    res.redirect(`${frontendUrl}/admin/sesiones?googleAuth=success`);
  } catch (error) {
    console.error("Error en Google Callback:", error);
    res.redirect(`${frontendUrl}/admin/sesiones?googleAuth=error`);
  }
};



export const completeProfile = async (req, res) => {
  try {
    // El ID del usuario autenticado usualmente viene del token (req.user o req.user.id)
    const userId = req.user?.id || req.user?._id; 

    if (!userId) {
      return res.status(401).json({ message: "No autorizado. Token faltante o inválido." });
    }

    const updatedUser = await completeClientProfileService(userId, req.body);

    return res.status(200).json({
      message: "¡Perfil completado exitosamente por primera vez!",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Ocurrió un error al completar el perfil.",
    });
  }
};

export const addClientMeasurement = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "No autorizado. Token faltante o inválido." });
    }
    const profile = await addClientMeasurementService(userId, req.body);
    return res.status(201).json({ message: "Medición agregada correctamente.", data: profile });
  } catch (error) {
    return res.status(400).json({ message: error.message || "No se pudo guardar la medición." });
  }
};
