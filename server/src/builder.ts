import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import RelayPlugin from "@pothos/plugin-relay";
import {
  BigIntResolver,
  DateTimeResolver,
  JSONObjectResolver,
  VoidResolver,
} from "graphql-scalars";
import { IncomingMessage, ServerResponse } from "node:http";
import { prisma } from "./db.ts";
import { capitalizeFirst, getAPIError, throwException } from "./util.ts";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Connection: {
    totalCount: number | (() => number | Promise<number>);
  };
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    OID: {
      Input: string;
      Output: string;
    };
    JSON: {
      Input: unknown;
      Output: unknown;
    };
    BigInt: {
      Input: String;
      Output: BigInt;
    };
    Void: {
      Input: void;
      Output: void;
    };
    File: {
      Input: File;
      Output: never;
    };
  };
  Context: {
    req: IncomingMessage;
    res: ServerResponse;
    authenticated_user_id: string;
    authenticated_session_id: string;
  };
  DefaultInputFieldRequiredness: true;
}>({
  plugins: [PrismaPlugin, RelayPlugin],
  prisma: {
    client: prisma,
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
    onUnusedQuery: process.env.NODE_ENV === "production" ? null : "warn",
  },
  relayOptions: {
    cursorType: "ID",
  },
  defaultInputFieldRequiredness: true,
});
builder.addScalarType("DateTime", DateTimeResolver);
builder.addScalarType("JSON", JSONObjectResolver);
builder.addScalarType("BigInt", BigIntResolver);
builder.addScalarType("Void", VoidResolver);
builder.scalarType("OID", {
  serialize: (x) => x,
  parseValue: (x) => {
    if (typeof x !== "string") {
      throw getAPIError("INVALID_OID", "L'OID n'est pas un string");
    }
    if (x.length !== 40) {
      throw getAPIError("INVALID_OID", "L'OID n'a pas 40 caractères");
    }
    if (/[^A-Fa-f0-9]/.test(x)) {
      throw getAPIError(
        "INVALID_OID",
        "L'OID n'est pas une valeur hexadécimal",
      );
    }

    return x;
  },
});
builder.scalarType("File", {
  serialize: () =>
    throwException(new Error("Uploads can only be used as input types")),
});

builder.globalConnectionField("totalCount", (t) =>
  t.int({
    nullable: true,
    resolve: (parent) =>
      typeof parent.totalCount === "function"
        ? parent.totalCount()
        : parent.totalCount,
  }),
);

builder.queryType();
builder.mutationType();

export function frozenWithTotalCount<T extends object>(
  obj: T,
  totalCount: number | (() => number | Promise<number>),
) {
  return Object.freeze(
    Object.assign(Object.create(obj) as T, {
      totalCount,
    }),
  );
}

export function setupPluralIdentifyingRootFields<
  T extends keyof PrismaTypes,
  U extends keyof PrismaTypes[T]["Shape"],
>(fieldName: string, modelName: T, modelFieldName: U) {
  builder.queryFields((t) => ({
    [`${modelName.toLowerCase()}By${capitalizeFirst(fieldName)}`]:
      t.prismaField({
        args: {
          [fieldName]: t.arg.string(),
        },
        nullable: true,
        type: modelName,
        resolve: (query, _, args) =>
          (prisma as any)[modelName].findUnique({
            ...query,
            where: { [modelFieldName]: args[fieldName] },
          }),
      }),
    [`${modelName.toLowerCase()}By${capitalizeFirst(fieldName)}s`]:
      t.prismaField({
        args: {
          [fieldName + "s"]: t.arg.stringList(),
        },
        nullable: {
          items: true,
          list: false,
        },
        type: [modelName],
        resolve: async (query: any, _, args) => {
          const resolved = await (prisma as any)[modelName].findMany({
            ...query,
            select: {
              ...query.select,
              [modelFieldName]: true,
            },
            where: { [modelFieldName]: { in: args[fieldName + "s"] } },
          });
          const map = Object.fromEntries(
            resolved.map((x: any) => [x[modelFieldName], x]),
          );
          return args[fieldName + "s"].map((x) => map[x]);
        },
      }),
  }));
}
