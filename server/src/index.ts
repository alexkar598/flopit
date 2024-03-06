import { createYoga } from "graphql-yoga";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { resolveAuthentication } from "./modules/auth/auth.ts";
import { schema, writeSchemaToFile } from "./schema.ts";

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

writeSchemaToFile();
