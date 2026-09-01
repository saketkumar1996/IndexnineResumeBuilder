import mongoose, { Model, Schema, Types } from "mongoose";

export interface ApiCoverLetter {
  id: string;
  resume_id: string;
  user_id: string;
  job_description: string;
  content: string;
  created_at?: string;
}

export interface CoverLetterDoc {
  _id: Types.ObjectId;
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  jobDescription: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CoverLetterMethods {
  toApiJSON(): ApiCoverLetter;
}

type CoverLetterModelType = Model<CoverLetterDoc, Record<string, never>, CoverLetterMethods>;

const coverLetterSchema = new Schema<CoverLetterDoc, CoverLetterModelType, CoverLetterMethods>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobDescription: { type: String, default: "" },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

coverLetterSchema.methods.toApiJSON = function toApiJSON(this: CoverLetterDoc): ApiCoverLetter {
  return {
    id: this._id.toString(),
    resume_id: this.resumeId.toString(),
    user_id: this.userId.toString(),
    job_description: this.jobDescription || "",
    content: this.content || "",
    created_at: this.createdAt?.toISOString(),
  };
};

export const CoverLetter = mongoose.model<CoverLetterDoc, CoverLetterModelType>("CoverLetter", coverLetterSchema);
