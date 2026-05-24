import mongoose, { Schema, Document } from "mongoose";
import { ROLES } from "@/config/constants";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: string;
  permissions?: string[];
  phone?: string;
  branchId?: mongoose.Types.ObjectId; // For Branch Managers & Delivery Staff
  notificationTokens?: string[]; // FCM Push Tokens
  lastSeen?: Date;
  addresses: {
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
    isDefault: boolean;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    image: { type: String },
    role: { 
      type: String, 
      enum: Object.values(ROLES), 
      default: ROLES.CUSTOMER 
    },
    permissions: [{ type: String }],
    phone: { type: String },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    notificationTokens: [{ type: String }],
    lastSeen: { type: Date, default: Date.now },
    addresses: [
      {
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
        isDefault: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
