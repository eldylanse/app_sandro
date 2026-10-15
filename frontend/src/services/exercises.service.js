import api from './root.service'

const resource = '/exercises'

export async function getExercises() {
  const { data } = await api.get(resource)
  return data
}

export async function createExercise(exerciseData) {
  const { data } = await api.post(resource, exerciseData)
  return data
}

export async function updateExercise(exerciseId, changes) {
  const { data } = await api.put(`${resource}/${exerciseId}`, changes)
  return data
}

export async function deleteExercise(exerciseId) {
  const { data } = await api.delete(`${resource}/${exerciseId}`)
  return data
}
