// 🚀 CRITICAL RE-ORDER: Force environment variables to compile before anything else boots up
import { env } from "./config/env";

// Patch BigInt serialization capability natively into Express JSON encoders
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import http from "http";
import app from "./app";
import { prisma } from "./config/db";
import { SocketHub } from "./config/socket.ts";

const PORT = env.PORT || 5000;

// 1. Wrap the Express app layer into a standard structural HTTP Server engine
const server = http.createServer(app);

// 2. Attach the WebSocket engine hub to the unified HTTP server layer
SocketHub.init(server);

// 3. Orchestrate async initialization components cleanly
const startServer = async () => {
  try {
    // 1. Assert active communication with PostgreSQL database
    await prisma.$connect();
    console.log("🚀 PostgreSQL connection authenticated via Prisma 7.");

    // 2. AUTOMATED SELF-HEALING SEEDER:
    // Ensures required rows exist inside your language reference tables after a database reset
    const languageCount = await prisma.language.count();
    if (languageCount === 0) {
      console.log("🌱 Database language rows empty. Seeding runtime parameters...");
      // Execute raw inserts to cleanly map explicit relational primary keys
      await prisma.$executeRaw`INSERT INTO languages (id, name, extension) VALUES (1, 'python', 'py') ON CONFLICT DO NOTHING`;
      await prisma.$executeRaw`INSERT INTO languages (id, name, extension) VALUES (2, 'cpp', 'cpp') ON CONFLICT DO NOTHING`;
      console.log("✅ Python and C++ records seeded successfully.");
    }

    // 3. Boot full-stack network pipeline
    server.listen(PORT, () => {
      console.log(`🌐 Server running in [${env.NODE_ENV}] mode on port: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Fatal crash initializing engine baseline server components:", error);
    process.exit(1);
  }
};

startServer();