import { createApp } from "./app";
import { assertSessionSecretIsSafe, env } from "./config/env";
import { connectDb, disconnectDb } from "./db/connect";

const start = async (): Promise<void> => {
  assertSessionSecretIsSafe();

  await connectDb();
  console.log(`[db] connected to ${env.mongodbUri.replace(/\/\/[^@]*@/, "//<credentials>@")}`);

  const server = createApp().listen(env.port, () => {
    console.log(`[api] Indexnine Resume Builder listening on port ${env.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(() => {
      disconnectDb().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error) => {
  console.error("[api] failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
