import { builder } from "../../builder.ts";
import { prisma } from "../../db.ts";
import { getAPIError, getImg } from "../../util.ts";

export const subRef = builder.prismaNode("Sub", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    iconUrl: t.string({
      select: {
        icon_oid: true,
      },
      nullable: true,
      resolve: ({ icon_oid }) => getImg(icon_oid),
    }),
    bannerUrl: t.string({
      select: {
        banner_oid: true,
      },
      nullable: true,
      resolve: ({ banner_oid }) => getImg(banner_oid),
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
    isModerator: t.boolean({
      select: {
        id: true,
      },
      nullable: true,
      resolve: async ({ id: sub_id }, _args, { authenticated_user_id }) => {
        if (authenticated_user_id == null)
          throw getAPIError("AUTHENTICATED_FIELD");
        return (
          (await prisma.moderator.findUnique({
            where: {
              user_id_sub_id: { sub_id, user_id: authenticated_user_id },
            },
          })) != null
        );
      },
    }),
  }),
});
