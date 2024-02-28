import { createYoga, maskError } from "graphql-yoga";
import { createServer } from "node:http";
import { schema, writeSchemaToFile } from "./schema.ts";

const yoga = createYoga({
  schema: schema,
  landingPage: false,
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
