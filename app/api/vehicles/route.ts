import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const vehicleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.preprocess((val) => parseInt(val as string, 10), z.number().int().min(1900).max(new Date().getFullYear() + 2)),
  licensePlate: z.string().min(1, "License plate is required"),
  vin: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  mileage: z.preprocess((val) => val === "" ? null : parseInt(val as string, 10), z.number().int().nullable().optional()),
  fuelType: z.string().optional().or(z.literal("")),
  transmission: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const customerId = searchParams.get("customerId") || "";

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (search) {
    where.OR = [
      { licensePlate: { contains: search, mode: "insensitive" } },
      { make: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = vehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate },
    });

    if (existingVehicle) {
      return NextResponse.json({ error: "License plate already registered." }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: data.customerId,
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate.toUpperCase(),
        vin: data.vin || null,
        color: data.color || null,
        mileage: data.mileage || null,
        fuelType: data.fuelType || "Petrol",
        transmission: data.transmission || "Automatic",
        notes: data.notes || null,
      },
    });

    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "Vehicle",
        description: `Registered vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
        referenceId: vehicle.id,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
