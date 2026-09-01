import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding production database...");

  const rawOwnerPassword = process.env.INITIAL_OWNER_PASSWORD || process.env.OWNER_PASSWORD || "OwnerSecurePass2026!";
  const rawItAdminPassword = process.env.INITIAL_IT_ADMIN_PASSWORD || process.env.IT_ADMIN_PASSWORD || rawOwnerPassword;


  await prisma.garageSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      garageName: "NEETEL AUTOSPARES",
      address: "Industrial Area, Nairobi, Kenya",
      phone: "+254 700 000000",
      email: "info@neetelautospares.com",
      currency: "KES",
      currencySymbol: "KSh",
      taxRate: 16,
      taxName: "VAT",
      receiptFooter: "Thank you for choosing NEETEL AUTOSPARES!",
      businessHours: {
        monday: "8:00 AM - 6:00 PM",
        tuesday: "8:00 AM - 6:00 PM",
        wednesday: "8:00 AM - 6:00 PM",
        thursday: "8:00 AM - 6:00 PM",
        friday: "8:00 AM - 6:00 PM",
        saturday: "9:00 AM - 4:00 PM",
        sunday: "Closed",
      },
    },
  });


  const itAdminPasswordHash = await bcrypt.hash(rawItAdminPassword, 12);

  await prisma.user.upsert({
    where: { email: "louisnderitu20@gmail.com" },
    update: {
      name: "Louis Nderitu",
      phone: "0787570236",
      password: itAdminPasswordHash,
      role: UserRole.IT_ADMIN,
      isActive: true,
    },
    create: {
      name: "Louis Nderitu",
      email: "louisnderitu20@gmail.com",
      phone: "0787570236",
      password: itAdminPasswordHash,
      role: UserRole.IT_ADMIN,
      isActive: true,
    },
  });


  const ownerPasswordHash = await bcrypt.hash(rawOwnerPassword, 12);

  await prisma.user.upsert({
    where: { email: "owner@neetelautospares.com" },
    update: {
      password: ownerPasswordHash,
      isActive: true,
    },
    create: {
      name: "Garage Owner",
      email: "owner@neetelautospares.com",
      password: ownerPasswordHash,
      role: UserRole.OWNER,
      phone: "+254 700 000001",
      isActive: true,
    },
  });


  const categories = [
    "Engine Parts",
    "Tyres & Wheels",
    "Batteries",
    "Brakes",
    "Filters",
    "Oils & Fluids",
    "Electrical",
    "Suspension",
    "Body Parts",
    "Accessories",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }


  const services = [
    { name: "Oil Change", defaultRate: 1500.0, description: "Standard engine oil and filter service" },
    { name: "Wheel Alignment", defaultRate: 2500.0, description: "Computerized 4-wheel alignment check" },
    { name: "Brake Inspection", defaultRate: 1000.0, description: "Comprehensive brake pad and disc inspection" },
    { name: "Brake Pad Replacement", defaultRate: 2000.0, description: "Front or rear brake pad fitment service" },
    { name: "Engine Diagnostics", defaultRate: 3000.0, description: "Full vehicle OBD-II diagnostic scan" },
    { name: "Battery Replacement", defaultRate: 800.0, description: "Battery testing and installation" },
    { name: "Air Filter Replacement", defaultRate: 500.0, description: "Engine air filter installation" },
    { name: "Full Service", defaultRate: 800.0, description: "Comprehensive major vehicle service" },
    { name: "Tyre Rotation", defaultRate: 1200.0, description: "4-wheel tyre rotation and pressure check" },
    { name: "AC Service", defaultRate: 4500.0, description: "Air conditioning gas recharge and leak test" },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: { defaultRate: s.defaultRate, description: s.description },
      create: { name: s.name, defaultRate: s.defaultRate, description: s.description },
    });
  }

  console.log("Production database initialized successfully!");
  console.log("Administrator accounts created using environment variables.");
  console.log("All demo data, demo staff, sample products, and test records omitted.");
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
