import * as fs from "fs";
import { createYoga } from "graphql-yoga";
import { printSchema } from "graphql/utilities";
import { createServer } from "node:http";
import path from "node:path";
import { builder } from "./schema/_builder.js";

for (const module of fs
  .readdirSync(path.join(import.meta.dirname, "schema"))
  .filter((x) => x !== "" && !x.startsWith("_") && x.endsWith(".ts"))) {
  await import("./schema/" + module);
}

const schema = builder.toSchema();

const yoga = createYoga({
  schema: schema,
  landingPage: false,
});

const server = createServer(yoga);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

fs.writeFileSync("schema.graphql", printSchema(schema));
