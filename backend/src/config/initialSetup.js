"use strict";

import Role from "../models/role.model.js";
import User from "../models/user.model.js";


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

async function createAdminUser () {
  try {
    const adminCount = await User.countDocuments({ role: "admin" }); 

    if (adminCount > 0) {
      console.log("ℹ️ El usuario administrador ya existe en la base de datos.");
      return;
    }

    const hashedPassword = await User.encryptPassword("admin123" );
    const newAdmin = new User({
      nombre: "Administrador Principal",
      email: "admin@email.com",
      password: hashedPassword,
      role: "admin", 
      celular:  "+56912345678",
      perfilCliente: null,
      googleAuth: {
        googleId: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiryDate: null,
        isAuthorized: false, 
      },
    });

    await newAdmin.save();
    console.log("✅ Usuario administrador creado exitosamente con éxito.");
  } catch (error) {
    console.error("❌ Error al intentar crear el usuario administrador:", error.message);
  }
};


export { createRoles , createAdminUser};