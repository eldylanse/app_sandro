import api from './root.service'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

// La API restringe el registro a administradores (creación de clientes).
export async function registerClient(clientData) {
  const { data } = await api.post('/auth/register', clientData)
  return data
}
