import mongoose, { Schema, Document } from "mongoose";

/**
 * Coupon model for discount codes.
 * Admin can create/disable coupons from the dashboard.
 */
export interface ICoupon extends Document {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxUses: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Coupon =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
