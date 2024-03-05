export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  NOT_IMPLEMENTED: "Cette opération n'est pas encore implémentée",
  INVALID_OID: "Un OID fournit est invalide",
  BAD_CREDENTIALS: "Courriel ou mot de passe invalide",
  DUPLICATE_USERNAME: "Ce nom d'utilisateur est déja utilisé",
  DUPLICATE_EMAIL: "Ce courriel est déja utilisé",
  TRIVIAL_PASSWORD: "Le mot de passe doit avoir au moins 6 caractères",
});
