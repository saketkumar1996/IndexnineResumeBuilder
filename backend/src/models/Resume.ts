import mongoose, { Model, Schema, Types } from "mongoose";
import type { LooseResumeData } from "../types/resume";

/**
 * Snake_case keys are deliberate: the React client reads `template_id`, `created_at`
 * and `updated_at` straight off this payload (frontend/src/utils/api.ts).
 */
export interface ApiResume {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  templateId: string;
  data: LooseResumeData;
  created_at?: string;
  updated_at?: string;
}

export interface ResumeDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  templateId: string;
  data: LooseResumeData;
  createdAt: Date;
  updatedAt: Date;
}

interface ResumeMethods {
  toApiJSON(): ApiResume;
}

type ResumeModelType = Model<ResumeDoc, Record<string, never>, ResumeMethods>;

const resumeSchema = new Schema<ResumeDoc, ResumeModelType, ResumeMethods>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled Resume" },
    templateId: { type: String, default: "indexnine" },
    data: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
  },
  { timestamps: true, minimize: false }
);

resumeSchema.methods.toApiJSON = function toApiJSON(this: ResumeDoc): ApiResume {
  const templateId = this.templateId || "indexnine";
  return {
    id: this._id.toString(),
    user_id: this.userId.toString(),
    title: this.title || "Untitled Resume",
    template_id: templateId,
    templateId,
    data: (this.data || {}) as LooseResumeData,
    created_at: this.createdAt?.toISOString(),
    updated_at: this.updatedAt?.toISOString(),
  };
};

export const Resume = mongoose.model<ResumeDoc, ResumeModelType>("Resume", resumeSchema);
