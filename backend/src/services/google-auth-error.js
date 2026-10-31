export const isInvalidGoogleGrant = (error) => {
  const providerError = error?.response?.data?.error;
  return providerError === "invalid_grant" || error?.message === "invalid_grant";
};
