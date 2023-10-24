import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string(),
    DATABASE_URL: z.string().url(),
    PORT: z.string().nullish(),
    A_IP: z.string().nullish(),
    JWT_SECRET: z.string().nullish(),
    NODE_ENV: z.enum(['development', 'test', 'production']).nullish(),
  },

  client: {},

  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT,
    A_IP: process.env.A_IP,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV
  },
});
