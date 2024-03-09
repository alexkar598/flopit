import { PothosValidationError } from "@pothos/core";
import { createYoga, maskError } from "graphql-yoga";
import { GraphQLError } from "graphql/error";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { resolveAuthentication } from "./modules/auth/auth.ts";
import { schema, writeSchemaToFile } from "./schema.ts";

const yoga = createYoga<{ req: IncomingMessage; res: ServerResponse }>({
  schema: schema,
  landingPage: false,
  batching: true,
  context: async ({ req, res }) => {
    const [authenticated_user_id, authenticated_session_id] =
      (await resolveAuthentication(req, res)) ?? [];
    return {
      authenticated_user_id,
      authenticated_session_id,
    };
  },
  maskedErrors: {
    maskError: (error, message, isDev) => {
      if (error instanceof GraphQLError) {
        if (error.originalError instanceof PothosValidationError) return error;
      }

      return maskError(error, message, isDev);
    },
  },
});

const server = createServer(yoga);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile();
