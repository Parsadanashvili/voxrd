"use strict";

export default {
  port: process.env.PORT || 8000,
  jwt: {
    secret: (process.env.JWT_SECRET ?? "secret_voxrd") as string,
    expiresIn: 60 * 60 * 24 * 30,
  },
};