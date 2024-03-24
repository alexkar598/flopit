import { createClient } from "redis";

async function createRedisClient() {
  const client = createClient({ url: process.env.REDIS_URL! });
  client.on("error", (err) => console.error("Redis Client Error", err));
  await client.connect();
  return client;
}

export const redis = await createRedisClient();
