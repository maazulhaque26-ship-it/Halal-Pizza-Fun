const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb://127.0.0.1:27017/hpf";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB...");

    const db = mongoose.connection.db;
    
    console.log("Clearing existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("settings").deleteMany({});
    await db.collection("branches").deleteMany({});
    await db.collection("categories").deleteMany({});
    await db.collection("products").deleteMany({});

    console.log("Seeding Super Admin...");
    const hashedPwd = await bcrypt.hash("admin123", 10);
    const adminRes = await db.collection("users").insertOne({
      name: "Super Admin",
      email: "admin@hpf.com",
      password: hashedPwd,
      role: "SUPER_ADMIN",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Seeding Settings...");
    await db.collection("settings").insertOne({
      siteName: "HPF",
      siteTagline: "Taste the Difference",
      siteDescription: "A premium multi-branch food delivery platform.",
      theme: { primaryColor: "#7c3aed", secondaryColor: "#4f46e5", accentColor: "#f59e0b" },
      seo: { metaTitle: "HPF - Premium Food Delivery", metaDescription: "Order from the finest restaurants in your city." },
      contactEmail: "hello@hpf.com",
      contactPhone: "+1 800 EPICURE",
      delivery: { baseDeliveryFee: 5, taxPercentage: 8, freeDeliveryAbove: 50 },
      homepage: { 
        heroTitle: "Discover the best flavors around you", 
        heroSubtitle: "Explore top-rated restaurants, cafes, and bars in your city" 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Seeding Branch & Manager...");
    const branchManagerPwd = await bcrypt.hash("manager123", 10);
    const managerRes = await db.collection("users").insertOne({
      name: "Downtown Manager",
      email: "manager@hpf.com",
      password: branchManagerPwd,
      role: "BRANCH_MANAGER",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const branchRes = await db.collection("branches").insertOne({
      name: "Downtown Central HQ",
      contactNumber: "+1 555-1234",
      isActive: true,
      isAcceptingOrders: true,
      deliveryRadiusKm: 10,
      address: { street: "123 Main St", city: "Metropolis", state: "NY", zip: "10001" },
      location: { type: "Point", coordinates: [-73.9851, 40.7589] },
      operatingHours: { open: "08:00", close: "23:00" },
      managerId: managerRes.insertedId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Link manager back to branch
    await db.collection("users").updateOne(
      { _id: managerRes.insertedId },
      { $set: { branchId: branchRes.insertedId } }
    );

    console.log("Seeding Categories...");
    const catRes = await db.collection("categories").insertMany([
      { name: "Pizza", order: 1, isActive: true, createdAt: new Date() },
      { name: "Sushi", order: 2, isActive: true, createdAt: new Date() },
      { name: "Burgers", order: 3, isActive: true, createdAt: new Date() },
      { name: "Italian", order: 4, isActive: true, createdAt: new Date() }
    ]);

    const catMap = {
      Pizza: Object.values(catRes.insertedIds)[0],
      Sushi: Object.values(catRes.insertedIds)[1],
      Burgers: Object.values(catRes.insertedIds)[2],
      Italian: Object.values(catRes.insertedIds)[3],
    };

    console.log("Seeding Products...");
    await db.collection("products").insertMany([
      {
        name: "Truffle Mushroom Pizza",
        description: "Premium truffle oil, wild mushrooms, mozzarella on a crispy base.",
        price: 24,
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600",
        isAvailable: true,
        isVegetarian: true,
        preparationTimeMin: 20,
        categoryId: catMap.Pizza,
        createdAt: new Date()
      },
      {
        name: "Spicy Tuna Roll",
        description: "Fresh tuna, spicy mayo, cucumber, topped with sesame seeds.",
        price: 18,
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600",
        isAvailable: true,
        isVegetarian: false,
        preparationTimeMin: 15,
        categoryId: catMap.Sushi,
        createdAt: new Date()
      },
      {
        name: "Double Smash Burger",
        description: "Two smashed beef patties, cheddar, house sauce, brioche bun.",
        price: 16,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
        isAvailable: true,
        isVegetarian: false,
        preparationTimeMin: 12,
        categoryId: catMap.Burgers,
        createdAt: new Date()
      }
    ]);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
