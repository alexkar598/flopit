export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  NOT_IMPLEMENTED: "Cette opération n'est pas encore implémentée",
  INVALID_OID: "Un OID fournit est invalide",
  BAD_CREDENTIALS: "Courriel ou mot de passe invalide",
  DUPLICATE_USERNAME: "Ce nom d'utilisateur est déja utilisé",
  DUPLICATE_EMAIL: "Ce courriel est déja utilisé",
  TRIVIAL_PASSWORD: "Le mot de passe doit avoir au moins 6 caractères",
  DUPLICATE_SUB_NAME: "Un sub avec ce nom existe déjà",
  AUTHENTICATED_FIELD: "Cette information nécessite une session active",
  AUTHENTICATED_MUTATION: "Cette opération nécessite une session active",
  SUB_NOT_FOUND: "Ce f/ n'a pas été trouvé",
  POST_NOT_FOUND: "Ce message n'a pas été trouvé",
  USER_NOT_FOUND: "Cet utilisateur n'existe pas",
  MESSAGE_SELF: "Vous ne pouvez pas envoyer un message à vous-même",
  CONVERSATION_NOT_FOUND: "Cette conversation n'existe pas",
  BLOCKED: "Cet utilisateur vous a bloqué",
});
