import { decodeGlobalID } from "@pothos/plugin-relay";
import cookie from "cookie";
import crypto from "crypto";
import { jwtVerify, SignJWT } from "jose";
import { IncomingMessage, ServerResponse } from "node:http";
import {
  AuthenticationStatusHeader,
  HEADER_NAME_AUTHENTICATION_STATUS,
} from "~shared/headers.ts";
import { prisma } from "../../db.ts";

export const JWT_SETTINGS = {
  SIGNING_KEY: crypto.createSecretKey(process.env.JWT_SIGNING_KEY!, "hex"),
  ALG: "HS256",
  AUTHORITY: "flopit",
};

export function compute_hash(salt: Buffer, password: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 600_000, 255, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function get_token(user_gid: string, session_id: string) {
  const token = await new SignJWT()
    .setProtectedHeader({
      alg: JWT_SETTINGS.ALG,
      typ: "auth",
    })
    .setAudience(JWT_SETTINGS.AUTHORITY)
    .setIssuer(JWT_SETTINGS.AUTHORITY)
    .setJti(session_id)
    .setSubject(user_gid)
    .setIssuedAt()
    .setNotBefore("0s")
    .setExpirationTime("1d")
    .sign(JWT_SETTINGS.SIGNING_KEY);

  return cookie.serialize("token", token, {
    expires: undefined,
    httpOnly: true,
    secure: true,
    maxAge: 86400,
    sameSite: "strict",
  });
}

export function clearCookie(res: ServerResponse) {
  res.appendHeader("Set-Cookie", cookie.serialize("token", "_", { maxAge: 1 }));
  res.setHeader(
    HEADER_NAME_AUTHENTICATION_STATUS,
    AuthenticationStatusHeader.DEAUTHENTICATED,
  );
}

export async function resolveAuthentication(
  req: IncomingMessage,
  res?: ServerResponse,
) {
  const jwt = cookie.parse(req.headers.cookie ?? "").token;
  if (jwt == null) {
    res?.setHeader(
      HEADER_NAME_AUTHENTICATION_STATUS,
      AuthenticationStatusHeader.UNAUTHENTICATED,
    );
    return null;
  }

  const result = await jwtVerify(jwt, JWT_SETTINGS.SIGNING_KEY, {
    typ: "auth",
    algorithms: [JWT_SETTINGS.ALG],
    audience: JWT_SETTINGS.AUTHORITY,
    issuer: JWT_SETTINGS.AUTHORITY,
  }).catch(() => null);

  if (result == null) {
    if (res) clearCookie(res);
    return;
  }

  const session_id = result.payload.jti!;
  const user_gid = result.payload.sub!;

  if (
    await prisma.session.findUnique({
      select: { id: true },
      where: { id: session_id, revocation_time: { not: null } },
    })
  ) {
    if (res) clearCookie(res);
    return;
  }

  res?.appendHeader("Set-Cookie", await get_token(user_gid, session_id));
  res?.setHeader(
    HEADER_NAME_AUTHENTICATION_STATUS,
    AuthenticationStatusHeader.AUTHENTICATED,
  );
  return [decodeGlobalID(user_gid).id, session_id];
}
