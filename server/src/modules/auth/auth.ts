import cookie from "cookie";
import crypto from "crypto";
import { jwtVerify, SignJWT } from "jose";
import {
  AuthenticationStatusHeader,
  HEADER_NAME_AUTHENTICATION_STATUS,
} from "~shared/headers.ts";
import { prisma } from "../../db.ts";
import { HttpResponse } from "uWebSockets.js";
import { getAPIError, memo, unslugify } from "../../util.ts";
import { cache } from "../../cache.ts";
import { Prisma } from ".prisma/client";

export const JWT_SETTINGS = memo(() => ({
  SIGNING_KEY: crypto.createSecretKey(process.env.JWT_SIGNING_KEY!, "hex"),
  ALG: "HS256",
  AUTHORITY: "flopit",
}));

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
      alg: JWT_SETTINGS().ALG,
      typ: "auth",
    })
    .setAudience(JWT_SETTINGS().AUTHORITY)
    .setIssuer(JWT_SETTINGS().AUTHORITY)
    .setJti(session_id)
    .setSubject(user_gid)
    .setIssuedAt()
    .setNotBefore("0s")
    .setExpirationTime("1d")
    .sign(JWT_SETTINGS().SIGNING_KEY);

  return cookie.serialize("token", token, {
    expires: undefined,
    httpOnly: true,
    maxAge: 86400,
    sameSite: "strict",
  });
}

export function clearCookie(res: HttpResponse) {
  res.cork(() => {
    res.writeHeader(
      "Set-Cookie",
      cookie.serialize("token", "_", { maxAge: 1 }),
    );
    res.writeHeader(
      HEADER_NAME_AUTHENTICATION_STATUS,
      AuthenticationStatusHeader.DEAUTHENTICATED.toString(),
    );
  });
}

// Garanti d'être 100% aléatoire, généré avec un lancer de dés
const NULL_SALT = Buffer.from(
  "c01b9823613ee86cbc67a605d9efd59d82963d334c7e1a44e341514cbc042b17",
  "hex",
);
export async function validate_user_credentials(
  selector: Prisma.UserWhereUniqueInput,
  password: string,
) {
  const user = await prisma.user.findUnique({
    where: selector,
    select: {
      salt: true,
      password: true,
      id: true,
    },
  });

  const hash = await compute_hash(user?.salt ?? NULL_SALT, password);
  if (
    user?.salt === undefined ||
    user.password === undefined ||
    !crypto.timingSafeEqual(hash, user.password)
  )
    throw getAPIError("BAD_CREDENTIALS");
  return user;
}

export async function validate_new_password(cleartext_password: string) {
  if (cleartext_password.length < 6)
    throw getAPIError(
      "INSECURE_PASSWORD",
      "Il devrait avoir au moins 6 caractères",
    );

  const pwnedCache = cache.ns("pwned");

  //Empêche de spam l'API
  let breach_count = parseInt(
    (await pwnedCache.get(cleartext_password)) ?? "0",
  );
  if (breach_count)
    throw getAPIError(
      "INSECURE_PASSWORD",
      `Il fait partie de ${breach_count} brèches de données`,
    );

  const password_sha1 = crypto
    .createHash("sha1")
    .update(cleartext_password)
    .digest()
    .toString("hex")
    .toUpperCase();

  const salt = crypto.randomBytes(32);
  const [password] = await Promise.all([
    compute_hash(salt, cleartext_password),
    //Vérification en même temps
    fetch(
      "https://api.pwnedpasswords.com/range/" + password_sha1.substring(0, 5),
      {
        headers: { "User-Agent": "FlopIt/1.0" },
      },
    )
      .then((res) => res.text())
      .then((res) =>
        res
          .split("\n")
          .find((line) => line.startsWith(password_sha1.substring(5))),
      )
      .then((line): void => {
        const breach_count = parseInt(line?.split(":")[1] ?? "0");
        if (breach_count) {
          pwnedCache.set(cleartext_password, breach_count);
          throw getAPIError(
            "INSECURE_PASSWORD",
            `Il fait partie de ${breach_count} brèches de données`,
          );
        }
      }),
  ]);
  return { salt, password };
}

export async function resolveAuthentication(
  cookieHeader: string,
  res?: HttpResponse,
) {
  const jwt = cookie.parse(cookieHeader).token;
  if (jwt == null) {
    if (res)
      res.cork(() =>
        res.writeHeader(
          HEADER_NAME_AUTHENTICATION_STATUS,
          AuthenticationStatusHeader.UNAUTHENTICATED.toString(),
        ),
      );
    return;
  }

  const result = await jwtVerify(jwt, JWT_SETTINGS().SIGNING_KEY, {
    typ: "auth",
    algorithms: [JWT_SETTINGS().ALG],
    audience: JWT_SETTINGS().AUTHORITY,
    issuer: JWT_SETTINGS().AUTHORITY,
  }).catch(() => null);

  if (result == null) {
    if (res) clearCookie(res);
    return;
  }

  const session_id = result.payload.jti!;
  const user_gid = result.payload.sub!;
  const user_id = unslugify(user_gid).id;

  if (
    !(await prisma.session.findUnique({
      select: { id: true },
      where: {
        id: session_id,
        user_id: user_id,
        revocation_time: null,
      },
    }))
  ) {
    if (res) clearCookie(res);
    return;
  }

  if (res) {
    const token = await get_token(user_gid, session_id);
    res.cork(() => {
      res.writeHeader("Set-Cookie", token);
      res.writeHeader(
        HEADER_NAME_AUTHENTICATION_STATUS,
        AuthenticationStatusHeader.AUTHENTICATED.toString(),
      );
    });
  }

  return [user_id, session_id];
}
