import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import RelayPlugin from "@pothos/plugin-relay";
import { DateTimeResolver } from "graphql-scalars";
import { prisma } from "../db.ts";

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

builder.globalConnectionField("totalCount", (t) =>
  t.int({
    nullable: true,
    resolve: (parent) =>
      typeof parent.totalCount === "function"
        ? parent.totalCount()
        : parent.totalCount,
  }),
);

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
