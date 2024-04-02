import { builder } from "../../builder.ts";
import { prisma } from "../../db.ts";
import { getAPIError } from "../../util.ts";

export const subRef = builder.prismaNode("Sub", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    iconOid: t.expose("icon_oid", {
      type: "OID",
      nullable: true,
    }),
    bannerOid: t.expose("banner_oid", {
      type: "OID",
      nullable: true,
    }),
    isFollowing: t.boolean({
      select: {
        id: true,
      },
      nullable: true,
      resolve: async ({ id: sub_id }, _args, { authenticated_user_id }) => {
        if (authenticated_user_id == null)
          throw getAPIError("AUTHENTICATED_FIELD");
        return (
          (await prisma.follow.findUnique({
            where: {
              user_id_sub_id: { sub_id, user_id: authenticated_user_id },
            },
          })) != null
        );
      },
    }),
  }),
});
