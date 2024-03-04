export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  NOT_IMPLEMENTED: "Cette opération n'est pas encore implémentée",
  INVALID_OID: "Un OID fournit est invalide",
  BAD_CREDENTIALS: "Courriel ou mot de passe invalide",
});
