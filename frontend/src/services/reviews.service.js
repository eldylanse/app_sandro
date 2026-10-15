import api from './root.service'

const resource = '/reviews'

export async function getReviews() {
  const { data } = await api.get(resource)
  return data
}

export async function getFeaturedReviews() {
  const { data } = await api.get(`${resource}/featured`)
  return data
}

export async function createReview(reviewData) {
  const { data } = await api.post(resource, reviewData)
  return data
}

export async function deleteReview(reviewId) {
  const { data } = await api.delete(`${resource}/${reviewId}`)
  return data
}

export async function toggleFeaturedReview(reviewId) {
  const { data } = await api.patch(`${resource}/${reviewId}/featured`)
  return data
}
