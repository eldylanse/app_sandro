import api from './root.service'

export async function getClients() {
  const { data } = await api.get('/users/clientes')
  return data.clients
}

export async function deleteClient(clientId) {
  const { data } = await api.delete(`/users/clientes/${clientId}`)
  return data
}

export async function getClientProfile() {
  const { data } = await api.get('/users/perfil')
  return data.data
}

export async function getGoogleAuthUrl() {
  const { data } = await api.get('/users/google/auth-url')
  return data
}

export async function getGoogleConnectionStatus() {
  const { data } = await api.get('/users/google/status')
  return data.data.isConnected
}

export async function completeClientProfile(profileData) {
  const { data } = await api.patch('/users/completar-perfil', profileData)
  return data
}

export async function addClientMeasurement(measurement) {
  const { data } = await api.post('/users/mediciones', measurement)
  return data.data
}

// Esta ruta recibe el redirect de Google y redirige al frontend; no debe
// consumirse con Axios durante el flujo OAuth.
export function getGoogleCallbackUrl({ code, state } = {}) {
  const callbackUrl = new URL('/users/google/callback', api.defaults.baseURL)
  if (code) callbackUrl.searchParams.set('code', code)
  if (state) callbackUrl.searchParams.set('state', state)
  return callbackUrl.toString()
}
