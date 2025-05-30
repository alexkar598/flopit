export type ErrorCode = keyof typeof APIError;
export const APIError = Object.freeze({
  INVALID_OID: "Un OID fournit est invalide",
  BAD_CREDENTIALS:
    "Les informations d'authentificaiton fournises sont invalides",
  DUPLICATE_USERNAME: "Ce nom d'utilisateur est déja utilisé",
  DUPLICATE_EMAIL: "Ce courriel est déja utilisé",
  INSECURE_PASSWORD: "Ce mot de passe est insecuritaire",
  DUPLICATE_SUB_NAME: "Une communauté avec ce nom existe déjà",
  AUTHENTICATION_REQUIRED: "Cette opération nécessite une session active",
  SUB_NOT_FOUND: "Cette communauté n'a pas été trouvée",
  POST_NOT_FOUND: "Ce message n'a pas été trouvé",
  BANNED: "Vous êtes banni de ce sub",
  NOT_SUB_MODERATOR:
    "Vous devez être modérateur de ce sub pour effectuer cette action",
  FILE_UPLOAD_FAIL: "Le téléversement du fichier a échoué",
  INVALID_ID: "Un ID fournit est invalide",
  USER_NOT_FOUND: "Cet utilisateur n'existe pas",
  ALREADY_MODERATOR: "Cet utilisateur est déja un modérateur",
  ALREADY_BANNED: "Cet utilisateur est déja banni",
  MODERATOR_NOT_FOUND: "Cet utilisateur n'est pas un modérateur",
  CANNOT_REMOVE_SELF:
    "Vous ne pouvez pas retirer votre propre statut de modérateur",
  UNAUTHORIZED: "Vous n'êtes pas authorisé à accéder à cette information",
  MESSAGE_SELF: "Vous ne pouvez pas envoyer un message à vous-même",
  CONVERSATION_NOT_FOUND: "Cette conversation n'existe pas",
  BLOCKED: "Cet utilisateur vous a bloqué",
  VALIDATION_ERROR: "Erreur de validation",
  PUSH_NOTIFICATION_NOT_FOUND: "Abonnement pas trouvé!",
  PUSH_NOTIFICATION_INVALID: "Abonnement invalide",
});
