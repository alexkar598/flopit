import { builder } from "../../../builder.ts";
import { redis } from "../../../redis.ts";

builder.mutationField("resetCache", (t) =>
  t.boolean({
    resolve: async () => {
      const keys = await redis.keys("cache:*");
      if (!keys.length) return false;
      await redis.del(keys);
      return true;
    },
  }),
);
