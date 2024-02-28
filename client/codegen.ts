import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../server/schema.graphql",
  documents: ["src/**/*.graphql"],
  generates: {
    "./src/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-apollo-angular",
      ],
    },
  },
  config: {
    addExplicitOverride: true,
    strictScalars: true,
    scalars: {
      OID: "string",
      BigInt: "string",
      DateTime: "string",
      JSON: "unknown",
      Void: "void",
    },
  },
  ignoreNoDocuments: true,
};

export default config;
