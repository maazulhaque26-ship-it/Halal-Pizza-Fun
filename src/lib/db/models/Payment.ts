import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  orderId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: "razorpay" | "upi" | "cod";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  gatewayOrderId?: string;
  receipt?: string;
  orderSnapshot?: any;
  paymentGatewayData?: any;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: {
      type: String,
      enum: ["razorpay", "upi", "cod"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String },
    gatewayOrderId: { type: String, index: true },
    receipt: { type: String, index: true },
    orderSnapshot: { type: Schema.Types.Mixed },
    paymentGatewayData: { type: Schema.Types.Mixed },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ gatewayOrderId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
