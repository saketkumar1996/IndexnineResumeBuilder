import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, disconnectDb } from "../../db/connect";

let mongod: MongoMemoryServer | null = null;

/**
 * Uses MONGODB_URI_TEST when provided (handy in CI images that already run mongod),
 * otherwise spins up an in-memory MongoDB.
 */
export const startTestDb = async (): Promise<void> => {
  const configured = (process.env.MONGODB_URI_TEST || "").trim();
  if (configured) {
    await connectDb(configured);
    return;
  }
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri("indexnine_resume_builder_test"));
};

export const stopTestDb = async (): Promise<void> => {
  await disconnectDb();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};

export const clearTestDb = async (): Promise<void> => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};
