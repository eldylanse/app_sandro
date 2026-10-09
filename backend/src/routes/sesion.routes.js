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

const router = Router();

// Todas las rutas de sesiones requieren autenticación JWT
router.use(authenticationMiddleware);

// 🔹 POST /api/sessions -> Crear nueva sesión con Meet
router.post("/", createSessionController);

// 🔹 GET /api/sessions -> Listar sesiones (opcional: ?id_cliente=...&estado=...)
router.get("/", getSessionsController);

// 🔹 GET /api/sessions/:id -> Obtener sesión por ID
router.get("/:id", getSessionByIdController);

// 🔹 PUT /api/sessions/:id -> Actualizar estado/notas
router.put("/:id", updateSessionController);

// 🔹 DELETE /api/sessions/:id -> Cancelar sesión
router.delete("/:id", cancelSessionController);

export default router;