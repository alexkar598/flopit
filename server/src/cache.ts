const memcache = new Map<string, string>();

export const cache = {
  async get(key: string): Promise<string | undefined> {
    return memcache.get(key);
  },

  async set(key: string, value: { toString(): string }): Promise<void> {
    memcache.set(key, value.toString());
  },

  async getOrSet(
    key: string,
    newValue: string | (() => string | Promise<string>),
  ): Promise<string> {
    let value: string | Promise<string> | undefined = await this.get(key);
    if (value === undefined) {
      if (typeof newValue === "function") {
        value = newValue();
        if (typeof value !== "string")
          value.then((stringValue) => this.set(key, stringValue));
      } else value = newValue;
    }

    return value;
  },
} as const;
