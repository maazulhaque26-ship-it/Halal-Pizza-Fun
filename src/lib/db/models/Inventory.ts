import mongoose, { Schema, Document } from "mongoose";

/**
 * Inventory Model
 * 
 * Tracks per-branch inventory for all products.
 * Enables inventory-aware order routing and real-time stock checks.
 * 
 * Example:
 * {
 *   branchId: "branch_1",
 *   productId: "product_123",
 *   quantity: 50,
 *   reorderLevel: 10,
 *   lastUpdatedAt: Date,
 *   lastRestockedAt: Date
 * }
 */
export interface IInventory extends Document {
  branchId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  reorderLevel: number;
  isAvailable: boolean;
  lastUpdatedAt: Date;
  lastRestockedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: function (this: any) {
        return this.quantity > 0;
      },
      index: true,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    lastRestockedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index for unique branch-product combination
InventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });
InventorySchema.index({ branchId: 1, isAvailable: 1 });
InventorySchema.index({ branchId: 1, quantity: 1 });

export const Inventory =
  mongoose.models.Inventory ||
  mongoose.model<IInventory>("Inventory", InventorySchema);
