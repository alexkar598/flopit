import { createClient } from "redis";
import { PromiseReturnType } from "@prisma/client/extension";

export async function createRedisClient() {
  const client = createClient({ url: process.env.REDIS_URL! });
  client.on("error", (err) => console.error("Redis Client Error", err));
  await client.connect();
  return client;
}

export const redis = process.env.REDIS_URL
  ? await createRedisClient()
  : (null as unknown as PromiseReturnType<typeof createRedisClient>);
