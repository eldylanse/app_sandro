"use strict";

import { Router } from "express";
import {
  createSessionController,
  getSessionsController,
  getSessionByIdController,
  updateSessionController,
  cancelSessionController,
} from "../controllers/sesion.controller.js";
import { verifyAccessToken as authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";

const router = Router();

// Todas las rutas de sesiones requieren autenticación JWT
router.use(authenticationMiddleware);

// 🔹 POST /api/sessions -> Crear nueva sesión con Meet
router.post("/", isAdmin, createSessionController);

// 🔹 GET /api/sessions -> Listar sesiones (opcional: ?id_cliente=...&estado=...)
router.get("/", isAdmin, getSessionsController);

// 🔹 GET /api/sessions/:id -> Obtener sesión por ID
router.get("/:id", isAdmin, getSessionByIdController);

// 🔹 PUT /api/sessions/:id -> Actualizar estado/notas
router.put("/:id", isAdmin, updateSessionController);

// 🔹 DELETE /api/sessions/:id -> Cancelar sesión
router.delete("/:id", isAdmin, cancelSessionController);

export default router;