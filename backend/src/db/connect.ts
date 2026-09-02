import mongoose from "mongoose";
import { env } from "../config/env";

mongoose.set("strictQuery", true);

let connectPromise: Promise<typeof mongoose> | null = null;
let indexesSynced = false;

const syncIndexes = async (): Promise<void> => {
  if (indexesSynced) return;
  // Indexes are declared on the schemas; build them once so unique constraints
  // (user email, resume version number) are enforced from the first write.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
  indexesSynced = true;
};

/**
 * Reuses the connection across Vercel serverless invocations in the same isolate.
 * Concurrent callers share one in-flight connect() so cold starts do not stampede Atlas.
 */
export const connectDb = async (uri: string = env.mongodbUri): Promise<typeof mongoose> => {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to backend/.env (see backend/.env.example).");
  }
  if (mongoose.connection.readyState === 1) {
    await syncIndexes();
    return mongoose;
  }
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then(async (connection) => {
        await syncIndexes();
        return connection;
      })
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }
  return connectPromise;
};

export const disconnectDb = async (): Promise<void> => {
  connectPromise = null;
  indexesSynced = false;
  await mongoose.disconnect();
};
