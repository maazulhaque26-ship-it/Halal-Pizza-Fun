import mongoose, { Schema, Document } from "mongoose";

/**
 * Area Model
 * 
 * Maps customer localities/areas to restaurant branches.
 * Enables hyperlocal routing without GPS dependency.
 * 
 * Example:
 * {
 *   name: "Jamia Nagar",
 *   assignedBranchId: "zakir_nagar_branch",
 *   description: "Jamia Nagar, New Delhi",
 *   pinCodes: ["110025", "110026"],
 *   landmarks: ["Jamia Millia Islamia", "Batla House"],
 *   active: true
 * }
 */
export interface IArea extends Document {
  name: string;
  description?: string;
  assignedBranchId: mongoose.Types.ObjectId;
  pinCodes?: string[];
  landmarks?: string[];
  isActive: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AreaSchema = new Schema<IArea>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedBranchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    pinCodes: {
      type: [String],
      default: [],
    },
    landmarks: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
AreaSchema.index({ assignedBranchId: 1, isActive: 1 });
AreaSchema.index({ isActive: 1, displayOrder: 1 });

export const Area =
  mongoose.models.Area || mongoose.model<IArea>("Area", AreaSchema);
