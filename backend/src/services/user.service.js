"use strict";

import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { 
  ACCESS_JWT_SECRET,
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET, 
  GOOGLE_REDIRECT_URI 
} from "../config/configEnv.js";
import User from "../models/user.model.js";
import Planning from "../models/planning.model.js";
import Review from "../models/review.model.js";
import Session from "../models/sesion.model.js";
import Exercise from "../models/exercise.model.js";

export const getGoogleOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

// Servicio para generar la URL de vinculación con Google
export const getGoogleAuthUrlService = async (userId) => {
  const admin = await User.findOne({ _id: userId, role: "admin" }).select("_id");
  if (!admin) throw new Error("Cuenta administradora no encontrada.");

  const state = jwt.sign({ id: admin._id.toString(), purpose: "google-calendar" }, ACCESS_JWT_SECRET, { expiresIn: "10m" });
  const oauth2Client = getGoogleOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });

  return url;
};

export const getGoogleConnectionStatusService = async (userId) => {
  const admin = await User.findOne({ _id: userId, role: "admin" }).select("googleAuth.isAuthorized googleAuth.refreshToken").lean();
  if (!admin) throw new Error("Cuenta administradora no encontrada.");
  return Boolean(admin.googleAuth?.isAuthorized && admin.googleAuth?.refreshToken);
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
    const profileStart = client.perfilCliente?.fecha_inicio_plan;
    const profileEnd = client.perfilCliente?.fecha_termino_plan;
    const hasProfilePlanDates = Boolean(profileStart && profileEnd);
    const profileActive = hasProfilePlanDates && new Date(profileStart) <= now && new Date(profileEnd) >= now;
    const profileUpcoming = hasProfilePlanDates && new Date(profileStart) > now;
    const profileStatus = profileActive ? "activo" : profileUpcoming ? "programado" : hasProfilePlanDates ? "finalizado" : null;
    const plan = hasProfilePlanDates
      ? { nombre: latestPlan?.nombre || "Plan de entrenamiento", fecha_inicio: profileStart, fecha_termino: profileEnd }
      : activePlan || upcomingPlan || latestPlan || null;
    return {
      ...client,
      estadoPlan: profileStatus || (activePlan ? "activo" : upcomingPlan ? "programado" : latestPlan ? "finalizado" : "sin_plan"),
      plan: plan ? { nombre: plan.nombre, fecha_inicio: plan.fecha_inicio, fecha_termino: plan.fecha_termino } : null,
    };
  });
};

export const addClientMeasurementService = async (userId, body) => {
  const peso = Number(body.peso);
  if (!Number.isFinite(peso) || peso < 20 || peso > 350) {
    throw new Error("El peso debe ser un número entre 20 y 350 kg.");
  }

  const user = await User.findById(userId);
  if (!user || user.role !== "cliente") {
    throw new Error("Cliente no encontrado.");
  }
  if (!user.perfilCliente?.altura || user.perfilCliente.altura <= 0) {
    throw new Error("Completa tu estatura en el perfil antes de registrar mediciones.");
  }

  const imc = Number((peso / (user.perfilCliente.altura ** 2)).toFixed(2));
  if (!Array.isArray(user.perfilCliente.historial_mediciones)) {
    user.perfilCliente.historial_mediciones = [];
  }
  user.perfilCliente.historial_mediciones.push({ peso, imc, fecha: new Date() });
  user.perfilCliente.peso = peso;
  user.perfilCliente.imc = imc;
  const savedUser = await user.save();

  return {
    id: savedUser._id,
    nombre: savedUser.nombre,
    email: savedUser.email,
    celular: savedUser.celular,
    perfilCliente: savedUser.perfilCliente,
  };
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
export const saveGoogleAuthTokensService = async (state, code) => {
  let statePayload;
  try {
    statePayload = jwt.verify(state, ACCESS_JWT_SECRET);
  } catch {
    throw new Error("La autorización de Google expiró o no es válida. Vuelve a iniciar la conexión.");
  }
  if (statePayload.purpose !== "google-calendar" || !statePayload.id) {
    throw new Error("No se pudo validar la cuenta administradora para Google Calendar.");
  }

  const oauth2Client = getGoogleOAuth2Client();

  // Intercambiamos el código de autorización por los tokens
  const { tokens } = await oauth2Client.getToken(code);

  const user = await User.findOne({ _id: statePayload.id, role: "admin" });
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
