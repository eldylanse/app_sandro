"use strict";

import { connect } from "mongoose";
import { DB_URL } from "./configEnv.js";
import { handleError } from "../utils/errorHandler.js";


async function setupDB() {
  try {
    await connect(DB_URL);
    console.log("=> Conectado a la base de datos");
  } catch (err) {
    handleError(err, "/configDB.js -> setupDB");
  }
}

export { setupDB };