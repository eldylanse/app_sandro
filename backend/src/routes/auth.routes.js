"use strict";

import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import {verifyAccessToken} from "../middlewares/auth.middleware.js";
import {isAdmin } from "../middlewares/authorization.middleware.js";
const router = Router();

// Ruta de registro: POST /api/auth/register
router.post("/register", verifyAccessToken,isAdmin,register);

// Ruta de inicio de sesión: POST /api/auth/login
router.post("/login", login);

export default router;