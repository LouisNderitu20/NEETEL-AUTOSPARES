import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const vehicleUpdateSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.preprocess((val) => val === "" || val === null ? null : parseInt(val as string, 10), z.number().int().min(1900).max(new Date().getFullYear() + 2).nullable().optional()),
  licensePlate: z.string().min(1, "License plate is required"),
  vin: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  engineType: z.string().optional().or(z.literal("")),
  fuelType: z.string().optional().or(z.literal("")),
  transmission: z.string().optional().or(z.literal("")),
  mileage: z.preprocess((val) => val === "" || val === null ? null : parseInt(val as string, 10), z.number().int().nullable().optional()),
  notes: z.string().optional().or(z.literal("")),
});


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  return NextResponse.json(vehicle);
}


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = vehicleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const data = parsed.data;

  
  if (data.licensePlate.toUpperCase() !== existing.licensePlate) {
    const duplicate = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate.toUpperCase() },
    });
    if (duplicate) {
      return NextResponse.json({ error: "License plate already registered to another vehicle." }, { status: 400 });
    }
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      make: data.make,
      model: data.model,
      year: data.year || null,
      licensePlate: data.licensePlate.toUpperCase(),
      vin: data.vin || null,
      color: data.color || null,
      engineType: data.engineType || null,
      fuelType: data.fuelType || null,
      transmission: data.transmission || null,
      mileage: data.mileage || null,
      notes: data.notes || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      module: "Vehicle",
      description: `Updated vehicle: ${updated.make} ${updated.model} (${updated.licensePlate})`,
      referenceId: updated.id,
    },
  });

  return NextResponse.json(updated);
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { _count: { select: { jobCards: true } } },
  });

  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  if (vehicle._count.jobCards > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this vehicle has ${vehicle._count.jobCards} linked job card(s). Remove them first.` },
      { status: 400 }
    );
  }

  await prisma.vehicle.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      module: "Vehicle",
      description: `Deleted vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      referenceId: id,
    },
  });

  return NextResponse.json({ success: true });
}
