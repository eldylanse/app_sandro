"use strict";

import { Router } from "express";
import {
  getGoogleAuthUrlController,
  googleCallbackController,
  completeProfile,
} from "../controllers/user.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import {isAdmin, isClient } from "../middlewares/authorization.middleware.js";

const router = Router();

router.use(verifyAccessToken);
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