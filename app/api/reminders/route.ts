import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const reminders = await prisma.serviceReminder.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        vehicle: {
          select: { id: true, licensePlate: true, make: true, model: true, mileage: true },
        },
      },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching service reminders:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { customerId, vehicleId, serviceType, dueDate, dueMileage, notes } = await req.json();

    if (!customerId || !vehicleId || !serviceType || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const reminder = await prisma.serviceReminder.create({
      data: {
        customerId,
        vehicleId,
        serviceType,
        dueDate: new Date(dueDate),
        dueMileage: dueMileage ? parseInt(dueMileage, 10) : null,
        notes,
        status: "DUE_SOON",
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "ServiceReminders",
        description: `Created service reminder for vehicle ${reminder.vehicle.licensePlate} (${serviceType})`,
        referenceId: reminder.id,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating service reminder:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
