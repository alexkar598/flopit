import * as fs from "fs";
import { createYoga } from "graphql-yoga";
import { printSchema } from "graphql/utilities";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { builder } from "./schema/_builder.js";
import { resolveAuthentication } from "./schema/auth.ts";

for (const module of fs
  .readdirSync(path.join(import.meta.dirname, "schema"))
  .filter((x) => x !== "" && !x.startsWith("_") && x.endsWith(".ts"))) {
  await import("./schema/" + module);
}

const schema = builder.toSchema();

const yoga = createYoga<{ req: IncomingMessage; res: ServerResponse }>({
  schema: schema,
  landingPage: false,
  context: async ({ req, res }) => {
    const [authenticated_user_id, authenticated_session_id] =
      (await resolveAuthentication(req, res)) ?? [];
    return {
      authenticated_user_id,
      authenticated_session_id,
    };
  },
});

const server = createServer(yoga);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

fs.writeFileSync("schema.graphql", printSchema(schema));
