"use strict";

import {
  getGoogleAuthUrlService,
  getClientProfileService,
  getClientsService,
  deleteClientService,
  saveGoogleAuthTokensService,
  completeClientProfileService,
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

export const getGoogleAuthUrlController = async (req, res) => {
  try {
    // Usamos el ID del usuario autenticado (del middleware de autenticación)
    const userId = req.user.id; 
    console.log("user id en get 1 ",userId);
    const url = await getGoogleAuthUrlService(userId);
    
    // Puedes devolver la URL para que el frontend haga la redirección
    res.status(200).json({ status: "Success", data: { url } });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
};

// 🔹 Callback que recibe el código de autorización desde Google
export const googleCallbackController = async (req, res) => {
  try {
    console.log("req ",req.query);
    const { code, state: userId } = req.query;


    if (!code) {
      return res.status(400).json({ status: "Error", message: "Código de autorización no provisto." });
    }

    // Guardamos los tokens intercambiados en MongoDB
    await saveGoogleAuthTokensService(userId, code);

    // Redirigimos de vuelta a tu Frontend (Vercel / React)
    // Cambia esta URL por la pantalla de ajustes/perfil de tu frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/admin/settings?googleAuth=success`);
  } catch (error) {
    console.error("Error en Google Callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/admin/settings?googleAuth=error`);
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
