"use strict";

import { Router } from "express";
import {
  getGoogleAuthUrlController,
  googleCallbackController,
} from "../controllers/user.controller.js";
import { verifyAccessToken as authenticationMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
router.get(
  "/google/auth-url",
  authenticationMiddleware,
  getGoogleAuthUrlController
);

router.get("/google/callback", googleCallbackController);

export default router;