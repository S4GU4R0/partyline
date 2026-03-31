// Hardcoded config - no env validation libraries
export const CONFIG = {
  port: 3000,
  host: "localhost",
  dbPath: "./data/resources.db",
} as const;

export type Config = typeof CONFIG;
