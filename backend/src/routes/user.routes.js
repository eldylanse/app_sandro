"use strict";

import { Router } from "express";
import {
  getGoogleAuthUrlController,
  googleCallbackController,
  completeProfile,
  getClientProfile,
  getClients,
  deleteClient,
} from "../controllers/user.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import {isAdmin, isClient } from "../middlewares/authorization.middleware.js";

const router = Router();

router.use(verifyAccessToken);
router.get("/clientes", isAdmin, getClients);
router.delete("/clientes/:id", isAdmin, deleteClient);
router.get("/perfil", isClient, getClientProfile);
router.get(
  "/google/auth-url",
  isAdmin,
  getGoogleAuthUrlController
);
router.get("/google/callback", isAdmin, googleCallbackController);
router.patch(
  "/completar-perfil", 
   isClient,
  completeProfile
);
export default router;
