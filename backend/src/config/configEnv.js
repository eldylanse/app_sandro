"use strict";
// Import the 'path' module to get the absolute path of the .env file
import path from "node:path";
const __dirname = import.meta.dirname;

/** Get the absolute path of the .env file. */
const envFilePath = path.resolve(__dirname, ".env");
import dotenv from "dotenv";
dotenv.config({ path: envFilePath });

export const PORT = process.env.PORT;
export const HOST = process.env.HOST;
export const DB_URL = process.env.DB_URL;
export const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET;
export const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;