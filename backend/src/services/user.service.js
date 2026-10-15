"use strict";

import { google } from "googleapis";
import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET, 
  GOOGLE_REDIRECT_URI 
} from "../config/configEnv.js";
import User from "../models/user.model.js";
import Planning from "../models/planning.model.js";
import Review from "../models/review.model.js";
import Session from "../models/sesion.model.js";
import Exercise from "../models/exercise.model.js";

let pendingUserId = null;

export const getGoogleOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

// Servicio para generar la URL de vinculación con Google
export const getGoogleAuthUrlService = async (userId) => {
  pendingUserId = userId; // Guardamos el ID como respaldo
  const oauth2Client = getGoogleOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/meetings.space.created"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: userId.toString()
  });

  return url;
};

export const getClientProfileService = async (userId) => {
  const user = await User.findById(userId).select("nombre email celular role perfilCliente");
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }
  if (user.role !== "cliente") {
    throw new Error("Este usuario no es un cliente.");
  }

  return {
    id: user._id,
    nombre: user.nombre,
    email: user.email,
    celular: user.celular,
    perfilCliente: user.perfilCliente,
  };
};

export const getClientsService = async () => {
  const clients = await User.find({ role: "cliente" })
    .select("nombre email celular perfilCliente createdAt")
    .sort({ nombre: 1 })
    .lean();
  const clientIds = clients.map((client) => client._id);
  const plannings = await Planning.find({ id_cliente: { $in: clientIds } })
    .select("id_cliente nombre fecha_inicio fecha_termino")
    .sort({ fecha_termino: -1 })
    .lean();
  const now = new Date();
  const plansByClient = new Map();

  for (const planning of plannings) {
    const key = planning.id_cliente.toString();
    const existing = plansByClient.get(key) || [];
    existing.push(planning);
    plansByClient.set(key, existing);
  }

  return clients.map((client) => {
    const plans = plansByClient.get(client._id.toString()) || [];
    const activePlan = plans.find((plan) => new Date(plan.fecha_inicio) <= now && new Date(plan.fecha_termino) >= now);
    const upcomingPlan = plans.find((plan) => new Date(plan.fecha_inicio) > now);
    const latestPlan = plans[0];
    const plan = activePlan || upcomingPlan || latestPlan || null;
    return {
      ...client,
      estadoPlan: activePlan ? "activo" : upcomingPlan ? "programado" : latestPlan ? "finalizado" : "sin_plan",
      plan: plan ? { nombre: plan.nombre, fecha_inicio: plan.fecha_inicio, fecha_termino: plan.fecha_termino } : null,
    };
  });
};

export const deleteClientService = async (clientId) => {
  const client = await User.findOne({ _id: clientId, role: "cliente" }).select("_id");
  if (!client) {
    throw new Error("Cliente no encontrado.");
  }

  const sessions = await Session.find({ id_cliente: clientId }).select("id_admin googleEventId");
  await Promise.all(sessions.map(async (session) => {
    if (!session.googleEventId) return;
    try {
      const admin = await User.findById(session.id_admin).select("googleAuth.refreshToken");
      if (!admin?.googleAuth?.refreshToken) return;
      const oauth2Client = getGoogleOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: admin.googleAuth.refreshToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      await calendar.events.delete({ calendarId: "primary", eventId: session.googleEventId });
    } catch (error) {
      console.warn("No se pudo eliminar una sesión de Google Calendar al borrar un cliente:", error.message);
    }
  }));

  await User.deleteOne({ _id: clientId, role: "cliente" });

  await Promise.all([
    Planning.deleteMany({ id_cliente: clientId }),
    Review.deleteMany({ id_cliente: clientId }),
    Session.deleteMany({ id_cliente: clientId }),
    Exercise.deleteMany({ id_usuario: clientId }),
  ]);
  return { message: "Cliente y sus datos asociados fueron eliminados." };
};

// Servicio para guardar los tokens recibidos en el documento del usuario
export const saveGoogleAuthTokensService = async (userId, code) => {
  // Si el userId por alguna razón llegó vacío, usamos el respaldo temporal
  const targetUserId = userId || pendingUserId;

  if (!targetUserId) {
    throw new Error("No se pudo identificar al usuario para asociar los tokens de Google.");
  }

  const oauth2Client = getGoogleOAuth2Client();

  // Intercambiamos el código de autorización por los tokens
  const { tokens } = await oauth2Client.getToken(code);

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new Error("Usuario no encontrado en la base de datos.");
  }

  // Actualizamos el objeto googleAuth en MongoDB
  user.googleAuth = {
    googleId: tokens.id_token || user.googleAuth?.googleId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || user.googleAuth?.refreshToken,
    tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    isAuthorized: true
  };

  await user.save();

  // Limpiamos el respaldo temporal una vez guardado con éxito
  pendingUserId = null;

  return { message: "Cuenta de Google vinculada correctamente." };
};

export const completeClientProfileService = async (userId, profileData) => {
  // 1. Buscar al usuario por su ID
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  if (user.role !== "cliente") {
    throw new Error("Este usuario no es un cliente.");
  }

  const perfil = user.perfilCliente;
  const isAlreadyFilled = perfil && perfil.peso && perfil.altura && perfil.edad;
  
  if (isAlreadyFilled) {
    throw new Error("El perfil del cliente ya ha sido completado anteriormente.");
  }

  // 3. Extraer los datos nuevos
  const { edad, altura, peso, informacion_medica, terminos_aceptados } = profileData;

  let imcCalculado = null;
  if (peso && altura) {
    imcCalculado = parseFloat((peso / (altura * altura)).toFixed(2));
  }

  user.perfilCliente.edad = edad ?? perfil.edad;
  user.perfilCliente.altura = altura ?? perfil.altura;
  user.perfilCliente.peso = peso ?? perfil.peso;
  user.perfilCliente.imc = imcCalculado ?? perfil.imc;
  user.perfilCliente.informacion_medica = informacion_medica ?? perfil.informacion_medica;
  user.perfilCliente.terminos_aceptados = terminos_aceptados ?? perfil.terminos_aceptados;

  // Si hay peso e IMC nuevos, agregarlo al historial de mediciones
  if (peso && imcCalculado) {
    user.perfilCliente.historial_mediciones.push({
      peso,
      imc: imcCalculado,
      fecha: new Date(),
    });
  }

  const updatedUser = await user.save();

  return {
    id: updatedUser._id,
    nombre: updatedUser.nombre,
    email: updatedUser.email,
    perfilCliente: updatedUser.perfilCliente,
  };
};
