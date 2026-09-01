import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { JobStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        mechanic: { select: { id: true, name: true, email: true } },
        createdBy: { select: { name: true } },
        inspection: true,
        items: { include: { product: true } },
        services: { include: { service: true } },
        invoice: true,
        quotation: true,
      },
    });

    if (!jobCard) {
      return NextResponse.json({ error: "Job card not found" }, { status: 404 });
    }

    
    if (session.user.role === "MECHANIC" && jobCard.mechanicId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. Not assigned to you." }, { status: 403 });
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch job card" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, mechanicId, complaint, notes, laborRate } = await req.json();

    const existingJob = await prisma.jobCard.findUnique({ where: { id } });
    if (!existingJob) {
      return NextResponse.json({ error: "Job card not found" }, { status: 404 });
    }

    
    if (session.user.role === "MECHANIC") {
      const isClaiming = mechanicId === session.user.id && existingJob.mechanicId === null;

      if (!isClaiming && existingJob.mechanicId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden. Job not assigned to you." }, { status: 403 });
      }
      
      
      if (status && !["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED"].includes(status)) {
        return NextResponse.json({ error: "Unauthorized status transition." }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status as JobStatus;
    if (mechanicId !== undefined) updateData.mechanicId = mechanicId || null;
    if (complaint) updateData.complaint = complaint;
    if (notes !== undefined) updateData.notes = notes || null;
    if (laborRate !== undefined) {
      if (session.user.role === "MECHANIC") {
        return NextResponse.json({ error: "Mechanics are not permitted to adjust labor rates." }, { status: 403 });
      }
      updateData.laborRate = parseFloat(laborRate) || 0;
    }

    
    if (status === "COMPLETED" && existingJob.status !== "COMPLETED") {
      updateData.completedAt = new Date();

      try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: existingJob.vehicleId } });
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 3);

        const dueMileage = vehicle?.mileage ? vehicle.mileage + 5000 : null;

        await prisma.serviceReminder.create({
          data: {
            customerId: existingJob.customerId,
            vehicleId: existingJob.vehicleId,
            serviceType: "Scheduled 3-Month Maintenance & Inspection",
            dueDate,
            dueMileage,
            lastServicedDate: new Date(),
            notes: `Auto-generated from completed Job Card #${existingJob.jobNumber}`,
            status: "DUE_SOON",
          },
        });
      } catch (err) {
        console.error("Auto service reminder generation error:", err);
      }
    }

    const updatedJob = await prisma.jobCard.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: true,
      },
    });

    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "JobCard",
        description: `Updated job card ${updatedJob.jobNumber}: Status set to ${updatedJob.status}`,
        referenceId: updatedJob.id,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error("Error updating job card:", error);
    return NextResponse.json({ error: "Failed to update job card" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      
      const items = await tx.jobCardItem.findMany({
        where: { jobCardId: id },
        include: { product: true },
      });

      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newQty = product.quantity + item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: newQty },
            });
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: "ADJUSTMENT",
                quantity: item.quantity,
                balanceBefore: product.quantity,
                balanceAfter: newQty,
                reference: id,
                notes: `Stock restored due to deletion of Job Card ID ${id}`,
                userId: session.user.id,
              },
            });
          }
        }
      }

      
      await tx.jobCardItem.deleteMany({ where: { jobCardId: id } });
      await tx.jobCardService.deleteMany({ where: { jobCardId: id } });
      await tx.inspection.deleteMany({ where: { jobCardId: id } });

      await tx.jobCard.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Job card deleted and allocated stock restored successfully." });
  } catch (error) {
    console.error("Error deleting job card:", error);
    return NextResponse.json({ error: "Failed to delete job card" }, { status: 500 });
  }
}
