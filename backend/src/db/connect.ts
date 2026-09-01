import mongoose from "mongoose";
import { env } from "../config/env";

mongoose.set("strictQuery", true);

export const connectDb = async (uri: string = env.mongodbUri): Promise<typeof mongoose> => {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to backend/.env (see backend/.env.example).");
  }
  const connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  // Indexes are declared on the schemas; build them once at startup so unique
  // constraints (user email, resume version number) are enforced from the first write.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
  return connection;
};

export const disconnectDb = async (): Promise<void> => {
  await mongoose.disconnect();
};
