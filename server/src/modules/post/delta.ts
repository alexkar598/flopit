import { z } from "zod";

export const Delta = z
  .object({
    ops: z.array(
      z.object({
        insert: z.unknown().optional(),
        delete: z.number().optional(),
        retain: z.number().optional(),
        attributes: z.record(z.unknown()).optional(),
      }),
    ),
  })
  .required();

export function quillDeltaToPlainText(delta: z.infer<typeof Delta>): string {
  return delta.ops
    .filter((op) => typeof op.insert === "string")
    .map((op) => op.insert)
    .join("");
}
