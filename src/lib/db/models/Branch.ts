import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  images?: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  location?: {
    type: "Point";
    coordinates: number[]; // [longitude, latitude]
  };
  deliveryRadiusKm: number;
  isActive: boolean;
  isAcceptingOrders: boolean;
  contactNumber: string;
  whatsappNumber?: string;
  managerId?: mongoose.Types.ObjectId;
  activeOrders: number;
  deliveryCharge?: number;
  estimatedDeliveryTime?: string;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  isDeleted: boolean;
  notificationSettings: {
    email: boolean;
    push: boolean;
  };
  operatingHours: {
    open: string; // e.g., "09:00"
    close: string; // e.g., "23:00"
  };
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: String },
    description: { type: String },
    images: { type: [String], default: [] },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    deliveryRadiusKm: { type: Number, required: true, default: 10 },
    isActive: { type: Boolean, default: true, index: true },
    isAcceptingOrders: { type: Boolean, default: true },
    contactNumber: { type: String, required: true },
    whatsappNumber: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    activeOrders: { type: Number, default: 0 },
    deliveryCharge: { type: Number },
    estimatedDeliveryTime: { type: String, default: "30-45 mins" },
    seoMetadata: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      metaKeywords: { type: String },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    operatingHours: {
      open: { type: String, required: true, default: "09:00" },
      close: { type: String, required: true, default: "22:00" },
    },
  },
  { timestamps: true }
);

// Important for geospatial queries (finding nearest branch)
BranchSchema.index({ location: "2dsphere" });

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);
