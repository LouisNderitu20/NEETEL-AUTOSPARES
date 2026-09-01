import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const jobCardSchema = z.object({
  customerId: z.string().min(1),
  vehicleId: z.string().min(1),
  mechanicId: z.string().optional(),
  complaint: z.string().min(1, "Complaint/complaint description is required"),
  notes: z.string().optional(),
  scheduledDate: z.string().optional(),
  laborRate: z.number().optional(),
});

async function generateJobNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let count = await prisma.jobCard.count({
    where: { jobNumber: { startsWith: `JC-${year}-` } },
  });
  
  let jobNumber = `JC-${year}-${String(count + 1).padStart(4, "0")}`;
  
  
  let exists = await prisma.jobCard.findUnique({
    where: { jobNumber },
    select: { id: true },
  });
  while (exists) {
    count++;
    jobNumber = `JC-${year}-${String(count + 1).padStart(4, "0")}`;
    exists = await prisma.jobCard.findUnique({
      where: { jobNumber },
      select: { id: true },
    });
  }
  
  return jobNumber;
}


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mechanicId = searchParams.get("mechanicId");

  const where: any = {};
  if (status) where.status = status;
  if (mechanicId) where.mechanicId = mechanicId;
  
  if (session.user.role === "MECHANIC") where.mechanicId = session.user.id;

  const jobCards = await prisma.jobCard.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      vehicle: true,
      mechanic: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      inspection: true,
      items: { include: { product: { select: { name: true, sku: true, unit: true } } } },
      services: { include: { service: { select: { name: true } } } },
      invoice: { select: { id: true, invoiceNumber: true, paymentStatus: true, total: true } },
    },
  });

  return NextResponse.json(jobCards);
}


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = jobCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;
    const jobNumber = await generateJobNumber();

    const jobCard = await prisma.jobCard.create({
      data: {
        jobNumber,
        customerId: d.customerId,
        vehicleId: d.vehicleId,
        mechanicId: d.mechanicId || null,
        createdById: session.user.id,
        complaint: d.complaint,
        notes: d.notes || null,
        scheduledDate: d.scheduledDate ? new Date(d.scheduledDate) : null,
        laborRate: d.laborRate || 0,
        status: "PENDING",
      },
      include: {
        customer: true,
        vehicle: true,
        mechanic: { select: { name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "JobCard",
        description: `Created job card ${jobNumber} for ${jobCard.customer.name} - ${jobCard.vehicle.make} ${jobCard.vehicle.model}`,
        referenceId: jobCard.id,
      },
    });

    return NextResponse.json(jobCard, { status: 201 });
  } catch (error: any) {
    console.error("[Job Card Creation API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create job card" }, { status: 500 });
  }
}
