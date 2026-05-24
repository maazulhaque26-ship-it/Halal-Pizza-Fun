import { Inventory, IInventory } from "@/lib/db/models/Inventory";
import mongoose from "mongoose";

/**
 * InventoryService
 * 
 * Manages per-branch inventory tracking
 * Enables inventory-aware order routing and real-time stock checks
 */
export class InventoryService {
  /**
   * Get inventory for a product at a specific branch
   */
  static async getInventoryItem(
    branchId: string | mongoose.Types.ObjectId,
    productId: string | mongoose.Types.ObjectId
  ): Promise<IInventory | null> {
    try {
      const inventory = await Inventory.findOne({
        branchId,
        productId,
      }).populate("branchId productId");

      return inventory;
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      throw new Error("Failed to fetch inventory item");
    }
  }

  /**
   * Check if product is available at branch
   */
  static async isProductAvailable(
    branchId: string | mongoose.Types.ObjectId,
    productId: string | mongoose.Types.ObjectId
  ): Promise<boolean> {
    try {
      const inventory = await Inventory.findOne({
        branchId,
        productId,
        quantity: { $gt: 0 },
      });

      return !!inventory;
    } catch (error) {
      console.error("Error checking product availability:", error);
      throw new Error("Failed to check product availability");
    }
  }

  /**
   * Check multiple products availability at branch
   */
  static async areProductsAvailable(
    branchId: string | mongoose.Types.ObjectId,
    productIds: (string | mongoose.Types.ObjectId)[]
  ): Promise<{
    available: (string | mongoose.Types.ObjectId)[];
    unavailable: (string | mongoose.Types.ObjectId)[];
  }> {
    try {
      const inventories = await Inventory.find({
        branchId,
        productId: { $in: productIds },
      });

      const availableIds = inventories
        .filter((inv) => inv.quantity > 0)
        .map((inv) => inv.productId.toString());

      const unavailableIds = productIds.filter(
        (id) => !availableIds.includes(id.toString())
      );

      return {
        available: availableIds,
        unavailable: unavailableIds,
      };
    } catch (error) {
      console.error("Error checking products availability:", error);
      throw new Error("Failed to check products availability");
    }
  }

  /**
   * Get all inventory for a branch
   */
  static async getBranchInventory(
    branchId: string | mongoose.Types.ObjectId
  ): Promise<IInventory[]> {
    try {
      const inventory = await Inventory.find({
        branchId,
      })
        .populate("productId", "name category")
        .sort({ productId: 1 });

      return inventory;
    } catch (error) {
      console.error("Error fetching branch inventory:", error);
      throw new Error("Failed to fetch branch inventory");
    }
  }

  /**
   * Get low stock items for a branch
   */
  static async getLowStockItems(
    branchId: string | mongoose.Types.ObjectId
  ): Promise<IInventory[]> {
    try {
      const inventory = await Inventory.find({
        branchId,
        $expr: { $lte: ["$quantity", "$reorderLevel"] },
      })
        .populate("productId", "name")
        .sort({ quantity: 1 });

      return inventory;
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      throw new Error("Failed to fetch low stock items");
    }
  }

  /**
   * Get out of stock items for a branch
   */
  static async getOutOfStockItems(
    branchId: string | mongoose.Types.ObjectId
  ): Promise<IInventory[]> {
    try {
      const inventory = await Inventory.find({
        branchId,
        quantity: 0,
      })
        .populate("productId", "name")
        .sort({ lastUpdatedAt: -1 });

      return inventory;
    } catch (error) {
      console.error("Error fetching out of stock items:", error);
      throw new Error("Failed to fetch out of stock items");
    }
  }

  /**
   * Update inventory quantity
   */
  static async updateInventoryQuantity(
    branchId: string | mongoose.Types.ObjectId,
    productId: string | mongoose.Types.ObjectId,
    quantity: number,
    notes?: string
  ): Promise<IInventory | null> {
    try {
      const inventory = await Inventory.findOneAndUpdate(
        { branchId, productId },
        {
          quantity,
          lastUpdatedAt: new Date(),
          notes,
          isAvailable: quantity > 0,
        },
        { new: true, upsert: true }
      );

      return inventory;
    } catch (error) {
      console.error("Error updating inventory:", error);
      throw new Error("Failed to update inventory");
    }
  }

  /**
   * Increment inventory quantity (restock)
   */
  static async incrementInventory(
    branchId: string | mongoose.Types.ObjectId,
    productId: string | mongoose.Types.ObjectId,
    quantity: number
  ): Promise<IInventory | null> {
    try {
      const inventory = await Inventory.findOneAndUpdate(
        { branchId, productId },
        {
          $inc: { quantity },
          lastRestockedAt: new Date(),
          lastUpdatedAt: new Date(),
          isAvailable: true,
        },
        { new: true, upsert: true }
      );

      return inventory;
    } catch (error) {
      console.error("Error incrementing inventory:", error);
      throw new Error("Failed to increment inventory");
    }
  }

  /**
   * Decrement inventory quantity (used in order fulfillment)
   */
  static async decrementInventory(
    branchId: string | mongoose.Types.ObjectId,
    productId: string | mongoose.Types.ObjectId,
    quantity: number
  ): Promise<IInventory | null> {
    try {
      const inventory = await Inventory.findOne({ branchId, productId });

      if (!inventory || inventory.quantity < quantity) {
        throw new Error("Insufficient inventory for this item");
      }

      const updated = await Inventory.findOneAndUpdate(
        { branchId, productId },
        {
          $inc: { quantity: -quantity },
          lastUpdatedAt: new Date(),
          isAvailable: inventory.quantity - quantity > 0,
        },
        { new: true }
      );

      return updated;
    } catch (error) {
      console.error("Error decrementing inventory:", error);
      throw error;
    }
  }

  /**
   * Initialize inventory for all products at a new branch
   */
  static async initializeBranchInventory(
    branchId: mongoose.Types.ObjectId,
    products: { productId: mongoose.Types.ObjectId; quantity: number }[]
  ): Promise<IInventory[]> {
    try {
      const inventories = await Inventory.insertMany(
        products.map((p) => ({
          branchId,
          productId: p.productId,
          quantity: p.quantity,
          reorderLevel: 5,
          isAvailable: p.quantity > 0,
        }))
      );

      return inventories;
    } catch (error) {
      console.error("Error initializing branch inventory:", error);
      throw new Error("Failed to initialize branch inventory");
    }
  }

  /**
   * Find branches with product in stock
   */
  static async findBranchesWithProduct(
    productId: string | mongoose.Types.ObjectId,
    excludeBranchId?: string | mongoose.Types.ObjectId
  ): Promise<IInventory[]> {
    try {
      const query: any = {
        productId,
        quantity: { $gt: 0 },
      };

      if (excludeBranchId) {
        query.branchId = { $ne: excludeBranchId };
      }

      const inventories = await Inventory.find(query)
        .populate("branchId", "name contactNumber")
        .sort({ quantity: -1 });

      return inventories;
    } catch (error) {
      console.error("Error finding branches with product:", error);
      throw new Error("Failed to find branches with product");
    }
  }
}
