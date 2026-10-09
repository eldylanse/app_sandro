"use strict";

import Session from "../models/sesion.model.js";
import User from "../models/user.model.js";
import { google } from "googleapis";
import { getGoogleOAuth2Client } from "./user.service.js";

// 🔹 Crear una nueva sesión con enlace automático a Google Meet
export const createSessionService = async (sessionData) => {
  const { id_cliente, id_admin, fecha_reunion, notas } = sessionData;

  // 1. Validar existencia del cliente
  const clientUser = await User.findById(id_cliente);
  if (!clientUser) {
    throw new Error("El cliente especificado no existe.");
  }

  // 2. Validar existencia del administrador/entrenador
  const adminUser = await User.findById(id_admin);
  if (!adminUser) {
    throw new Error("El administrador asignado no existe.");
  }

  // 3. Verificar si el administrador vinculó su cuenta de Google
  if (!adminUser.googleAuth?.refreshToken) {
    throw new Error(
      "El administrador/entrenador no ha vinculado su cuenta de Google Meet aún."
    );
  }

  // 4. Autenticar cliente de Google con el refreshToken del admin
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: adminUser.googleAuth.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Duración estimada de la sesión: 1 hora
  const startDateTime = new Date(fecha_reunion);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const eventPayload = {
    summary: `Sesión de Entrenamiento - ${clientUser.nombre}`,
    description: notas || "Sesión de entrenamiento virtual personalizada.",
    start: { dateTime: startDateTime.toISOString() },
    end: { dateTime: endDateTime.toISOString() },
    attendees: [{ email: clientUser.email }],
    conferenceData: {
      createRequest: {
        requestId: `meet-session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  // 5. Crear evento en Google Calendar con reunión de Google Meet
  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: eventPayload,
    conferenceDataVersion: 1, // REQUERIDO para que genere la videollamada
  });

  const linkMeet =
    response.data.hangoutLink || response.data.entryPoints?.[0]?.uri;

  if (!linkMeet) {
    throw new Error("No se pudo generar el enlace de Google Meet.");
  }

  // 6. Guardar la sesión en la BD
  const newSession = new Session({
    id_cliente,
    id_admin,
    fecha_reunion,
    link_meet: linkMeet,
    googleEventId: response.data.id,
    estado: "pendiente",
    notas: notas || "",
  });

  const savedSession = await newSession.save();
  return savedSession;
};

// 🔹 Obtener todas las sesiones (con populate para ver nombres de cliente y admin)
export const getSessionsService = async (filter = {}) => {
  return await Session.find(filter)
    .populate("id_cliente", "nombre email celular")
    .populate("id_admin", "nombre email")
    .sort({ fecha_reunion: 1 });
};

// 🔹 Obtener una sesión por ID
export const getSessionByIdService = async (id) => {
  const session = await Session.findById(id)
    .populate("id_cliente", "nombre email celular perfilCliente")
    .populate("id_admin", "nombre email");

  if (!session) {
    throw new Error("Sesión no encontrada.");
  }
  return session;
};

// 🔹 Cambiar estado o actualizar datos de una sesión
export const updateSessionService = async (id, updateData) => {
  const session = await Session.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!session) {
    throw new Error("Sesión no encontrada.");
  }
  return session;
};

// 🔹 Cancelar sesión y eliminar el evento de Google Calendar
export const cancelSessionService = async (id) => {
  const session = await Session.findById(id);
  if (!session) {
    throw new Error("Sesión no encontrada.");
  }

  // Si la sesión tenía evento en Google Calendar, intentamos cancelarlo
  if (session.googleEventId) {
    try {
      const adminUser = await User.findById(session.id_admin);
      if (adminUser?.googleAuth?.refreshToken) {
        const oauth2Client = getGoogleOAuth2Client();
        oauth2Client.setCredentials({
          refresh_token: adminUser.googleAuth.refreshToken,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.delete({
          calendarId: "primary",
          eventId: session.googleEventId,
        });
      }
    } catch (error) {
      console.warn("No se pudo eliminar el evento en Google Calendar:", error.message);
    }
  }

  // Marcar como cancelada en MongoDB
  session.estado = "cancelada";
  await session.save();

  return session;
};