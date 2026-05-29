import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/lib/db/models/User";
import { Branch } from "../src/lib/db/models/Branch";
import { Category } from "../src/lib/db/models/Category";
import { Product } from "../src/lib/db/models/Product";
import { Settings } from "../src/lib/db/models/Settings";
import { ROLES } from "../src/config/constants";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI as string;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🟢 Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Branch.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log("🧹 Cleared existing database records");

    // 1. Settings
    await Settings.create({
      siteName: "HPF",
      siteDescription: "Premium Food Delivery",
      theme: { primaryColor: "#7c3aed", secondaryColor: "#f59e0b", accentColor: "#10b981" },
    });

    // 2. Super Admin
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || "admin123", 10);
    const superAdmin = await User.create({
      name: "Super Admin",
      email: process.env.ADMIN_DEFAULT_EMAIL || "admin@hpf.com",
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    });
    console.log("👤 Super Admin created");

    // 3. Branches (Delhi - Zakir Nagar, Connaught Place, Greater Noida)
    const zakirNagarBranch = await Branch.create({
      name: "Pizza Fun Zakir Nagar",
      address: { street: "C-80 Hannan Road", city: "Delhi", state: "Delhi", zip: "110025" },
      location: { type: "Point", coordinates: [77.2447, 28.5244] }, // Long, Lat - Zakir Nagar
      deliveryRadiusKm: 8,
      contactNumber: "+919876543210",
    });

    const cpBranch = await Branch.create({
      name: "Pizza Fun Connaught Place",
      address: { street: "E-52 Connaught Place", city: "Delhi", state: "Delhi", zip: "110001" },
      location: { type: "Point", coordinates: [77.1903, 28.6328] }, // Long, Lat - Connaught Place
      deliveryRadiusKm: 6,
      contactNumber: "+919876543211",
    });

    const noidaBranch = await Branch.create({
      name: "Pizza Fun Greater Noida",
      address: { street: "Plot 56 Sector 12", city: "Greater Noida", state: "Uttar Pradesh", zip: "201301" },
      location: { type: "Point", coordinates: [77.5847, 28.4089] }, // Long, Lat - Greater Noida
      deliveryRadiusKm: 10,
      contactNumber: "+919876543212",
    });
    console.log("🏢 Branches created");

    // 4. Categories
    const pizzaCategory = await Category.create({ name: "Pizza", order: 1 });
    const sushiCategory = await Category.create({ name: "Sushi", order: 2 });
    const burgersCategory = await Category.create({ name: "Burgers", order: 3 });
    const italianCategory = await Category.create({ name: "Italian", order: 4 });
    console.log("📂 Categories created");

    // 5. Products
    const products = [
      {
        name: "The Golden Truffle Pizza",
        description: "Premium truffle oil, wild mushrooms, and aged mozzarella.",
        price: 32,
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600",
        categoryId: pizzaCategory._id,
        isVegetarian: true,
        foodType: "veg",
        addons: [{ name: "Extra Truffle", price: 5 }],
      },
      {
        name: "Sushi Zen Platter",
        description: "Assorted premium nigiri and sashimi platter.",
        price: 45,
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600",
        categoryId: sushiCategory._id,
        isVegetarian: false,
        foodType: "nonveg",
        addons: [{ name: "Spicy Mayo", price: 1 }],
      },
      {
        name: "Wagyu Craft Burger",
        description: "Double wagyu patty, caramelized onions, artisan bun.",
        price: 24,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
        categoryId: burgersCategory._id,
        isVegetarian: false,
        foodType: "nonveg",
        addons: [{ name: "Truffle Fries", price: 6 }],
      },
    ];

    await Product.insertMany(products);
    console.log("🍔 Products created");

    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
