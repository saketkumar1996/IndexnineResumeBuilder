import mongoose, { Model, Schema, Types } from "mongoose";
import type { LooseResumeData } from "../types/resume";

export interface ApiResumeVersion {
  id: string;
  resume_id: string;
  user_id: string;
  version_number: number;
  label: string;
  data: LooseResumeData;
  created_at?: string;
}

export interface ResumeVersionDoc {
  _id: Types.ObjectId;
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  versionNumber: number;
  label: string;
  data: LooseResumeData;
  createdAt: Date;
  updatedAt: Date;
}

interface ResumeVersionMethods {
  toApiJSON(): ApiResumeVersion;
}

type ResumeVersionModelType = Model<ResumeVersionDoc, Record<string, never>, ResumeVersionMethods>;

const resumeVersionSchema = new Schema<ResumeVersionDoc, ResumeVersionModelType, ResumeVersionMethods>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    versionNumber: { type: Number, required: true },
    label: { type: String, default: "" },
    data: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
  },
  { timestamps: true, minimize: false }
);

resumeVersionSchema.index({ resumeId: 1, versionNumber: 1 }, { unique: true });
resumeVersionSchema.index({ userId: 1, resumeId: 1 });

resumeVersionSchema.methods.toApiJSON = function toApiJSON(this: ResumeVersionDoc): ApiResumeVersion {
  return {
    id: this._id.toString(),
    resume_id: this.resumeId.toString(),
    user_id: this.userId.toString(),
    version_number: this.versionNumber,
    label: this.label || "",
    data: (this.data || {}) as LooseResumeData,
    created_at: this.createdAt?.toISOString(),
  };
};

export const ResumeVersion = mongoose.model<ResumeVersionDoc, ResumeVersionModelType>(
  "ResumeVersion",
  resumeVersionSchema
);
