import { google } from "googleapis";
import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET, 
  GOOGLE_REDIRECT_URI 
} from "../config/configEnv.js";

// Helper para instanciar el cliente OAuth2 de Google
export const getGoogleOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

// Servicio para generar la URL de vinculación con Google
export const getGoogleAuthUrlService = async (userId) => {
  const oauth2Client = getGoogleOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/meetings.space.created"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // Requerido para obtener el refreshToken
    prompt: "consent",     // Fuerza la entrega del refreshToken
    scope: scopes,
    state: userId          // Pasamos el ID del usuario para saber de quién son los tokens al volver
  });

  return url;
};

// Servicio para guardar los tokens recibidos en el documento del usuario
export const saveGoogleAuthTokensService = async (userId, code) => {
  const oauth2Client = getGoogleOAuth2Client();

  // Intercambiamos el código de autorización por los tokens
  const { tokens } = await oauth2Client.getToken(code);

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  // Actualizamos el objeto googleAuth en MongoDB
  user.googleAuth = {
    googleId: tokens.id_token || user.googleAuth?.googleId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || user.googleAuth?.refreshToken, // Mantiene el actual si no viene uno nuevo
    tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    isAuthorized: true
  };

  await user.save();

  return { message: "Cuenta de Google vinculada correctamente." };
};