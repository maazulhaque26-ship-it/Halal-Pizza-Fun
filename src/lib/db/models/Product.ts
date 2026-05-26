import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  isVegetarian: boolean;
  isAvailable: boolean;
  isDeleted: boolean;
  preparationTimeMin: number;
  sortOrder: number;
  hasVariants: boolean; // When true, variants drive pricing; base price is a fallback
  addons: {
    name: string;
    price: number;
    isAvailable: boolean;
  }[];
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    isVegetarian: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    preparationTimeMin: { type: Number, default: 15 },
    sortOrder: { type: Number, default: 0 },
    hasVariants: { type: Boolean, default: false },
    addons: [
      {
        name: { type: String },
        price: { type: Number },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
