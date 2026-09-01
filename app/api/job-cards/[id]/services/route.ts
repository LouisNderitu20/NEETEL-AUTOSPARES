import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const addServiceSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  hours: z.preprocess((val) => val === undefined || val === "" ? 1 : parseFloat(val as string), z.number().min(0.1)),
  notes: z.string().optional().or(z.literal("")),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: jobCardId } = await params;
    const services = await prisma.jobCardService.findMany({
      where: { jobCardId },
      include: { service: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "MECHANIC"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: jobCardId } = await params;
    const body = await req.json();
    const parsed = addServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const { serviceId, hours, notes } = parsed.data;

    
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    
    const existing = await prisma.jobCardService.findFirst({
      where: { jobCardId, serviceId },
    });

    if (existing) {
      return NextResponse.json({ error: "Service already added to this job card." }, { status: 400 });
    }

    
    const jobCardService = await prisma.jobCardService.create({
      data: {
        jobCardId,
        serviceId,
        hours,
        rate: service.defaultRate,
        totalPrice: service.defaultRate * hours,
        notes: notes || null,
      },
      include: { service: true },
    });

    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "JobCard",
        description: `Added labor service "${service.name}" to job card ID ${jobCardId}`,
        referenceId: jobCardId,
      },
    });

    return NextResponse.json(jobCardService, { status: 201 });
  } catch (error) {
    console.error("Error adding service:", error);
    return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "MECHANIC"];
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: jobCardId } = await params;
  const { searchParams } = new URL(req.url);
  const serviceItemId = searchParams.get("serviceItemId");

  if (!serviceItemId) {
    return NextResponse.json({ error: "Missing serviceItemId" }, { status: 400 });
  }

  try {
    const item = await prisma.jobCardService.findUnique({
      where: { id: serviceItemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Job card service item not found" }, { status: 404 });
    }

    if (item.jobCardId !== jobCardId) {
      return NextResponse.json({ error: "Item does not belong to this job card" }, { status: 400 });
    }

    await prisma.jobCardService.delete({
      where: { id: serviceItemId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting job card service:", error);
    return NextResponse.json({ error: "Failed to remove service" }, { status: 500 });
  }
}
