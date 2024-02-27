import * as fs from "fs";
import { createYoga } from "graphql-yoga";
import { printSchema } from "graphql/utilities";
import { createServer } from "node:http";
import path from "node:path";
import { builder } from "./schema/_builder.js";
import { schema, writeSchemaToFile } from "./schema.ts";

const yoga = createYoga({
  schema: schema,
  landingPage: false,
});

const server = createServer(yoga);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile("schema.graphql");
