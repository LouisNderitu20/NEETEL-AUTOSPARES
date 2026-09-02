import { PrismaClient, UserRole, JobStatus, PaymentMethod, PaymentStatus, PurchaseOrderStatus, StockMovementType, QuotationStatus, ActivityAction, ReminderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function subDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("Starting comprehensive Kenyan garage database seeding...");

  console.log("Clearing old data...");
  await prisma.activityLog.deleteMany({});
  await prisma.sessionLog.deleteMany({});
  await prisma.serviceReminder.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.jobCardService.deleteMany({});
  await prisma.jobCardItem.deleteMany({});
  await prisma.inspection.deleteMany({});
  await prisma.jobCard.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.garageSettings.deleteMany({});

  console.log("Seeding Garage Settings...");
  const settings = await prisma.garageSettings.create({
    data: {
      id: "default",
      garageName: "NEETEL AUTOSPARES & GARAGE",
      address: "Enterprise Road, Industrial Area, Nairobi, Kenya",
      phone: "+254 700 123 456",
      email: "info@neetelautospares.co.ke",
      website: "https://www.neetelautospares.co.ke",
      currency: "KES",
      currencySymbol: "KSh",
      taxRate: 16,
      taxName: "VAT (16%)",
      receiptFooter: "Thank you for choosing NEETEL AUTOSPARES & GARAGE. Drive safely!",
      businessHours: {
        monday: "7:30 AM - 6:00 PM",
        tuesday: "7:30 AM - 6:00 PM",
        wednesday: "7:30 AM - 6:00 PM",
        thursday: "7:30 AM - 6:00 PM",
        friday: "7:30 AM - 6:00 PM",
        saturday: "8:00 AM - 4:30 PM",
        sunday: "Closed",
      },
    },
  });

  console.log("Seeding Staff Members (Kenyan Names)...");
  const rawDefaultPassword = process.env.SEED_DEFAULT_PASSWORD || "GaragePass2026!";
  const rawAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.IT_ADMIN_PASSWORD || rawDefaultPassword;

  const defaultPasswordHash = await bcrypt.hash(rawDefaultPassword, 10);
  const adminPasswordHash = await bcrypt.hash(rawAdminPassword, 10);

  const itAdmin = await prisma.user.create({
    data: {
      name: "Louis Nderitu",
      email: "louisnderitu20@gmail.com",
      password: adminPasswordHash,
      role: UserRole.IT_ADMIN,
      phone: "+254 787 570 236",
      isActive: true,
    },
  });

  const owner = await prisma.user.create({
    data: {
      name: "Samuel Mwangi",
      email: "owner@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.OWNER,
      phone: "+254 722 100 200",
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Grace Wanjiru",
      email: "grace.wanjiru@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.MANAGER,
      phone: "+254 721 345 678",
      isActive: true,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: "Faith Muthoni",
      email: "faith.muthoni@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.RECEPTIONIST,
      phone: "+254 723 456 789",
      isActive: true,
    },
  });

  const mechanic1 = await prisma.user.create({
    data: {
      name: "Kevin Otieno",
      email: "kevin.otieno@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.MECHANIC,
      phone: "+254 734 567 890",
      isActive: true,
    },
  });

  const mechanic2 = await prisma.user.create({
    data: {
      name: "Dennis Kiprop",
      email: "dennis.kiprop@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.MECHANIC,
      phone: "+254 735 678 901",
      isActive: true,
    },
  });

  const mechanic3 = await prisma.user.create({
    data: {
      name: "Brian Wafula",
      email: "brian.wafula@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.MECHANIC,
      phone: "+254 736 789 012",
      isActive: true,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "Mercy Akinyi",
      email: "mercy.akinyi@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.CASHIER,
      phone: "+254 712 890 123",
      isActive: true,
    },
  });

  const inventoryClerk = await prisma.user.create({
    data: {
      name: "Joseph Ochieng",
      email: "joseph.ochieng@neetelautospares.com",
      password: defaultPasswordHash,
      role: UserRole.INVENTORY_CLERK,
      phone: "+254 713 901 234",
      isActive: true,
    },
  });

  console.log("Seeding Categories...");
  const categoriesData = [
    { name: "Engine Parts", description: "Pistons, gaskets, valves, timing belts, and internal engine components" },
    { name: "Tyres & Wheels", description: "Passenger vehicle, 4x4 SUV, and light commercial tyres and rims" },
    { name: "Batteries", description: "Maintenance-free lead acid and AGM automotive batteries" },
    { name: "Brakes", description: "Brake pads, rotors, drums, wear sensors, and master cylinders" },
    { name: "Filters", description: "Oil filters, air filters, cabin pollen filters, and fuel filters" },
    { name: "Oils & Fluids", description: "Fully synthetic engine oils, ATF, brake fluids, and engine coolants" },
    { name: "Electrical & Ignition", description: "Spark plugs, alternators, starter motors, sensors, and fuses" },
    { name: "Suspension & Steering", description: "Shock absorbers, tie rod ends, control arms, and ball joints" },
    { name: "Transmission & Drivetrain", description: "Clutch kits, CV joints, drive shafts, and transmission filters" },
    { name: "Body & Accessories", description: "Wiper blades, mirrors, lights, horn assemblies, and car care products" },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.name] = await prisma.category.create({ data: cat });
  }

  console.log("Seeding Suppliers...");
  const supplier1 = await prisma.supplier.create({
    data: {
      name: "Toyota Kenya (CFAO Motors)",
      contactName: "John Kariuki",
      email: "parts@cfao.co.ke",
      phone: "+254 20 6967000",
      address: "Lusaka Road, Industrial Area, Nairobi",
      notes: "Authorized OEM Toyota spare parts distributor in East Africa",
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Auto Express Kenya Ltd",
      contactName: "Sarah Kiprono",
      email: "orders@autoexpress.co.ke",
      phone: "+254 722 203878",
      address: "Mombasa Road near City Cabanas, Nairobi",
      notes: "Official distributor for Pirelli, Bridgestone, and KYB shock absorbers",
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      name: "Impala Auto Spares",
      contactName: "Anthony Njuguna",
      email: "sales@impalaautospares.co.ke",
      phone: "+254 721 445566",
      address: "Kirinyaga Road, CBD, Nairobi",
      notes: "Specializes in Japanese motor spares (Subaru, Mazda, Mitsubishi)",
    },
  });

  const supplier4 = await prisma.supplier.create({
    data: {
      name: "Bosch East Africa Authorized Distributor",
      contactName: "Martin Waweru",
      email: "info@bosch-ea.co.ke",
      phone: "+254 733 600700",
      address: "Commercial Street, Industrial Area, Nairobi",
      notes: "Genuine Bosch batteries, spark plugs, sensors, and diagnostic scanners",
    },
  });

  const supplier5 = await prisma.supplier.create({
    data: {
      name: "Nairobi Battery Centre",
      contactName: "Mary Wanjiku",
      email: "sales@nairobibattery.co.ke",
      phone: "+254 722 800900",
      address: "Enterprise Road, Industrial Area, Nairobi",
      notes: "Official Chloride Exide and Solite battery distributor",
    },
  });

  console.log("Seeding Auto Spare Parts & Inventory...");
  const productsData = [
    {
      sku: "BRK-AKE-TOY01",
      name: "Akebono Front Brake Pads (Toyota Hilux / Prado J150)",
      description: "Ceramic low-dust front brake pad set for Land Cruiser Prado & Hilux",
      categoryId: categories["Brakes"].id,
      supplierId: supplier1.id,
      brand: "Akebono",
      unit: "set",
      purchasePrice: 3800,
      sellingPrice: 5500,
      quantity: 24,
      minStockLevel: 5,
      location: "Shelf B-02",
    },
    {
      sku: "OIL-MOB-5W30",
      name: "Mobil 1 ESP Synthetic Engine Oil 5W-30 (4L)",
      description: "Advanced full synthetic motor oil designed for gasoline & diesel engines",
      categoryId: categories["Oils & Fluids"].id,
      supplierId: supplier2.id,
      brand: "Mobil 1",
      unit: "can",
      purchasePrice: 4200,
      sellingPrice: 5800,
      quantity: 35,
      minStockLevel: 8,
      location: "Shelf O-01",
    },
    {
      sku: "FLT-MAN-W712",
      name: "Mann-Filter Oil Filter W712/83 (Subaru / Toyota)",
      description: "Premium spin-on oil filter with high dust retention capacity",
      categoryId: categories["Filters"].id,
      supplierId: supplier3.id,
      brand: "Mann Filter",
      unit: "pcs",
      purchasePrice: 850,
      sellingPrice: 1400,
      quantity: 50,
      minStockLevel: 10,
      location: "Rack F-04",
    },
    {
      sku: "BAT-CHL-65AH",
      name: "Chloride Exide Maintenance Free Battery 65Ah (N50Z)",
      description: "12V 65Ah heavy-duty starter battery for SUVs and pickup trucks",
      categoryId: categories["Batteries"].id,
      supplierId: supplier5.id,
      brand: "Chloride Exide",
      unit: "pcs",
      purchasePrice: 9500,
      sellingPrice: 12800,
      quantity: 14,
      minStockLevel: 4,
      location: "Bay B-01",
    },
    {
      sku: "SPK-NGK-IRID",
      name: "NGK Laser Iridium Spark Plugs Set of 4 (IZFR6K11)",
      description: "High-performance long-life iridium spark plug set for Japanese engines",
      categoryId: categories["Electrical & Ignition"].id,
      supplierId: supplier4.id,
      brand: "NGK",
      unit: "set",
      purchasePrice: 3200,
      sellingPrice: 4800,
      quantity: 20,
      minStockLevel: 6,
      location: "Drawer E-01",
    },
    {
      sku: "TYR-BRI-2656517",
      name: "Bridgestone Dueler A/T 001 (265/65 R17 112T)",
      description: "All-terrain SUV & 4x4 tyre engineered for tough Kenyan road conditions",
      categoryId: categories["Tyres & Wheels"].id,
      supplierId: supplier2.id,
      brand: "Bridgestone",
      unit: "pcs",
      purchasePrice: 18500,
      sellingPrice: 24000,
      quantity: 16,
      minStockLevel: 4,
      location: "Tyre Rack T-01",
    },
    {
      sku: "SUS-KYB-3410",
      name: "KYB Excel-G Front Shock Absorber Pair (Prado J150)",
      description: "Twin-tube gas shock absorber for restored ride comfort & control",
      categoryId: categories["Suspension & Steering"].id,
      supplierId: supplier2.id,
      brand: "KYB",
      unit: "pair",
      purchasePrice: 16000,
      sellingPrice: 22500,
      quantity: 8,
      minStockLevel: 2,
      location: "Rack S-03",
    },
    {
      sku: "FLT-DEN-CAB",
      name: "Denso Activated Carbon Cabin Air Filter",
      description: "Cabin pollen filter for Mazda CX-5, Demio & Axela",
      categoryId: categories["Filters"].id,
      supplierId: supplier3.id,
      brand: "Denso",
      unit: "pcs",
      purchasePrice: 1200,
      sellingPrice: 2000,
      quantity: 30,
      minStockLevel: 5,
      location: "Rack F-08",
    },
    {
      sku: "BLT-CON-6PK",
      name: "Continental Serpentine Fan Belt 6PK2135",
      description: "Multi-V ribbed belt for engine accessory drive systems",
      categoryId: categories["Engine Parts"].id,
      supplierId: supplier3.id,
      brand: "Continental",
      unit: "pcs",
      purchasePrice: 1800,
      sellingPrice: 2700,
      quantity: 22,
      minStockLevel: 5,
      location: "Drawer B-02",
    },
    {
      sku: "FLD-MOT-ATF",
      name: "Motul ATF VI Fully Synthetic Transmission Fluid (1L)",
      description: "High-performance automatic transmission fluid for modern multi-speed gearboxes",
      categoryId: categories["Oils & Fluids"].id,
      supplierId: supplier2.id,
      brand: "Motul",
      unit: "can",
      purchasePrice: 1600,
      sellingPrice: 2400,
      quantity: 40,
      minStockLevel: 10,
      location: "Shelf O-03",
    },
    {
      sku: "BRK-BRE-ROT",
      name: "Brembo Front Vented Brake Disc Rotors Pair (Subaru Forester)",
      description: "High-carbon UV coated front brake disc pair for smooth braking",
      categoryId: categories["Brakes"].id,
      supplierId: supplier3.id,
      brand: "Brembo",
      unit: "pair",
      purchasePrice: 14000,
      sellingPrice: 19500,
      quantity: 6,
      minStockLevel: 2,
      location: "Shelf B-05",
    },
    {
      sku: "RAD-DEN-TOY",
      name: "Denso Replacement Aluminum Radiator (Toyota Premio / Allion)",
      description: "OE replacement complete radiator core assembly",
      categoryId: categories["Engine Parts"].id,
      supplierId: supplier1.id,
      brand: "Denso",
      unit: "pcs",
      purchasePrice: 8500,
      sellingPrice: 13000,
      quantity: 5,
      minStockLevel: 2,
      location: "Rack R-02",
    },
    {
      sku: "WIP-BOS-AER",
      name: "Bosch Aerotwin Flat Wiper Blades Set (24\" / 18\")",
      description: "Synthetic rubber wiper blades with integrated aerodynamic spoiler",
      categoryId: categories["Body & Accessories"].id,
      supplierId: supplier4.id,
      brand: "Bosch",
      unit: "set",
      purchasePrice: 1500,
      sellingPrice: 2400,
      quantity: 35,
      minStockLevel: 8,
      location: "Rack W-01",
    },
    {
      sku: "CLU-AIS-ISZ",
      name: "Aisin Heavy Duty Clutch Kit Complete (Isuzu D-Max 3.0L)",
      description: "Pressure plate, clutch disc & release bearing kit for Isuzu 4JJ1 engine",
      categoryId: categories["Transmission & Drivetrain"].id,
      supplierId: supplier1.id,
      brand: "Aisin",
      unit: "kit",
      purchasePrice: 22000,
      sellingPrice: 31000,
      quantity: 4,
      minStockLevel: 1,
      location: "Shelf T-02",
    },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    products[p.sku] = await prisma.product.create({ data: p });
  }

  console.log("Seeding Garage Services...");
  const servicesData = [
    { name: "Minor Engine Service", defaultRate: 3500.0, description: "Oil change labor, filter replacements, fluid top-ups & safety inspection" },
    { name: "Major Vehicle Service", defaultRate: 9500.0, description: "Comprehensive service including spark plugs, air filter, fuel filter & multi-point check" },
    { name: "Computerized OBD Diagnostic Scan", defaultRate: 2500.0, description: "Full electronic system diagnostic scan, error code readout & reset" },
    { name: "4-Wheel Laser Alignment & Balancing", defaultRate: 3500.0, description: "Computerized 4-wheel alignment calibration and dynamic wheel balancing" },
    { name: "Front & Rear Brake System Service", defaultRate: 4500.0, description: "Brake pad fitment, rotor machining inspection, caliper cleaning & fluid bleed" },
    { name: "Automatic Transmission Fluid Service", defaultRate: 6500.0, description: "ATF fluid drain & refill, transmission filter replacement & pan cleaning" },
    { name: "AC System Leak Test & Refrigerant Refill", defaultRate: 4500.0, description: "Vacuum pressure testing, dye leak detection & R134a refrigerant recharge" },
    { name: "Suspension Bushing & Arm Overhaul", defaultRate: 8500.0, description: "Replacement of control arm bushings, ball joints & stabilizer links" },
    { name: "Auto Electrical & Wiring Repair", defaultRate: 5000.0, description: "Troubleshooting short circuits, alternator charging issues & lighting wiring" },
    { name: "Radiator Coolant Flush & Pressure Test", defaultRate: 3000.0, description: "System chemical flush, cooling system pressure test & fresh coolant refill" },
  ];

  const services: Record<string, any> = {};
  for (const s of servicesData) {
    services[s.name] = await prisma.service.create({ data: s });
  }

  console.log("Seeding Customers (Kenyan Individuals & Corporate Fleets)...");
  const customersData = [
    {
      name: "Josphat Kamau",
      email: "josphat.kamau@gmail.com",
      phone: "+254 722 415 892",
      address: "Ring Road, Westlands, Nairobi",
      notes: "Long-standing customer. Drives Toyota Prado. Prefers synthetic oils.",
      creditLimit: 50000,
      creditBalance: 0,
    },
    {
      name: "Dr. Agnes Njeri",
      email: "dr.njeri@healthcare.co.ke",
      phone: "+254 733 892 104",
      address: "Gitanga Road, Lavington, Nairobi",
      notes: "Requests OEM genuine Mercedes parts only. Prefers Saturday morning drop-off.",
      creditLimit: 100000,
      creditBalance: 0,
    },
    {
      name: "Peter Omondi",
      email: "p.omondi@gmail.com",
      phone: "+254 710 554 321",
      address: "Argwings Kodhek Road, Kilimani, Nairobi",
      notes: "Subaru enthusiast. Regular maintenance customer.",
      creditLimit: 30000,
      creditBalance: 0,
    },
    {
      name: "Catherine Wambui",
      email: "cwambui@yahoo.com",
      phone: "+254 720 998 877",
      address: "Karen Plains, Karen, Nairobi",
      notes: "Drives Mazda CX-5. Prefers text updates on repair progress.",
      creditLimit: 40000,
      creditBalance: 0,
    },
    {
      name: "Hassan Mohammed",
      email: "hassan.mohammed@coastlogistics.co.ke",
      phone: "+254 788 334 455",
      address: "3rd Parklands Avenue, Nairobi",
      notes: "Drives Mitsubishi Pajero. Fleet liaison for Coast Logistics.",
      creditLimit: 150000,
      creditBalance: 24500,
    },
    {
      name: "David Maina",
      email: "dmaina.eng@gmail.com",
      phone: "+254 724 667 788",
      address: "Roysambu, Thika Road, Nairobi",
      notes: "Toyota Premio owner. Regular customer for routine minor services.",
      creditLimit: 25000,
      creditBalance: 0,
    },
    {
      name: "Naomi Chebet",
      email: "nchebet@kenyaairports.co.ke",
      phone: "+254 725 112 233",
      address: "Chwan Gate, Syokimau, Machakos",
      notes: "Drives Volkswagen Tiguan TSI.",
      creditLimit: 60000,
      creditBalance: 0,
    },
    {
      name: "Captain Evans Korir",
      email: "evans.korir@kenyaairways.com",
      phone: "+254 711 443 322",
      address: "Mae Ridge, Runda, Nairobi",
      notes: "Toyota Hilux Double Cab owner. Requests full vehicle inspection every 6 months.",
      creditLimit: 120000,
      creditBalance: 0,
    },
    {
      name: "Beatrice Nyambura",
      email: "bnyambura@gmail.com",
      phone: "+254 728 776 655",
      address: "Langata Estate, Nairobi",
      notes: "Nissan X-Trail owner.",
      creditLimit: 30000,
      creditBalance: 0,
    },
    {
      name: "Safari Tours Ltd (Contact: Patrick Kilonzo)",
      email: "fleet@safaritourskenya.com",
      phone: "+254 700 500 600",
      company: "Safari Tours Ltd",
      address: "Mombasa Road, Industrial Area, Nairobi",
      notes: "Tour company fleet account. Net 30 payment terms.",
      creditLimit: 500000,
      creditBalance: 125000,
    },
    {
      name: "Express Transporters Kenya (Contact: James Mutua)",
      email: "maintenance@expresstransport.co.ke",
      phone: "+254 701 223 344",
      company: "Express Transporters Kenya",
      address: "Old Airport Road, Embakasi, Nairobi",
      notes: "Commercial transport fleet account. Requires monthly invoicing.",
      creditLimit: 750000,
      creditBalance: 210000,
    },
    {
      name: "Rift Valley Hauliers (Contact: Daniel Rotich)",
      email: "service@rvhauliers.co.ke",
      phone: "+254 702 998 811",
      company: "Rift Valley Hauliers",
      address: "Nakuru Highway, Nakuru",
      notes: "Heavy transport fleet account.",
      creditLimit: 400000,
      creditBalance: 0,
    },
  ];

  const customers: Record<string, any> = {};
  for (const c of customersData) {
    customers[c.name] = await prisma.customer.create({ data: c });
  }

  console.log("Seeding Vehicles (Kenyan Reg Plates & Specs)...");
  const vehiclesData = [
    {
      customerId: customers["Josphat Kamau"].id,
      make: "Toyota",
      model: "Land Cruiser Prado J150",
      year: 2018,
      color: "Pearl White",
      licensePlate: "KDA 482G",
      vin: "JTEBH9FJ30K098231",
      engineType: "3.0L 1KD-FTV Turbo Diesel",
      fuelType: "Diesel",
      transmission: "Automatic",
      mileage: 85400,
      notes: "Equipped with front bullbar and auxiliary lights",
    },
    {
      customerId: customers["Dr. Agnes Njeri"].id,
      make: "Mercedes-Benz",
      model: "C200 AMG Line",
      year: 2019,
      color: "Iridium Silver",
      licensePlate: "KCU 915P",
      vin: "WDD2050422R481902",
      engineType: "2.0L Turbo Petrol",
      fuelType: "Petrol",
      transmission: "Automatic",
      mileage: 48200,
      notes: "Maintained strictly with OEM Mercedes parts",
    },
    {
      customerId: customers["Peter Omondi"].id,
      make: "Subaru",
      model: "Forester SJ 2.0XT",
      year: 2016,
      color: "Dark Blue Metallic",
      licensePlate: "KDG 102A",
      vin: "JF1SJ5LC5GG194830",
      engineType: "2.0L FA20 Turbo Boxer",
      fuelType: "Petrol",
      transmission: "Lineartronic CVT",
      mileage: 112500,
      notes: "Aftermarket Brembo brake kit installed",
    },
    {
      customerId: customers["Catherine Wambui"].id,
      make: "Mazda",
      model: "CX-5 XD L-Package",
      year: 2017,
      color: "Soul Red Crystal",
      licensePlate: "KCR 774X",
      vin: "KE2FW-409182",
      engineType: "2.2L SkyActiv-D Diesel",
      fuelType: "Diesel",
      transmission: "Automatic",
      mileage: 79000,
      notes: "Clean interior and bodywork",
    },
    {
      customerId: customers["Hassan Mohammed"].id,
      make: "Mitsubishi",
      model: "Pajero Super Exceed V97",
      year: 2015,
      color: "Deep Black",
      licensePlate: "KDF 339L",
      vin: "JMBLYV97W6J004918",
      engineType: "3.8L V6 Petrol 6G75",
      fuelType: "Petrol",
      transmission: "Automatic",
      mileage: 134000,
      notes: "Heavy towing usage",
    },
    {
      customerId: customers["David Maina"].id,
      make: "Toyota",
      model: "Premio F 1.8",
      year: 2014,
      color: "White Pearl",
      licensePlate: "KCL 805M",
      vin: "ZRT260-3184920",
      engineType: "1.8L 2ZR-FE Valvematic",
      fuelType: "Petrol",
      transmission: "CVT",
      mileage: 142000,
      notes: "Daily commuter vehicle",
    },
    {
      customerId: customers["Naomi Chebet"].id,
      make: "Volkswagen",
      model: "Tiguan 2.0 TSI 4Motion",
      year: 2020,
      color: "Indium Grey",
      licensePlate: "KDK 214W",
      vin: "WVGZZZ5NZLW019284",
      engineType: "2.0L TSI Petrol",
      fuelType: "Petrol",
      transmission: "7-Speed DSG",
      mileage: 36800,
      notes: "Under extended service package",
    },
    {
      customerId: customers["Captain Evans Korir"].id,
      make: "Toyota",
      model: "Hilux Double Cab 4x4",
      year: 2021,
      color: "Oxide Bronze",
      licensePlate: "KCT 560B",
      vin: "AHTFR2CD706019384",
      engineType: "2.8L 1GD-FTV Turbo Diesel",
      fuelType: "Diesel",
      transmission: "Automatic",
      mileage: 62000,
      notes: "Upgraded All-Terrain tires and suspension lift",
    },
    {
      customerId: customers["Beatrice Nyambura"].id,
      make: "Nissan",
      model: "X-Trail T32 20X",
      year: 2016,
      color: "Metallic Red",
      licensePlate: "KDB 881E",
      vin: "NT32-049182",
      engineType: "2.0L MR20DD Petrol",
      fuelType: "Petrol",
      transmission: "CVT",
      mileage: 98300,
      notes: "Panoramicroof model",
    },
    {
      customerId: customers["Safari Tours Ltd (Contact: Patrick Kilonzo)"].id,
      make: "Toyota",
      model: "HiAce Commuter Safari Tour Van",
      year: 2019,
      color: "White (Safari Livery)",
      licensePlate: "KDJ 430S",
      vin: "KDH223-0049281",
      engineType: "3.0L 1KD Turbo Diesel",
      fuelType: "Diesel",
      transmission: "Manual",
      mileage: 175000,
      notes: "Pop-up roof safari converted van",
    },
    {
      customerId: customers["Express Transporters Kenya (Contact: James Mutua)"].id,
      make: "Isuzu",
      model: "D-Max Double Cab 4x4",
      year: 2018,
      color: "Solid White",
      licensePlate: "KDC 119P",
      vin: "MP1TFR85J9T091823",
      engineType: "3.0L 4JJ1 Turbo Diesel",
      fuelType: "Diesel",
      transmission: "Manual",
      mileage: 155000,
      notes: "Field supervision truck",
    },
  ];

  const vehicles: Record<string, any> = {};
  for (const v of vehiclesData) {
    vehicles[v.licensePlate] = await prisma.vehicle.create({ data: v });
  }

  console.log("Seeding Job Cards, Inspections, Invoices & M-PESA / Card Payments...");

  const job1Date = subDays(24);
  const job1 = await prisma.jobCard.create({
    data: {
      jobNumber: "JOB-2026-001",
      customerId: customers["Josphat Kamau"].id,
      vehicleId: vehicles["KDA 482G"].id,
      mechanicId: mechanic1.id,
      createdById: receptionist.id,
      status: JobStatus.BILLED,
      complaint: "Vibration felt on steering wheel when braking above 70 km/h; oil level warning light flickered once.",
      diagnosis: "Front brake rotors warped (runout exceeding 0.12mm); front brake pads worn to 20%. Engine oil level low due to standard interval consumption.",
      notes: "Customer approved rotor replacement and full minor engine service.",
      recommendations: "Recommend 4-wheel alignment after brake service.",
      laborHours: 3.5,
      laborRate: 1000,
      scheduledDate: job1Date,
      startedAt: job1Date,
      completedAt: subDays(23),
      approvedAt: job1Date,
      createdAt: job1Date,
      updatedAt: subDays(23),
      inspection: {
        create: {
          mileage: 85400,
          fuelLevel: "3/4 Full",
          exteriorDamage: "Minor paint scratch on rear bumper left side",
          warningLights: ["Brake Wear Indicator"],
          visibleFaults: "Front right brake disc surface scored",
          customerBelongings: "Spare wheel, jack, wheel spanner, dash camera",
          additionalFindings: "Engine bay clean, battery terminals secure",
          inspectedAt: job1Date,
        },
      },
      items: {
        create: [
          {
            productId: products["BRK-AKE-TOY01"].id,
            quantity: 1,
            unitPrice: products["BRK-AKE-TOY01"].sellingPrice,
            totalPrice: products["BRK-AKE-TOY01"].sellingPrice,
            notes: "Akebono Ceramic front pads",
          },
          {
            productId: products["OIL-MOB-5W30"].id,
            quantity: 2,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice * 2,
            notes: "Mobil 1 5W-30 (8 Litres total)",
          },
          {
            productId: products["FLT-MAN-W712"].id,
            quantity: 1,
            unitPrice: products["FLT-MAN-W712"].sellingPrice,
            totalPrice: products["FLT-MAN-W712"].sellingPrice,
            notes: "Mann spin-on oil filter",
          },
        ],
      },
      services: {
        create: [
          {
            serviceId: services["Minor Engine Service"].id,
            hours: 1.5,
            rate: services["Minor Engine Service"].defaultRate,
            totalPrice: services["Minor Engine Service"].defaultRate,
            notes: "Standard oil change labor & safety checks",
          },
          {
            serviceId: services["Front & Rear Brake System Service"].id,
            hours: 2.0,
            rate: services["Front & Rear Brake System Service"].defaultRate,
            totalPrice: services["Front & Rear Brake System Service"].defaultRate,
            notes: "Pad installation & caliper pin greasing",
          },
        ],
      },
    },
  });

  const subtotal1 = products["BRK-AKE-TOY01"].sellingPrice + (products["OIL-MOB-5W30"].sellingPrice * 2) + products["FLT-MAN-W712"].sellingPrice + services["Minor Engine Service"].defaultRate + services["Front & Rear Brake System Service"].defaultRate;
  const tax1 = Math.round(subtotal1 * 0.16);
  const total1 = subtotal1 + tax1;

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-001",
      jobCardId: job1.id,
      customerId: customers["Josphat Kamau"].id,
      subtotal: subtotal1,
      taxAmount: tax1,
      discountAmount: 0,
      total: total1,
      paymentStatus: PaymentStatus.PAID,
      amountPaid: total1,
      balance: 0,
      notes: "Paid in full via M-PESA on completion.",
      dueDate: subDays(23),
      createdAt: subDays(23),
      updatedAt: subDays(23),
      items: {
        create: [
          {
            description: "Akebono Front Brake Pads (Toyota Hilux / Prado J150)",
            quantity: 1,
            unitPrice: products["BRK-AKE-TOY01"].sellingPrice,
            totalPrice: products["BRK-AKE-TOY01"].sellingPrice,
            productId: products["BRK-AKE-TOY01"].id,
          },
          {
            description: "Mobil 1 ESP Synthetic Engine Oil 5W-30 (8L)",
            quantity: 2,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice * 2,
            productId: products["OIL-MOB-5W30"].id,
          },
          {
            description: "Minor Engine Service Labor",
            quantity: 1,
            unitPrice: services["Minor Engine Service"].defaultRate,
            totalPrice: services["Minor Engine Service"].defaultRate,
            serviceId: services["Minor Engine Service"].id,
          },
          {
            description: "Front & Rear Brake System Service Labor",
            quantity: 1,
            unitPrice: services["Front & Rear Brake System Service"].defaultRate,
            totalPrice: services["Front & Rear Brake System Service"].defaultRate,
            serviceId: services["Front & Rear Brake System Service"].id,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.MOBILE_MONEY,
          amount: total1,
          reference: "QHK9482L9A",
          notes: "M-PESA transaction from 0722415892 - Josphat Kamau",
          processedAt: subDays(23),
          createdAt: subDays(23),
        },
      },
    },
  });

  const job2Date = subDays(18);
  const job2 = await prisma.jobCard.create({
    data: {
      jobNumber: "JOB-2026-002",
      customerId: customers["Dr. Agnes Njeri"].id,
      vehicleId: vehicles["KCU 915P"].id,
      mechanicId: mechanic2.id,
      createdById: receptionist.id,
      status: JobStatus.BILLED,
      complaint: "Scheduled 50,000 km B-Service notification active on instrument cluster.",
      diagnosis: "Engine air filter and cabin dust filter dirty. Spark plugs nearing replacement interval. All brake pads at 60% thickness.",
      notes: "Replaced cabin air filter, engine oil & filter, and conducted computer diagnostic scan.",
      laborHours: 2.5,
      laborRate: 1200,
      scheduledDate: job2Date,
      startedAt: job2Date,
      completedAt: subDays(17),
      approvedAt: job2Date,
      createdAt: job2Date,
      updatedAt: subDays(17),
      inspection: {
        create: {
          mileage: 48200,
          fuelLevel: "Full",
          exteriorDamage: "None - Vehicle pristine",
          warningLights: ["Service B Due"],
          visibleFaults: "None",
          customerBelongings: "First aid kit, owner's manual in glovebox",
          inspectedAt: job2Date,
        },
      },
      items: {
        create: [
          {
            productId: products["OIL-MOB-5W30"].id,
            quantity: 2,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice * 2,
            notes: "Mobil 1 Synthetic oil",
          },
          {
            productId: products["FLT-DEN-CAB"].id,
            quantity: 1,
            unitPrice: products["FLT-DEN-CAB"].sellingPrice,
            totalPrice: products["FLT-DEN-CAB"].sellingPrice,
            notes: "Activated carbon cabin filter",
          },
        ],
      },
      services: {
        create: [
          {
            serviceId: services["Major Vehicle Service"].id,
            hours: 1.0,
            rate: services["Major Vehicle Service"].defaultRate,
            totalPrice: services["Major Vehicle Service"].defaultRate,
            notes: "Service B inspection protocol",
          },
          {
            serviceId: services["Computerized OBD Diagnostic Scan"].id,
            hours: 0.5,
            rate: services["Computerized OBD Diagnostic Scan"].defaultRate,
            totalPrice: services["Computerized OBD Diagnostic Scan"].defaultRate,
            notes: "Reset Mercedes ASSYST PLUS service indicator",
          },
        ],
      },
    },
  });

  const subtotal2 = (products["OIL-MOB-5W30"].sellingPrice * 2) + products["FLT-DEN-CAB"].sellingPrice + services["Major Vehicle Service"].defaultRate + services["Computerized OBD Diagnostic Scan"].defaultRate;
  const tax2 = Math.round(subtotal2 * 0.16);
  const total2 = subtotal2 + tax2;

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-002",
      jobCardId: job2.id,
      customerId: customers["Dr. Agnes Njeri"].id,
      subtotal: subtotal2,
      taxAmount: tax2,
      discountAmount: 0,
      total: total2,
      paymentStatus: PaymentStatus.PAID,
      amountPaid: total2,
      balance: 0,
      notes: "Paid via Visa credit card terminal.",
      dueDate: subDays(17),
      createdAt: subDays(17),
      updatedAt: subDays(17),
      items: {
        create: [
          {
            description: "Mobil 1 ESP Synthetic Engine Oil 5W-30 (8L)",
            quantity: 2,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice * 2,
            productId: products["OIL-MOB-5W30"].id,
          },
          {
            description: "Denso Activated Carbon Cabin Air Filter",
            quantity: 1,
            unitPrice: products["FLT-DEN-CAB"].sellingPrice,
            totalPrice: products["FLT-DEN-CAB"].sellingPrice,
            productId: products["FLT-DEN-CAB"].id,
          },
          {
            description: "Major Service Protocol & OBD Diagnostic Scan",
            quantity: 1,
            unitPrice: services["Major Vehicle Service"].defaultRate + services["Computerized OBD Diagnostic Scan"].defaultRate,
            totalPrice: services["Major Vehicle Service"].defaultRate + services["Computerized OBD Diagnostic Scan"].defaultRate,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.CARD,
          amount: total2,
          reference: "CARD-REF-883921",
          notes: "NCBA Visa Card ending in 4092",
          processedAt: subDays(17),
          createdAt: subDays(17),
        },
      },
    },
  });

  const job3Date = subDays(2);
  const job3 = await prisma.jobCard.create({
    data: {
      jobNumber: "JOB-2026-003",
      customerId: customers["Peter Omondi"].id,
      vehicleId: vehicles["KDG 102A"].id,
      mechanicId: mechanic3.id,
      createdById: receptionist.id,
      status: JobStatus.IN_PROGRESS,
      complaint: "Knocking noise from front wheels over bumps; engine hesitation under acceleration.",
      diagnosis: "Worn sway bar link bushings and tired front shock absorbers. Spark plugs fouling causing cylinder 2 misfire.",
      notes: "Front Brembo brake rotors turned on lathe. Fitting new KYB shocks and NGK spark plugs.",
      recommendations: "Replace control arm bushings at next service.",
      laborHours: 4.0,
      laborRate: 1000,
      scheduledDate: job3Date,
      startedAt: subDays(1),
      createdAt: job3Date,
      updatedAt: new Date(),
      inspection: {
        create: {
          mileage: 112500,
          fuelLevel: "Half Tank",
          exteriorDamage: "Small door ding on driver door",
          warningLights: ["Check Engine (P0302 Misfire)"],
          visibleFaults: "Front left shock absorber leaking oil",
          customerBelongings: "Subaru tool kit, boot organizer",
          inspectedAt: job3Date,
        },
      },
      items: {
        create: [
          {
            productId: products["SUS-KYB-3410"].id,
            quantity: 1,
            unitPrice: products["SUS-KYB-3410"].sellingPrice,
            totalPrice: products["SUS-KYB-3410"].sellingPrice,
            notes: "KYB Front shock pair",
          },
          {
            productId: products["SPK-NGK-IRID"].id,
            quantity: 1,
            unitPrice: products["SPK-NGK-IRID"].sellingPrice,
            totalPrice: products["SPK-NGK-IRID"].sellingPrice,
            notes: "NGK Laser Iridium set of 4",
          },
        ],
      },
      services: {
        create: [
          {
            serviceId: services["Suspension Bushing & Arm Overhaul"].id,
            hours: 2.5,
            rate: services["Suspension Bushing & Arm Overhaul"].defaultRate,
            totalPrice: services["Suspension Bushing & Arm Overhaul"].defaultRate,
          },
          {
            serviceId: services["4-Wheel Laser Alignment & Balancing"].id,
            hours: 1.0,
            rate: services["4-Wheel Laser Alignment & Balancing"].defaultRate,
            totalPrice: services["4-Wheel Laser Alignment & Balancing"].defaultRate,
          },
        ],
      },
    },
  });

  const subtotalQuote3 = products["SUS-KYB-3410"].sellingPrice + products["SPK-NGK-IRID"].sellingPrice + services["Suspension Bushing & Arm Overhaul"].defaultRate + services["4-Wheel Laser Alignment & Balancing"].defaultRate;
  const taxQuote3 = Math.round(subtotalQuote3 * 0.16);
  await prisma.quotation.create({
    data: {
      quoteNumber: "QTN-2026-003",
      jobCardId: job3.id,
      customerId: customers["Peter Omondi"].id,
      status: QuotationStatus.APPROVED,
      subtotal: subtotalQuote3,
      taxAmount: taxQuote3,
      discountAmount: 1000,
      total: subtotalQuote3 + taxQuote3 - 1000,
      notes: "Approved by client via phone call.",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      approvedAt: job3Date,
      createdAt: job3Date,
      updatedAt: job3Date,
    },
  });

  const job4Date = subDays(1);
  const job4 = await prisma.jobCard.create({
    data: {
      jobNumber: "JOB-2026-004",
      customerId: customers["Catherine Wambui"].id,
      vehicleId: vehicles["KCR 774X"].id,
      mechanicId: mechanic1.id,
      createdById: receptionist.id,
      status: JobStatus.APPROVED,
      complaint: "Air conditioning blowing lukewarm air; squealing noise from engine bay when cold.",
      diagnosis: "Low R134a refrigerant due to minor O-ring seal leak at AC compressor inlet. Drive belt stretched.",
      notes: "Approved AC recharge, O-ring replacement & Continental fan belt installation.",
      laborHours: 2.0,
      laborRate: 1000,
      scheduledDate: new Date(),
      createdAt: job4Date,
      updatedAt: new Date(),
      inspection: {
        create: {
          mileage: 79000,
          fuelLevel: "1/4 Tank",
          exteriorDamage: "Clean",
          warningLights: [],
          visibleFaults: "Serpentine belt cracked along v-grooves",
          customerBelongings: "Child seat in rear left passenger side",
          inspectedAt: job4Date,
        },
      },
      items: {
        create: [
          {
            productId: products["BLT-CON-6PK"].id,
            quantity: 1,
            unitPrice: products["BLT-CON-6PK"].sellingPrice,
            totalPrice: products["BLT-CON-6PK"].sellingPrice,
          },
        ],
      },
      services: {
        create: [
          {
            serviceId: services["AC System Leak Test & Refrigerant Refill"].id,
            hours: 1.5,
            rate: services["AC System Leak Test & Refrigerant Refill"].defaultRate,
            totalPrice: services["AC System Leak Test & Refrigerant Refill"].defaultRate,
          },
        ],
      },
    },
  });

  const job5Date = subDays(10);
  const job5 = await prisma.jobCard.create({
    data: {
      jobNumber: "JOB-2026-005",
      customerId: customers["Safari Tours Ltd (Contact: Patrick Kilonzo)"].id,
      vehicleId: vehicles["KDJ 430S"].id,
      mechanicId: mechanic2.id,
      createdById: manager.id,
      status: JobStatus.BILLED,
      complaint: "Routine 175,000 km safari preparation service. Check heavy-duty suspension and all tyres.",
      diagnosis: "Front tyres worn below safety tread limit. Oil filter & fuel filter clogged from safari dust.",
      notes: "Fitted 2 new Bridgestone All-Terrain tyres and performed full major service.",
      laborHours: 4.5,
      laborRate: 1000,
      scheduledDate: job5Date,
      startedAt: job5Date,
      completedAt: subDays(9),
      approvedAt: job5Date,
      createdAt: job5Date,
      updatedAt: subDays(9),
      inspection: {
        create: {
          mileage: 175000,
          fuelLevel: "Full Tank",
          exteriorDamage: "Safari safari dust, minor front grille stone chips",
          warningLights: [],
          visibleFaults: "Front left tyre tread worn unevenly",
          customerBelongings: "First aid box, fire extinguisher, VHF radio",
          inspectedAt: job5Date,
        },
      },
      items: {
        create: [
          {
            productId: products["TYR-BRI-2656517"].id,
            quantity: 2,
            unitPrice: products["TYR-BRI-2656517"].sellingPrice,
            totalPrice: products["TYR-BRI-2656517"].sellingPrice * 2,
            notes: "Bridgestone All-Terrain 265/65 R17",
          },
          {
            productId: products["OIL-MOB-5W30"].id,
            quantity: 2,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice * 2,
          },
        ],
      },
      services: {
        create: [
          {
            serviceId: services["Major Vehicle Service"].id,
            hours: 2.0,
            rate: services["Major Vehicle Service"].defaultRate,
            totalPrice: services["Major Vehicle Service"].defaultRate,
          },
          {
            serviceId: services["4-Wheel Laser Alignment & Balancing"].id,
            hours: 1.0,
            rate: services["4-Wheel Laser Alignment & Balancing"].defaultRate,
            totalPrice: services["4-Wheel Laser Alignment & Balancing"].defaultRate,
          },
        ],
      },
    },
  });

  const subtotal5 = (products["TYR-BRI-2656517"].sellingPrice * 2) + (products["OIL-MOB-5W30"].sellingPrice * 2) + services["Major Vehicle Service"].defaultRate + services["4-Wheel Laser Alignment & Balancing"].defaultRate;
  const tax5 = Math.round(subtotal5 * 0.16);
  const total5 = subtotal5 + tax5;

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-005",
      jobCardId: job5.id,
      customerId: customers["Safari Tours Ltd (Contact: Patrick Kilonzo)"].id,
      subtotal: subtotal5,
      taxAmount: tax5,
      discountAmount: 2000,
      total: total5 - 2000,
      paymentStatus: PaymentStatus.PARTIAL,
      amountPaid: 40000,
      balance: total5 - 2000 - 40000,
      notes: "Partial payment received via M-PESA Paybill. Balance added to company credit account.",
      dueDate: subDays(1),
      createdAt: subDays(9),
      updatedAt: subDays(8),
      items: {
        create: [
          {
            description: "Bridgestone Dueler A/T 265/65 R17 All-Terrain Tyres (2 pcs)",
            quantity: 2,
            unitPrice: products["TYR-BRI-2656517"].sellingPrice,
            totalPrice: products["TYR-BRI-2656517"].sellingPrice * 2,
            productId: products["TYR-BRI-2656517"].id,
          },
          {
            description: "Mobil 1 Synthetic Engine Oil 5W-30 (8L)",
            quantity: 2,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice * 2,
            productId: products["OIL-MOB-5W30"].id,
          },
          {
            description: "Major Safari Vehicle Service & 4-Wheel Alignment Labor",
            quantity: 1,
            unitPrice: services["Major Vehicle Service"].defaultRate + services["4-Wheel Laser Alignment & Balancing"].defaultRate,
            totalPrice: services["Major Vehicle Service"].defaultRate + services["4-Wheel Laser Alignment & Balancing"].defaultRate,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.MOBILE_MONEY,
          amount: 40000,
          reference: "QHM3391K8F",
          notes: "M-PESA Paybill deposit from Safari Tours Ltd",
          processedAt: subDays(8),
          createdAt: subDays(8),
        },
      },
    },
  });

  const job6Date = new Date();
  await prisma.jobCard.create({
    data: {
      jobNumber: "JOB-2026-006",
      customerId: customers["Captain Evans Korir"].id,
      vehicleId: vehicles["KCT 560B"].id,
      mechanicId: mechanic1.id,
      createdById: receptionist.id,
      status: JobStatus.PENDING,
      complaint: "60,000 km major service; check stiff steering response when parking.",
      diagnosis: "Awaiting initial technician diagnosis on hoist.",
      notes: "Customer dropped off vehicle at 8:00 AM.",
      scheduledDate: job6Date,
      createdAt: job6Date,
      updatedAt: job6Date,
      inspection: {
        create: {
          mileage: 62000,
          fuelLevel: "Full Tank",
          exteriorDamage: "Clean",
          warningLights: [],
          visibleFaults: "Power steering fluid slightly low",
          customerBelongings: "Golf bag in trunk",
          inspectedAt: job6Date,
        },
      },
    },
  });

  console.log("Seeding Direct POS Invoices & Receipts...");

  const pos1Subtotal = products["WIP-BOS-AER"].sellingPrice + products["OIL-MOB-5W30"].sellingPrice;
  const pos1Tax = Math.round(pos1Subtotal * 0.16);
  const pos1Total = pos1Subtotal + pos1Tax;

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-POS-001",
      customerId: customers["David Maina"].id,
      subtotal: pos1Subtotal,
      taxAmount: pos1Tax,
      discountAmount: 0,
      total: pos1Total,
      paymentStatus: PaymentStatus.PAID,
      amountPaid: pos1Total,
      balance: 0,
      notes: "Direct counter purchase - Bosch wipers & 4L Mobil 1 oil.",
      dueDate: subDays(5),
      createdAt: subDays(5),
      updatedAt: subDays(5),
      items: {
        create: [
          {
            description: "Bosch Aerotwin Flat Wiper Blades Set (24\" / 18\")",
            quantity: 1,
            unitPrice: products["WIP-BOS-AER"].sellingPrice,
            totalPrice: products["WIP-BOS-AER"].sellingPrice,
            productId: products["WIP-BOS-AER"].id,
          },
          {
            description: "Mobil 1 ESP Synthetic Engine Oil 5W-30 (4L)",
            quantity: 1,
            unitPrice: products["OIL-MOB-5W30"].sellingPrice,
            totalPrice: products["OIL-MOB-5W30"].sellingPrice,
            productId: products["OIL-MOB-5W30"].id,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.MOBILE_MONEY,
          amount: pos1Total,
          reference: "QHP7712N4C",
          notes: "M-PESA payment from David Maina",
          processedAt: subDays(5),
          createdAt: subDays(5),
        },
      },
    },
  });

  const pos2Subtotal = products["BAT-CHL-65AH"].sellingPrice;
  const pos2Tax = Math.round(pos2Subtotal * 0.16);
  const pos2Total = pos2Subtotal + pos2Tax;

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-POS-002",
      customerId: customers["Naomi Chebet"].id,
      subtotal: pos2Subtotal,
      taxAmount: pos2Tax,
      discountAmount: 500,
      total: pos2Total - 500,
      paymentStatus: PaymentStatus.PAID,
      amountPaid: pos2Total - 500,
      balance: 0,
      notes: "Counter battery purchase with old battery trade-in discount.",
      dueDate: subDays(3),
      createdAt: subDays(3),
      updatedAt: subDays(3),
      items: {
        create: [
          {
            description: "Chloride Exide Maintenance Free Battery 65Ah (N50Z)",
            quantity: 1,
            unitPrice: products["BAT-CHL-65AH"].sellingPrice,
            totalPrice: products["BAT-CHL-65AH"].sellingPrice,
            productId: products["BAT-CHL-65AH"].id,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.CASH,
          amount: pos2Total - 500,
          reference: "CASH-REC-10492",
          notes: "Cash paid at till register 1",
          processedAt: subDays(3),
          createdAt: subDays(3),
        },
      },
    },
  });

  console.log("Seeding Purchase Orders & Supplier Records...");
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-001",
      supplierId: supplier1.id,
      status: PurchaseOrderStatus.RECEIVED,
      subtotal: 76000,
      taxAmount: 12160,
      total: 88160,
      notes: "Monthly stock replenishment for Toyota genuine brake pads & clutch kits",
      createdById: inventoryClerk.id,
      receivedById: inventoryClerk.id,
      expectedDate: subDays(15),
      receivedAt: subDays(14),
      createdAt: subDays(20),
      updatedAt: subDays(14),
      items: {
        create: [
          {
            productId: products["BRK-AKE-TOY01"].id,
            quantityOrdered: 10,
            quantityReceived: 10,
            unitCost: products["BRK-AKE-TOY01"].purchasePrice,
            totalCost: products["BRK-AKE-TOY01"].purchasePrice * 10,
          },
          {
            productId: products["CLU-AIS-ISZ"].id,
            quantityOrdered: 2,
            quantityReceived: 2,
            unitCost: products["CLU-AIS-ISZ"].purchasePrice,
            totalCost: products["CLU-AIS-ISZ"].purchasePrice * 2,
          },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-002",
      supplierId: supplier2.id,
      status: PurchaseOrderStatus.SENT,
      subtotal: 148000,
      taxAmount: 23680,
      total: 171680,
      notes: "Restock order for Bridgestone tyres & Mobil 1 engine oils",
      createdById: inventoryClerk.id,
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: subDays(2),
      updatedAt: subDays(2),
      items: {
        create: [
          {
            productId: products["TYR-BRI-2656517"].id,
            quantityOrdered: 8,
            quantityReceived: 0,
            unitCost: products["TYR-BRI-2656517"].purchasePrice,
            totalCost: products["TYR-BRI-2656517"].purchasePrice * 8,
          },
        ],
      },
    },
  });

  console.log("Seeding Service Reminders...");
  await prisma.serviceReminder.createMany({
    data: [
      {
        customerId: customers["Josphat Kamau"].id,
        vehicleId: vehicles["KDA 482G"].id,
        serviceType: "Next Oil & Filter Service (10,000 km interval)",
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        dueMileage: 95400,
        lastServicedDate: subDays(23),
        status: ReminderStatus.DUE_SOON,
        notes: "Automatic reminder generated after JOB-2026-001 completion",
      },
      {
        customerId: customers["Dr. Agnes Njeri"].id,
        vehicleId: vehicles["KCU 915P"].id,
        serviceType: "Annual Brake Fluid Drain & Refill",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        dueMileage: 55000,
        lastServicedDate: subDays(17),
        status: ReminderStatus.DUE_SOON,
        notes: "Send WhatsApp reminder 5 days prior to due date",
      },
      {
        customerId: customers["Catherine Wambui"].id,
        vehicleId: vehicles["KCR 774X"].id,
        serviceType: "6-Month AC System Service & Air Filter Inspection",
        dueDate: subDays(5),
        dueMileage: 78500,
        lastServicedDate: subDays(180),
        status: ReminderStatus.OVERDUE,
        notes: "Overdue service notice - client currently booked for JOB-2026-004",
      },
    ],
  });

  console.log("Seeding Stock Movement Logs...");
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: products["BRK-AKE-TOY01"].id,
        type: StockMovementType.PURCHASE,
        quantity: 10,
        balanceBefore: 15,
        balanceAfter: 25,
        reference: "PO-2026-001",
        notes: "Stock intake from Toyota Kenya",
        userId: inventoryClerk.id,
        createdAt: subDays(14),
      },
      {
        productId: products["BRK-AKE-TOY01"].id,
        type: StockMovementType.JOB_USAGE,
        quantity: -1,
        balanceBefore: 25,
        balanceAfter: 24,
        reference: "JOB-2026-001",
        notes: "Issued to Mechanic Kevin Otieno for Toyota Prado KDA 482G",
        userId: mechanic1.id,
        createdAt: subDays(23),
      },
      {
        productId: products["OIL-MOB-5W30"].id,
        type: StockMovementType.SALE,
        quantity: -1,
        balanceBefore: 36,
        balanceAfter: 35,
        reference: "INV-2026-POS-001",
        notes: "Counter sale to David Maina",
        userId: cashier.id,
        createdAt: subDays(5),
      },
    ],
  });

  console.log("Seeding Recent System Activity Logs...");
  await prisma.activityLog.createMany({
    data: [
      {
        userId: itAdmin.id,
        action: ActivityAction.LOGIN,
        module: "Authentication",
        description: "Admin logged into system control panel",
        ipAddress: "192.168.1.10",
        createdAt: subDays(1),
      },
      {
        userId: receptionist.id,
        action: ActivityAction.CREATE,
        module: "Job Cards",
        description: "Created Job Card JOB-2026-006 for Captain Evans Korir (KCT 560B)",
        referenceId: "JOB-2026-006",
        createdAt: new Date(),
      },
      {
        userId: cashier.id,
        action: ActivityAction.PAYMENT,
        module: "Payments",
        description: "Recorded M-PESA payment of KSh 40,000 for Invoice INV-2026-005 (Safari Tours Ltd)",
        referenceId: "INV-2026-005",
        createdAt: subDays(8),
      },
      {
        userId: manager.id,
        action: ActivityAction.APPROVE,
        module: "Quotations",
        description: "Approved quotation QTN-2026-003 for Peter Omondi",
        referenceId: "QTN-2026-003",
        createdAt: subDays(2),
      },
      {
        userId: inventoryClerk.id,
        action: ActivityAction.STOCK_IN,
        module: "Inventory",
        description: "Received purchase order PO-2026-001 from Toyota Kenya",
        referenceId: "PO-2026-001",
        createdAt: subDays(14),
      },
    ],
  });

  console.log("Seeding completed successfully!");
  console.log("-------------------------------------------------------");
  console.log("System Users Created:");
  console.log("  - IT Admin:     louisnderitu20@gmail.com (Pass: " + rawAdminPassword + ")");
  console.log("  - Owner:        owner@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Manager:      grace.wanjiru@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Receptionist: faith.muthoni@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Mechanic 1:   kevin.otieno@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Mechanic 2:   dennis.kiprop@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Mechanic 3:   brian.wafula@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Cashier:      mercy.akinyi@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("  - Inventory:    joseph.ochieng@neetelautospares.com (Pass: " + rawDefaultPassword + ")");
  console.log("-------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

