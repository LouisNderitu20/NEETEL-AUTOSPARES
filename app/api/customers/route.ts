import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const vehicleSchema = z.object({
  make: z.string().min(1, "Vehicle make is required"),
  model: z.string().min(1, "Vehicle model is required"),
  year: z.number().int().optional(),
  color: z.string().optional(),
  licensePlate: z.string().min(1, "License plate is required"),
  vin: z.string().optional(),
  engineType: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  mileage: z.number().int().optional(),
  notes: z.string().optional(),
});

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  company: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
  creditLimit: z.number().optional(),
  vehicles: z.array(vehicleSchema).optional(),
});


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        vehicles: { select: { id: true, make: true, model: true, licensePlate: true } },
        _count: { select: { jobCards: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, limit });
}


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "CASHIER"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = customerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const customer = await prisma.$transaction(async (tx) => {
    const cust = await tx.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        phone2: data.phone2 || null,
        email: data.email || null,
        address: data.address || null,
        company: data.company || null,
        idNumber: data.idNumber || null,
        notes: data.notes || null,
        creditLimit: data.creditLimit || 0,
      },
    });

    
    if (data.vehicles && data.vehicles.length > 0) {
      for (const v of data.vehicles) {
        await tx.vehicle.create({
          data: {
            customerId: cust.id,
            make: v.make,
            model: v.model,
            year: v.year || null,
            color: v.color || null,
            licensePlate: v.licensePlate,
            vin: v.vin || null,
            engineType: v.engineType || null,
            fuelType: v.fuelType || null,
            transmission: v.transmission || null,
            mileage: v.mileage || null,
            notes: v.notes || null,
          },
        });
      }
    }

    return cust;
  });

  
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      module: "Customer",
      description: `Created customer: ${customer.name}`,
      referenceId: customer.id,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
