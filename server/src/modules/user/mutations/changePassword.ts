import { builder } from "../../../builder.ts";
import { minioUploadFileNullableHelper } from "../../../minio.ts";
import { getAPIError } from "../../../util.ts";
import { prisma } from "../../../db.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  validate_new_password,
  validate_user_credentials,
} from "../../auth/auth.ts";

const input = builder.inputType("ChangePasswordInput", {
  fields: (t) => ({
    old: t.string(),
    new: t.string(),
  }),
});

builder.mutationField("changePassword", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "User",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      await validate_user_credentials({ id: authenticated_user_id }, input.old);

      const { salt, password } = await validate_new_password(input.new);

      return prisma.user.update({
        ...query,
        where: { id: authenticated_user_id },
        data: {
          salt,
          password,
        },
      });
    },
  }),
);
