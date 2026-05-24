import { Area, IArea } from "@/lib/db/models/Area";
import mongoose from "mongoose";

/**
 * AreaService
 * 
 * Manages hyperlocal area-to-branch mapping
 * Enables customers to select their locality without manual branch selection
 */
export class AreaService {
  /**
   * Get all active areas with assigned branches
   */
  static async getAllAreas(): Promise<IArea[]> {
    try {
      const areas = await Area.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .populate("assignedBranchId", "name contactNumber");

      return areas;
    } catch (error) {
      console.error("Error fetching areas:", error);
      throw new Error("Failed to fetch areas");
    }
  }

  /**
   * Get area by ID
   */
  static async getAreaById(areaId: string | mongoose.Types.ObjectId): Promise<IArea | null> {
    try {
      const area = await Area.findById(areaId).populate(
        "assignedBranchId",
        "name contactNumber"
      );
      return area;
    } catch (error) {
      console.error("Error fetching area:", error);
      throw new Error("Failed to fetch area");
    }
  }

  /**
   * Get area by name
   */
  static async getAreaByName(name: string): Promise<IArea | null> {
    try {
      const area = await Area.findOne({ name, isActive: true }).populate(
        "assignedBranchId",
        "name contactNumber"
      );
      return area;
    } catch (error) {
      console.error("Error fetching area by name:", error);
      throw new Error("Failed to fetch area");
    }
  }

  /**
   * Get all areas for a specific branch
   */
  static async getAreasByBranch(
    branchId: string | mongoose.Types.ObjectId
  ): Promise<IArea[]> {
    try {
      const areas = await Area.find({
        assignedBranchId: branchId,
        isActive: true,
      }).sort({ displayOrder: 1 });

      return areas;
    } catch (error) {
      console.error("Error fetching areas for branch:", error);
      throw new Error("Failed to fetch areas for branch");
    }
  }

  /**
   * Create new area
   * ADMIN ONLY
   */
  static async createArea(data: {
    name: string;
    description?: string;
    assignedBranchId: mongoose.Types.ObjectId;
    pinCodes?: string[];
    landmarks?: string[];
    displayOrder?: number;
  }): Promise<IArea> {
    try {
      // Check if area already exists
      const existingArea = await Area.findOne({ name: data.name });
      if (existingArea) {
        throw new Error("Area with this name already exists");
      }

      const area = new Area({
        name: data.name.trim(),
        description: data.description?.trim(),
        assignedBranchId: data.assignedBranchId,
        pinCodes: data.pinCodes || [],
        landmarks: data.landmarks || [],
        displayOrder: data.displayOrder || 0,
        isActive: true,
      });

      await area.save();
      return area;
    } catch (error) {
      console.error("Error creating area:", error);
      throw error;
    }
  }

  /**
   * Update area
   * ADMIN ONLY
   */
  static async updateArea(
    areaId: string | mongoose.Types.ObjectId,
    data: Partial<Omit<IArea, "_id" | "createdAt" | "updatedAt">>
  ): Promise<IArea | null> {
    try {
      const area = await Area.findByIdAndUpdate(areaId, data, { new: true });
      return area;
    } catch (error) {
      console.error("Error updating area:", error);
      throw new Error("Failed to update area");
    }
  }

  /**
   * Deactivate area (soft delete)
   * ADMIN ONLY
   */
  static async deactivateArea(
    areaId: string | mongoose.Types.ObjectId
  ): Promise<IArea | null> {
    try {
      const area = await Area.findByIdAndUpdate(
        areaId,
        { isActive: false },
        { new: true }
      );
      return area;
    } catch (error) {
      console.error("Error deactivating area:", error);
      throw new Error("Failed to deactivate area");
    }
  }

  /**
   * Search areas by name
   */
  static async searchAreas(query: string): Promise<IArea[]> {
    try {
      const areas = await Area.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { landmarks: { $regex: query, $options: "i" } },
        ],
        isActive: true,
      })
        .sort({ displayOrder: 1 })
        .limit(10);

      return areas;
    } catch (error) {
      console.error("Error searching areas:", error);
      throw new Error("Failed to search areas");
    }
  }

  /**
   * Assign area to branch
   * SUPER ADMIN ONLY
   */
  static async reassignAreaToBranch(
    areaId: string | mongoose.Types.ObjectId,
    newBranchId: mongoose.Types.ObjectId
  ): Promise<IArea | null> {
    try {
      const area = await Area.findByIdAndUpdate(
        areaId,
        { assignedBranchId: newBranchId },
        { new: true }
      );
      return area;
    } catch (error) {
      console.error("Error reassigning area:", error);
      throw new Error("Failed to reassign area to branch");
    }
  }
}
