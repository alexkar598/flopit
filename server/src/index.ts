import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { schema, writeSchemaToFile } from "./schema.ts";

const yoga = createYoga({
  schema: schema,
  landingPage: false,
});

const server = createServer(yoga);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile();
