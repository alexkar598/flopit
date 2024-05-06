import { builder } from "../../builder.ts";
import { prisma } from "../../db.ts";

builder.queryField("currentSession", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "Session",
    nullable: true,
    resolve: (query, root, args, { authenticated_session_id }) =>
      prisma.session.findUnique({
        ...query,
        where: {
          id: authenticated_session_id,
        },
      }),
  }),
);
builder.queryField("currentUser", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "User",
    nullable: true,
    resolve: (query, root, args, { authenticated_user_id }) =>
      prisma.user.findUnique({
        ...query,
        where: {
          id: authenticated_user_id,
        },
      }),
  }),
);
