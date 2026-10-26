"use strict";

import {
  getPlanningTrainingDaySurveysService,
  getTrainingDaySurveyService,
  saveTrainingDaySurveyService,
} from "../services/training-day-survey.service.js";

function getStatusCode(error) {
  return error.message.includes("No encontramos") || error.message.includes("no pertenece") ? 404 : 400;
}

export async function getTrainingDaySurvey(req, res) {
  try {
    const survey = await getTrainingDaySurveyService({
      clientId: req.user.id,
      planningId: req.params.planningId,
      dayId: req.params.dayId,
    });
    return res.status(200).json({ survey });
  } catch (error) {
    return res.status(getStatusCode(error)).json({ message: error.message });
  }
}

export async function getPlanningTrainingDaySurveys(req, res) {
  try {
    const surveys = await getPlanningTrainingDaySurveysService(req.params.planningId);
    return res.status(200).json({ surveys });
  } catch (error) {
    const statusCode = error.message.includes("No encontramos") ? 404 : 400;
    return res.status(statusCode).json({ message: error.message || "No se pudieron cargar las respuestas." });
  }
}

export async function saveTrainingDaySurvey(req, res) {
  try {
    const survey = await saveTrainingDaySurveyService({
      clientId: req.user.id,
      planningId: req.params.planningId,
      dayId: req.params.dayId,
      surveyData: req.body,
    });
    return res.status(200).json({ message: "Encuesta del entrenamiento guardada.", survey });
  } catch (error) {
    return res.status(getStatusCode(error)).json({ message: error.message || "No se pudo guardar la encuesta." });
  }
}
