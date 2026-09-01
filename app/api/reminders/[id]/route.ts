import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { status, notes } = await req.json();

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "SENT") {
        updateData.sentAt = new Date();
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const reminder = await prisma.serviceReminder.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { licensePlate: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "ServiceReminders",
        description: `Updated status of reminder #${id} for ${reminder.vehicle.licensePlate} to ${status}`,
        referenceId: id,
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error updating service reminder:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.serviceReminder.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "ServiceReminders",
        description: `Deleted service reminder #${id}`,
        referenceId: id,
      },
    });

    return NextResponse.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting service reminder:", error);
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
  }
}
