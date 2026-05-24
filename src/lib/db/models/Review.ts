import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  user?: mongoose.Types.ObjectId;
  guestName?: string;
  guestAvatar?: string;
  product?: mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestName: { type: String },
    guestAvatar: { type: String },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Review = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
