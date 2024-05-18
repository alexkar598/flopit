import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["src/**/*.graphql"],
  generates: {
    "./src/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-apollo-angular",
        "typescript-apollo-client-helpers",
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
      File: "File",
    },
  },
  ignoreNoDocuments: true,
};

export default config;
