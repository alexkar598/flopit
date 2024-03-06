import { builder } from "../../builder.ts";
import { prisma } from "../../db.ts";
import { getAPIError } from "../../util.ts";

builder.queryField("currentSession", (t) =>
  t.prismaField({
    type: "Session",
    nullable: true,
    resolve: (query, root, args, { authenticated_session_id }) => {
      if (authenticated_session_id == null)
        throw getAPIError("AUTHENTICATED_FIELD");
      return prisma.session.findUnique({
        ...query,
        where: {
          id: authenticated_session_id,
        },
      });
    },
  }),
);
builder.queryField("currentUser", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    resolve: (query, root, args, { authenticated_user_id }) => {
      if (authenticated_user_id == null)
        throw getAPIError("AUTHENTICATED_FIELD");
      return prisma.user.findUnique({
        ...query,
        where: {
          id: authenticated_user_id,
        },
      });
    },
  }),
);
