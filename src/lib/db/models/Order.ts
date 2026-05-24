import mongoose, { Schema, Document } from "mongoose";
import { ORDER_STATUS } from "@/config/constants";

export interface IOrder extends Document {
  orderId: string;
  customerId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  areaId: mongoose.Types.ObjectId; // HYPERLOCAL: Customer's selected area
  deliveryStaffId?: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    variantId?: string;
    variantName?: string; // Snapshot of chosen variant label (e.g. "Large", "8 pcs")
    quantity: number;
    price: number;
    selectedAddons: {
      name: string;
      price: number;
    }[];
  }[];
  subTotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: {
    fullName: string;
    phone: string;
    alternatePhone?: string;
    houseNumber: string;
    floor?: string;
    street: string; // Street / Area
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    deliveryInstructions?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string; // e.g., Razorpay payment ID
  realtimeStatus?: string; // e.g., COOKING, PACKING
  deliveryStatus?: string; // e.g., AT_STORE, ON_THE_WAY
  preparationTime?: number; // In minutes
  orderTimeline: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  specialInstructions?: string;
  transferHistory: {
    fromBranchId: mongoose.Types.ObjectId;
    toBranchId: mongoose.Types.ObjectId;
    reason: string;
    transferredAt: Date;
    transferredBy: mongoose.Types.ObjectId;
  }[];
  transferCount: number; // TRANSFER LIMIT: Prevent infinite transfers
  currentTransferCount: number;
  refundStatus?: string; // PENDING, INITIATED, COMPLETED, FAILED
  refundDetails?: {
    refundId: string;
    amount: number;
    reason: string;
    initiatedAt: Date;
    completedAt?: Date;
    status: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    areaId: { type: Schema.Types.ObjectId, ref: "Area", required: false, index: true },
    deliveryStaffId: { type: Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: String },
        variantName: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        selectedAddons: [
          {
            name: { type: String },
            price: { type: Number },
          },
        ],
      },
    ],
    subTotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      alternatePhone: { type: String },
      houseNumber: { type: String, required: true },
      floor: { type: String },
      street: { type: String, required: true },
      landmark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      deliveryInstructions: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentMethod: { type: String, required: true, enum: ["CARD", "CASH", "UPI", "ONLINE", "COD"] },
    paymentStatus: { type: String, required: true, enum: ["PENDING", "PAID", "FAILED"] },
    paymentId: { type: String },
    realtimeStatus: { type: String },
    deliveryStatus: { type: String },
    preparationTime: { type: Number },
    orderTimeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      }
    ],
    specialInstructions: { type: String },
    transferHistory: [
      {
        fromBranchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
        toBranchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
        reason: { type: String, required: true },
        transferredAt: { type: Date, default: Date.now },
        transferredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    transferCount: { type: Number, default: 2 }, // Max allowed transfers
    currentTransferCount: { type: Number, default: 0, index: true },
    refundStatus: {
      type: String,
      enum: ["PENDING", "INITIATED", "COMPLETED", "FAILED"],
    },
    refundDetails: {
      refundId: { type: String },
      amount: { type: Number },
      reason: { type: String },
      initiatedAt: { type: Date },
      completedAt: { type: Date },
      status: { type: String, enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] },
    },
  },
  { timestamps: true }
);

OrderSchema.index({ branchId: 1, status: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ areaId: 1, createdAt: -1 });
OrderSchema.index({ currentTransferCount: 1 });
OrderSchema.index({ refundStatus: 1 });

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
