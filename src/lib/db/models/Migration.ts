import mongoose, { Schema, Document } from "mongoose";

export interface IMigration extends Document {
  name: string;
  appliedAt: Date;
}

const MigrationSchema = new Schema<IMigration>({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
});

export const Migration =
  mongoose.models.Migration || mongoose.model<IMigration>("Migration", MigrationSchema);
