import { z } from "zod";

export const deltaValidator = z
  .object({
    ops: z.array(
      z.object({
        insert: z.string(),
        attributes: z
          .object({
            header: z.number().int().gte(1).lte(6).optional(),
            link: z.string().optional(),
            underline: z.boolean().optional(),
            strike: z.boolean().optional(),
            italic: z.boolean().optional(),
            bold: z.boolean().optional(),
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
