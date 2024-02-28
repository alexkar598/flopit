export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  INVALID_OID: "Un OID fournit est invalide",
});
