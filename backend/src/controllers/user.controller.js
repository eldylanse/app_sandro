"use strict";

import {
  getGoogleAuthUrlService,
  saveGoogleAuthTokensService,
} from "../services/user.service.js";

export const getGoogleAuthUrlController = async (req, res) => {
  try {
    // Usamos el ID del usuario autenticado (del middleware de autenticación)
    const userId = req.user.id; 
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