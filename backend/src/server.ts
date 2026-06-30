// Patch BigInt serialization capability natively into Express JSON encoders
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

const startServer = async () => {
  try {
    // Assert active communication with PostgreSQL
    await prisma.$connect();
    console.log("🚀 PostgreSQL connection authenticated via Prisma 7.");

    app.listen(env.PORT, () => {
      console.log(`🌐 Server running in [${env.NODE_ENV}] mode on port: ${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Fatal crash initializing engine baseline server components:", error);
    process.exit(1);
  }
};

startServer();