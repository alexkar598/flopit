import { createClient } from "redis";

export async function createRedisClient() {
  const client = createClient({ url: process.env.REDIS_URL! });
  client.on("error", (err) => console.error("Redis Client Error", err));
  await client.connect();
  return client;
}
