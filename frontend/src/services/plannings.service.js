import api from './root.service'

const resource = '/plannings'

export async function getPlannings() {
  const { data } = await api.get(resource)
  return data
}

export async function getPlanningById(planningId) {
  const { data } = await api.get(`${resource}/${planningId}`)
  return data
}

export async function createPlanning(planningData) {
  const { data } = await api.post(resource, planningData)
  return data
}

export async function updatePlanning(planningId, planningData) {
  const { data } = await api.put(`${resource}/${planningId}`, planningData)
  return data
}

export async function addPerformanceRecord(planningId, performanceData) {
  const { data } = await api.post(`${resource}/${planningId}/performance`, performanceData)
  return data
}

export async function updateTrainingDayStatus(planningId, statusData) {
  const { data } = await api.patch(`${resource}/${planningId}/dias/estado`, statusData)
  return data
}

export async function getTrainingDaySurvey(planningId, dayId) {
  const { data } = await api.get(`${resource}/${planningId}/dias/${dayId}/encuesta`)
  return data
}

export async function getPlanningSurveys(planningId) {
  const { data } = await api.get(`${resource}/${planningId}/encuestas`)
  return data
}

export async function saveTrainingDaySurvey(planningId, dayId, surveyData) {
  const { data } = await api.put(`${resource}/${planningId}/dias/${dayId}/encuesta`, surveyData)
  return data
}

export async function deletePlanning(planningId) {
  const { data } = await api.delete(`${resource}/${planningId}`)
  return data
}
