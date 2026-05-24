import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryPartner extends Document {
  user: mongoose.Types.ObjectId;
  branch: mongoose.Types.ObjectId;
  vehicleType: "bike" | "bicycle" | "car";
  vehicleNumber: string;
  licenseNumber: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  isAvailable: boolean;
  ratings: number;
  totalDeliveries: number;
  currentOrder?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    vehicleType: {
      type: String,
      enum: ["bike", "bicycle", "car"],
      required: true,
    },
    vehicleNumber: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    ratings: { type: Number, default: 5.0 },
    totalDeliveries: { type: Number, default: 0 },
    currentOrder: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

export const DeliveryPartner = mongoose.models.DeliveryPartner || mongoose.model<IDeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);
