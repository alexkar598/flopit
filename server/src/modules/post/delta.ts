import { z } from "zod";
import { minioUploadFile } from "../../minio.ts";
import { getImg, ImageTransformations } from "../../util.ts";

export const deltaValidator = z
  .object({
    ops: z.array(
      z.object({
        insert: z.union([z.string(), z.object({ image: z.string() })]),
        attributes: z
          .object({
            header: z.number().int().gte(1).lte(6).optional(),
            link: z.string().optional(),
            strike: z.boolean().optional(),
            italic: z.boolean().optional(),
            bold: z.boolean().optional(),
            blockquote: z.boolean().optional(),
            "code-block": z.enum(["plain"]).optional(),
            list: z.enum(["ordered", "bullet"]).optional(),
          })
          .optional(),
      }),
    ),
  })
  .required();

export function quillDeltaToPlainText(
  delta: z.infer<typeof deltaValidator>,
): string {
  return delta.ops.map((op) => op.insert).join("");
}

export function uploadDeltaImagesToS3(
  delta: z.infer<typeof deltaValidator>,
): Promise<unknown> {
  return Promise.all(
    delta.ops
      .map((op) => op.insert)
      .filter(
        (
          ins,
        ): ins is Extract<
          z.infer<typeof deltaValidator>["ops"][0]["insert"],
          object
        > => typeof ins === "object",
      )
      .map(async (ins) => {
        if (!ins.image.startsWith("data:")) {
          // the hash, if present and valid, is the oid
          const hash = new URL(ins.image, "http://localhost").hash.substring(1);
          if (/[0-9a-fA-F]{40}/.test(hash)) ins.image = "oid:" + hash;

          return;
        }

        const blob = await fetch(ins.image).then((res) => res.blob());
        const oid = await minioUploadFile(blob);
        ins.image = "oid:" + oid;
      }),
  );
}

export async function signDeltaImages(
  delta: z.infer<typeof deltaValidator>,
  transformations: ImageTransformations,
): Promise<z.infer<typeof deltaValidator> | null> {
  if (delta.ops == null) return null;

  return {
    ops: delta.ops
      .map((op) => {
        if (typeof op.insert === "string") return op;

        const oid = op.insert.image.match(/oid:([0-9a-fA-F]{40})/)?.[1];
        if (oid == null) return null;

        return {
          insert: {
            image: getImg(oid, transformations) + "#" + oid,
          },
        };
      })
      .filter(
        (op): op is { insert: string | { image: string; imageOid: string } } =>
          op != null,
      ),
  };
}
