import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  isDeleted: boolean;
  order: number;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
