import { redis } from "./redis.ts";

export const cache = {
  get(key: string): Promise<string | null> {
    return redis.get("cache:" + key);
  },

  async set(key: string, value: { toString(): string } | null): Promise<void> {
    if (value == null) {
      await redis.del("cache:" + key);
      return;
    }

    await redis.set("cache:" + key, value.toString());
  },

  async getOrSet(
    key: string,
    getNewValue: string | (() => string | Promise<string>),
  ): Promise<string> {
    const oldValue = await this.get(key);

    if (oldValue != null) return oldValue;

    const newValue =
      typeof getNewValue === "function" ? await getNewValue() : getNewValue;

    void this.set(key, newValue);

    return newValue;
  },

  ns(ns: string) {
    return new Proxy(this, {
      get(proxiedCache, name: keyof typeof cache) {
        return (key: string, arg: any) =>
          proxiedCache[name](ns + ":" + key, arg);
      },
    });
  },
} as const;
