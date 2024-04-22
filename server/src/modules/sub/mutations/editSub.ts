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
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      let icon_oid, banner_oid;

      try {
        [icon_oid, banner_oid] = await Promise.all([
          minioUploadFileNullableHelper(input.icon),
          minioUploadFileNullableHelper(input.banner),
        ]);
      } catch {
        throw getAPIError("FILE_UPLOAD_FAIL");
      }

      return prisma.sub.update({
        ...query,
        where: { id: input.id.id },
        data: {
          description: input.description ?? undefined,
          icon_oid,
          banner_oid,
        },
      });
    },
  }),
);
