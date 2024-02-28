import fs from "fs";
import path from "node:path";
import { builder } from "./schema/_builder.ts";
import { printSchema } from "graphql/utilities";

for (const module of fs
  .readdirSync(path.join(import.meta.dirname, "schema"))
  .filter((x) => x !== "" && !x.startsWith("_") && x.endsWith(".ts"))) {
  await import("./schema/" + module);
}

export const schema = builder.toSchema();

export const writeSchemaToFile = (filename = "schema.graphql") =>
  fs.writeFileSync(filename, printSchema(schema));
