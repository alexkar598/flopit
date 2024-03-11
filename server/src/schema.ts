import fs from "fs";
import path from "node:path";
import { builder } from "./builder.ts";
import { printSchema } from "graphql/utilities";

for (const module of fs.readdirSync(path.join(import.meta.dirname, "modules"), {
  recursive: true,
  withFileTypes: true,
})) {
  if (!module.isFile()) continue;
  if (module.name.startsWith("_")) continue;

  await import(path.join(module.path, module.name));
}

export const schema = builder.toSchema();

export const writeSchemaToFile = (filename = "schema.graphql") =>
  fs.writeFileSync(filename, printSchema(schema));
