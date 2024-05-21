import { PothosValidationError } from "@pothos/core";
import { createYoga, maskError } from "graphql-yoga";
import { GraphQLError } from "graphql/error";
import { resolveAuthentication } from "./modules/auth/auth.ts";
import { schema, writeSchemaToFile } from "./schema.ts";
import { ZodError } from "zod";
import { ErrorCode } from "~shared/apierror.ts";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

const yoga = createYoga<{
  req: IncomingMessage;
  res?: ServerResponse;
  cookie: string;
}>({
  schema: schema,
  landingPage: false,
  batching: true,
  graphiql: {
    subscriptionsProtocol: "WS",
  },
  context: async ({ res, cookie }) => {
    const [authenticated_user_id, authenticated_session_id] =
      (await resolveAuthentication(cookie ?? "", res)) ?? [];
    return {
      authenticated_user_id,
      authenticated_session_id,
    };
  },
  maskedErrors: {
    maskError: (error, message, isDev) => {
      if (error instanceof GraphQLError) {
        if (error.originalError instanceof ZodError) {
          error.message = "Une erreur de validation s'est produite";
          error.extensions.issues = error.originalError.errors;
          error.extensions.code = "VALIDATION_ERROR" satisfies ErrorCode;
          return error;
        }
        if (error.originalError instanceof PothosValidationError) return error;
      }

      return maskError(error, message, isDev);
    },
  },
});

const yogaWithCookie = (req: IncomingMessage, res: ServerResponse) =>
  yoga(req, res, { res, req, cookie: req.headers.cookie });

const httpServer = createServer(yogaWithCookie);
const wsServer = new WebSocketServer({
  server: httpServer,
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
          cookie: ctx.extra.request.headers.cookie,
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

httpServer.listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile();
