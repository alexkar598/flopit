export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  INVALID_OID: "Un OID fournit est invalide",
  BAD_CREDENTIALS: "Courriel ou mot de passe invalide",
});
