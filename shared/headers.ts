export const HEADER_NAME_AUTHENTICATION_STATUS = "Authentication-Status";
export enum AuthenticationStatusHeader {
  //L'utilisateur n'est pas connecté
  UNAUTHENTICATED,
  //L'utilisateur a envoyé un token et il était valide
  AUTHENTICATED,
  //L'utilisateur a envoyé un token, mais il n'est pas ou n'est plus valide
  DEAUTHENTICATED,
}
