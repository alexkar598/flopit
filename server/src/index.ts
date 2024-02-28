import { createYoga, maskError } from "graphql-yoga";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { schema, writeSchemaToFile } from "./schema.ts";
import {resolveAuthentication} from "./schema/auth.ts";

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
  maskedErrors: {
    maskError(error, message, isDev) {
      if (error instanceof Error && error.name === "GraphQLError") {
        return error;
      }

      return maskError(error, message, isDev);
    },
  },
});

const server = createServer(yoga);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile();
