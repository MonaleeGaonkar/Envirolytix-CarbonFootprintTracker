import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  title?: string;
  description?: string;
  userId: mongoose.Types.ObjectId | string;
  meta?: any;
  createdAt?: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    title: String,
    description: String,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: "createdAt" } }
);

export default mongoose.model<IActivity>("Activity", activitySchema);
