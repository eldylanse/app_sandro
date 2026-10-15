export function isClientProfileComplete(profile) {
  const data = profile?.perfilCliente
  return Boolean(
    data &&
      Number(data.edad) > 0 &&
      Number(data.altura) > 0 &&
      Number(data.peso) > 0,
  )
}
