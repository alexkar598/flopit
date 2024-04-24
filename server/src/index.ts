import { PothosValidationError } from "@pothos/core";
import { createYoga, maskError } from "graphql-yoga";
import { GraphQLError } from "graphql/error";
import { resolveAuthentication } from "./modules/auth/auth.ts";
import { schema, writeSchemaToFile } from "./schema.ts";
import { ZodError } from "zod";
import { ErrorCode } from "~shared/apierror.ts";
import { App, HttpRequest, HttpResponse } from "uWebSockets.js";
import { makeBehavior } from "graphql-ws/lib/use/uWebSockets";
import { execute, ExecutionArgs, subscribe } from "graphql";

const yoga = createYoga<{
  req: HttpRequest;
  res?: HttpResponse;
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

type EnvelopedExecutionArgs = ExecutionArgs & {
  rootValue: {
    execute: typeof execute;
    subscribe: typeof subscribe;
  };
};

const wsHandler = makeBehavior({
  execute: (args) => (args as EnvelopedExecutionArgs).rootValue.execute(args),
  subscribe: (args) =>
    (args as EnvelopedExecutionArgs).rootValue.subscribe(args),
  onSubscribe: async (ctx, msg) => {
    const { schema, execute, subscribe, contextFactory, parse, validate } =
      yoga.getEnveloped({
        ...ctx,
        cookie: ctx.extra.persistedRequest.headers.cookie,
      });

    const args: EnvelopedExecutionArgs = {
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
});

const yogaWithCookie = (res: HttpResponse, req: HttpRequest) =>
  yoga(res, req, { res, req, cookie: req.getHeader("cookie") });

App()
  .any("/*", yogaWithCookie)
  .ws(yoga.graphqlEndpoint, wsHandler)
  .listen(3000, () => console.log("GraphQL server started at :3000"));

writeSchemaToFile();
