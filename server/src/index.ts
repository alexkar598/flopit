import { PothosValidationError } from "@pothos/core";
import { createYoga, maskError } from "graphql-yoga";
import { GraphQLError } from "graphql/error";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { resolveAuthentication } from "./modules/auth/auth.ts";
import { schema, writeSchemaToFile } from "./schema.ts";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

const yoga = createYoga<{ req: IncomingMessage; res?: ServerResponse }>({
  schema: schema,
  landingPage: false,
  batching: true,
  graphiql: {
    subscriptionsProtocol: "WS",
  },
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

const wsServer = new WebSocketServer({
  server: server,
  path: yoga.graphqlEndpoint,
});

useServer(
  {
    execute: (args: any) => args.rootValue.execute(args),
    subscribe: (args: any) => args.rootValue.subscribe(args),
    onSubscribe: async (ctx, msg) => {
      const { schema, execute, subscribe, contextFactory, parse, validate } =
        yoga.getEnveloped({
          ...ctx,
          req: ctx.extra.request,
          socket: ctx.extra.socket,
          params: msg.payload,
        });

      const args = {
        schema,
        operationName: msg.payload.operationName,
        document: parse(msg.payload.query),
        variableValues: msg.payload.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe,
        },
      };

      const errors = validate(args.schema, args.document);
      if (errors.length) return errors;
      return args;
    },
  },
  wsServer,
);

server.listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile();
