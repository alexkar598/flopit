import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import RelayPlugin from "@pothos/plugin-relay";
import {
  BigIntResolver,
  DateTimeResolver,
  JSONObjectResolver,
} from "graphql-scalars";
import { prisma } from "../db.ts";
import { capitalizeFirst } from "../util.ts";

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
  };
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
});
builder.addScalarType("DateTime", DateTimeResolver);
builder.addScalarType("JSON", JSONObjectResolver);
builder.addScalarType("BigInt", BigIntResolver);
builder.scalarType("OID", {
  serialize: (x) => x,
  parseValue: (x) => {
    if (typeof x !== "string") {
      throw new Error("Les OIDs doivent être un string");
    }
    if (x.length !== 40) {
      throw new Error("Les OIDs doivent avoir 40 caractères");
    }
    if (/[^A-Fa-f0-9]/.test(x)) {
      throw new Error("Les OIDs doivent être des valeurs hexadécimals");
    }

    return x;
  },
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
          [fieldName]: t.arg.string({
            required: true,
          }),
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
          [fieldName + "s"]: t.arg.stringList({
            required: true,
          }),
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
