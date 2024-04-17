import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { ThemeRef } from "../schema.ts";
import { minioUploadFileNullableHelper } from "../../../minio.ts";

const input = builder.inputType("EditUserInput", {
  fields: (t) => ({
    username: t.string({ required: false }),
    email: t.string({ required: false }),
    avatar: t.field({ type: "File", required: false }),
    theme: t.field({ type: ThemeRef, required: false }),
  }),
});

builder.mutationField("editUser", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      let avatar_oid;

      try {
        avatar_oid = await minioUploadFileNullableHelper(input.avatar);
      } catch {
        throw getAPIError("FILE_UPLOAD_FAIL");
      }

      try {
        return await prisma.user.update({
          ...query,
          where: { id: authenticated_user_id },
          data: {
            username: input.username ?? undefined,
            email: input.email ?? undefined,
            theme: input.theme ?? undefined,
            avatar_oid,
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          //"Unique constraint failed on the {constraint}"
          if (e.code === "P2002" && e.meta?.target === "User_username_key")
            throw getAPIError("DUPLICATE_USERNAME");
          //"Unique constraint failed on the {constraint}"
          if (e.code === "P2002" && e.meta?.target === "User_email_key")
            throw getAPIError("DUPLICATE_EMAIL");
        }
        throw e;
      }
    },
  }),
);
