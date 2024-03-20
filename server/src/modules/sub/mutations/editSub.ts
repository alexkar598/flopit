import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { subRef } from "../schema.ts";
import { minioUploadFileNullableHelper } from "../../../minio.ts";

const input = builder.inputType("EditSubInput", {
  fields: (t) => ({
    id: t.globalID({ for: subRef }),
    description: t.string({ required: false }),
    icon: t.field({ type: "File", required: false }),
    banner: t.field({ type: "File", required: false }),
  }),
});

builder.mutationField("editSub", (t) =>
  t.prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: (query, _root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      return prisma.$transaction(async (tx) => {
        if (
          !(await tx.moderator.findUnique({
            where: {
              user_id_sub_id: {
                user_id: authenticated_user_id,
                sub_id: input.id.id,
              },
            },
          }))
        )
          throw getAPIError("NOT_SUB_MODERATOR");

        return tx.sub.update({
          ...query,
          where: { id: input.id.id },
          data: {
            description: input.description ?? undefined,
            icon_oid: await minioUploadFileNullableHelper(input.icon),
            banner_oid: await minioUploadFileNullableHelper(input.banner),
          },
        });
      });
    },
  }),
);
