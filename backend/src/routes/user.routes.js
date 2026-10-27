"use strict";

import { Router } from "express";
import {
  getGoogleAuthUrlController,
  googleCallbackController,
  completeProfile,
  getClientProfile,
  getClients,
  deleteClient,
  addClientMeasurement,
  getGoogleConnectionStatusController,
  changeClientPassword,
  resetClientPassword,
} from "../controllers/user.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import {isAdmin, isClient } from "../middlewares/authorization.middleware.js";

const router = Router();

// Google redirige aquí desde fuera de la aplicación y no puede enviar el JWT del administrador.
router.get("/google/callback", googleCallbackController);
router.use(verifyAccessToken);
router.get("/clientes", isAdmin, getClients);
router.delete("/clientes/:id", isAdmin, deleteClient);
router.patch("/clientes/:id/password", isAdmin, resetClientPassword);
router.get("/perfil", isClient, getClientProfile);
router.patch("/perfil/password", isClient, changeClientPassword);
router.get(
  "/google/auth-url",
  isAdmin,
  getGoogleAuthUrlController
);
router.get("/google/status", isAdmin, getGoogleConnectionStatusController);
router.patch(
  "/completar-perfil", 
   isClient,
  completeProfile
);
router.post("/mediciones", isClient, addClientMeasurement);
export default router;
