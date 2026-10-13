"use strict";

import { Router } from "express";
import {
  getGoogleAuthUrlController,
  googleCallbackController,
} from "../controllers/user.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import {isAdmin } from "../middlewares/authorization.middleware.js";

const router = Router();

router.use(verifyAccessToken);
router.get(
  "/google/auth-url",
  isAdmin,
  getGoogleAuthUrlController
);

router.get("/google/callback", isAdmin, googleCallbackController);

export default router;