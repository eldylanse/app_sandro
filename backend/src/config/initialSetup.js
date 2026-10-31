"use strict";

import Role from "../models/role.model.js";
import User from "../models/user.model.js";
import { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } from "./configEnv.js";


async function createRoles() {
  try {
    const count = await Role.estimatedDocumentCount();
    if (count > 0) return;
    await Promise.all([
      new Role({ name: "admin" }).save(),
      new Role({ name: "cliente"}).save(),
    ]);
    console.log("* => Roles creados exitosamente");
  } catch (error) {
    console.error(error);
  }
}

function adminCredentials(config) {
  const nombre = config.ADMIN_NAME?.trim();
  const email = config.ADMIN_EMAIL?.trim().toLowerCase();
  const celular = config.ADMIN_PHONE?.trim();
  const password = config.ADMIN_PASSWORD;
  const missing = [
    ["ADMIN_NAME", nombre],
    ["ADMIN_EMAIL", email],
    ["ADMIN_PHONE", celular],
    ["ADMIN_PASSWORD", password],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw new Error(`No se creó el administrador inicial. Faltan variables de entorno: ${missing.join(", ")}.`);
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres y no superar 72 bytes.");
  }
  if (email === "admin@email.com" || password === "admin123") {
    throw new Error("Reemplaza las credenciales de ejemplo del administrador antes de iniciar.");
  }
  return { nombre, email, celular, password };
}

async function createAdminUser(config = { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD }) {
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    const hasLegacyPassword = existingAdmin.email === "admin@email.com" &&
      await User.comparePassword("admin123", existingAdmin.password);
    if (!hasLegacyPassword) {
      console.log("El usuario administrador ya existe en la base de datos.");
      return;
    }
    const { nombre, email, celular, password } = adminCredentials(config);
    existingAdmin.nombre = nombre;
    existingAdmin.email = email;
    existingAdmin.celular = celular;
    existingAdmin.password = await User.encryptPassword(password);
    existingAdmin.tokenVersion = (existingAdmin.tokenVersion || 0) + 1;
    await existingAdmin.save();
    console.log("Credenciales iniciales del administrador reemplazadas correctamente.");
    return;
  }

  const { nombre, email, celular, password } = adminCredentials(config);

  const newAdmin = new User({
    nombre,
    email,
    celular,
    password: await User.encryptPassword(password),
    role: "admin",
    perfilCliente: null,
  });
  await newAdmin.save();
  console.log("Usuario administrador inicial creado correctamente.");
}


export { createRoles , createAdminUser};
