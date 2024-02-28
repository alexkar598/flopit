import { decodeGlobalID, encodeGlobalID } from "@pothos/plugin-relay";
import cookie from "cookie";
import { GraphQLError } from "graphql/error";
import crypto from "crypto";
import { jwtVerify, SignJWT } from "jose";
import { IncomingMessage, ServerResponse } from "node:http";
import { prisma } from "../db.ts";
import { builder } from "./_builder.ts";

const SIGNING_KEY = crypto.createSecretKey(process.env.JWT_SIGNING_KEY!, "hex");
const ALG = "HS256";
const AUTHORITY = "flopit";

// Garanti d'être 100% aléatoire, généré avec un lancer de dés
const NULL_SALT = Buffer.from(
  "c01b9823613ee86cbc67a605d9efd59d82963d334c7e1a44e341514cbc042b17",
  "hex",
);

function compute_hash(salt: Buffer, password: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 600_000, 255, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

builder.mutationField("StartSession", (t) =>
  t.prismaField({
    type: "Session",
    nullable: true,
    args: {
      email: t.arg.string({
        required: true,
      }),
      password: t.arg.string({
        required: true,
      }),
    },
    resolve: async (query, _root, { email, password }, { res }) => {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
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
        throw new GraphQLError("User or password invalid");

      const user_gid = encodeGlobalID("User", user.id);

      const session = await prisma.session.create({
        ...query,
        data: {
          user_id: user.id,
        },
        select: {
          ...query.select,
          id: true,
        },
      });

      res.appendHeader("set-cookie", await get_token(user_gid, session.id));

      return session;
    },
  }),
);
builder.mutationField("EndSession", (t) =>
  t.field({
    type: "Void",
    nullable: true,
    resolve: async (_args, _root, { res }) => clearCookie(res),
  }),
);

async function get_token(user_gid: string, session_id: string) {
  const token = await new SignJWT()
    .setProtectedHeader({
      alg: ALG,
      typ: "auth",
    })
    .setAudience(AUTHORITY)
    .setIssuer(AUTHORITY)
    .setJti(session_id)
    .setSubject(user_gid)
    .setIssuedAt()
    .setNotBefore("0s")
    .setExpirationTime("1d")
    .sign(SIGNING_KEY);

  return cookie.serialize("token", token, {
    expires: undefined,
    httpOnly: true,
    secure: true,
    maxAge: 86400,
  });
}

export async function resolveAuthentication(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const jwt = cookie.parse(req.headers.cookie ?? "").token;
  if (jwt == null) return null;

  const result = await jwtVerify(jwt, SIGNING_KEY, {
    typ: "auth",
    algorithms: [ALG],
    audience: AUTHORITY,
    issuer: AUTHORITY,
  }).catch(() => null);

  if (result == null) return clearCookie(res);

  const session_id = result.payload.jti!;
  const user_gid = result.payload.sub!;

  if (
    await prisma.session.findUnique({
      select: { id: true },
      where: { id: session_id, revocation_time: { not: null } },
    })
  )
    return clearCookie(res);

  res.appendHeader("token", await get_token(user_gid, session_id));
  return [decodeGlobalID(user_gid).id, session_id];
}

function clearCookie(res: ServerResponse) {
  res.appendHeader("Set-Cookie", cookie.serialize("token", "_", { maxAge: 1 }));
}

builder.queryField("session", (t) =>
  t.prismaField({
    type: "Session",
    nullable: true,
    resolve: (query, root, args, { authenticated_session_id }) => {
      if (authenticated_session_id == null) return null;
      return prisma.session.findUnique({
        ...query,
        where: {
          id: authenticated_session_id,
        },
      });
    },
  }),
);
