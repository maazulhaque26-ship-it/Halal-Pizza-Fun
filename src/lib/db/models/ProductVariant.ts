import mongoose, { Schema, Document } from "mongoose";

export interface IProductVariant extends Document {
  productId: mongoose.Types.ObjectId;
  variantName: string;   // e.g. "4 pcs", "6 pcs", "Medium"
  price: number;
  sizeLabel?: string;    // Optional display label
  isAvailable: boolean;
  sortOrder: number;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantName: { type: String, required: true },
    price: { type: Number, required: true },
    sizeLabel: { type: String },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductVariantSchema.index({ productId: 1, sortOrder: 1 });

export const ProductVariant =
  mongoose.models.ProductVariant ||
  mongoose.model<IProductVariant>("ProductVariant", ProductVariantSchema);
