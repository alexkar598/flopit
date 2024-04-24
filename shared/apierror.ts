export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  NOT_IMPLEMENTED: "Cette opération n'est pas encore implémentée",
  INVALID_OID: "Un OID fournit est invalide",
  BAD_CREDENTIALS: "Courriel ou mot de passe invalide",
  DUPLICATE_USERNAME: "Ce nom d'utilisateur est déja utilisé",
  DUPLICATE_EMAIL: "Ce courriel est déja utilisé",
  INSECURE_PASSWORD: "Ce mot de passe est insecuritaire",
  DUPLICATE_SUB_NAME: "Une communauté avec ce nom existe déjà",
  AUTHENTICATED_FIELD: "Cette information nécessite une session active",
  AUTHENTICATED_MUTATION: "Cette opération nécessite une session active",
  SUB_NOT_FOUND: "Cette communauté n'a pas été trouvée",
  POST_NOT_FOUND: "Ce message n'a pas été trouvé",
  TITLE_TOO_SHORT: "Le titre doit faire au moins 1 caractère",
  BANNED: "Vous êtes banni de ce sub",
  NOT_SUB_MODERATOR:
    "Vous devez être modérateur de ce sub pour effectuer cette action",
  FILE_UPLOAD_FAIL: "Le téléversement du fichier a échoué",
  INVALID_ID: "Un ID fournit est invalide",
  VALIDATION_ERROR: "Erreur de validation",
});
