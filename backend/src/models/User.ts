import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";

export interface ApiUser {
  id: string;
  provider: "local" | "linkedin";
  name: string;
  email: string;
  picture: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  picture: string;
  provider: "local" | "linkedin";
  createdAt: Date;
  updatedAt: Date;
}

interface UserMethods {
  toApiJSON(): ApiUser;
}

type UserModelType = Model<UserDoc, Record<string, never>, UserMethods>;

const userSchema = new Schema<UserDoc, UserModelType, UserMethods>(
  {
    name: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, default: "" },
    picture: { type: String, default: "" },
    provider: { type: String, enum: ["local", "linkedin"], default: "local" },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.methods.toApiJSON = function toApiJSON(this: UserDoc): ApiUser {
  return {
    id: this._id.toString(),
    provider: this.provider || "local",
    name: this.name || "",
    email: this.email || "",
    picture: this.picture || "",
    createdAt: this.createdAt?.toISOString(),
    updatedAt: this.updatedAt?.toISOString(),
  };
};

export type UserDocument = HydratedDocument<UserDoc, UserMethods>;

export const User = mongoose.model<UserDoc, UserModelType>("User", userSchema);
