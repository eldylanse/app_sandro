"use strict";

import Role from "../models/role.model.js";


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




export { createRoles };