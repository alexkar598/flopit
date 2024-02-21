import * as fs from "fs";
import { printSchema } from "graphql/utilities";
import { builder } from "../src/schema/_builder.js";
import path from "node:path";

for (const module of fs
  .readdirSync(path.join(import.meta.dirname, "../src/schema"))
  .filter((x) => x !== "" && !x.startsWith("_") && x.endsWith(".ts"))) {
  await import("../src/schema/" + module);
}

const schema = builder.toSchema();

fs.writeFileSync("schema.graphql", printSchema(schema));
