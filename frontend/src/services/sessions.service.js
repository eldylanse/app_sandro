import api from './root.service'

const resource = '/sesion'

export async function createSession(sessionData) {
  const { data } = await api.post(resource, sessionData)
  return data
}

export async function getSessions(filters = {}) {
  const { data } = await api.get(resource, { params: filters })
  return data
}

export async function getSessionById(sessionId) {
  const { data } = await api.get(`${resource}/${sessionId}`)
  return data
}

export async function updateSession(sessionId, changes) {
  const { data } = await api.put(`${resource}/${sessionId}`, changes)
  return data
}

export async function cancelSession(sessionId) {
  const { data } = await api.delete(`${resource}/${sessionId}`)
  return data
}
