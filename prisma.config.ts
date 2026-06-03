import { defineConfig } from "prisma/config";

// Prisma v7 configuration.
// DIRECT_URL bypasses pgBouncer for migrate/db push/introspect.
// Runtime queries use DATABASE_URL via the pg adapter in src/lib/prisma/client.ts.

export default defineConfig({
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
});
