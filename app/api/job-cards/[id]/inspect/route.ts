import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const inspectSchema = z.object({
  odometer: z.preprocess((val) => parseInt(val as string, 10), z.number().int().min(0)),
  fuelLevel: z.string().min(1),
  lightsCheck: z.string().optional().or(z.literal("")),
  brakesCheck: z.string().optional().or(z.literal("")),
  tiresCheck: z.string().optional().or(z.literal("")),
  fluidsCheck: z.string().optional().or(z.literal("")),
  bodyDents: z.string().optional().or(z.literal("")),
  belongings: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

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
    const parsed = inspectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const checksJson = JSON.stringify({
      lightsCheck: data.lightsCheck || "",
      brakesCheck: data.brakesCheck || "",
      tiresCheck: data.tiresCheck || "",
      fluidsCheck: data.fluidsCheck || "",
    });

    
    const inspection = await prisma.inspection.upsert({
      where: { jobCardId },
      update: {
        mileage: data.odometer,
        fuelLevel: data.fuelLevel,
        exteriorDamage: data.bodyDents || null,
        customerBelongings: data.belongings || null,
        additionalFindings: data.notes || null,
        visibleFaults: checksJson,
      },
      create: {
        jobCardId,
        mileage: data.odometer,
        fuelLevel: data.fuelLevel,
        exteriorDamage: data.bodyDents || null,
        customerBelongings: data.belongings || null,
        additionalFindings: data.notes || null,
        visibleFaults: checksJson,
      },
    });

    
    const jobCard = await prisma.jobCard.findUnique({ where: { id: jobCardId } });
    if (jobCard && jobCard.status === "PENDING") {
      await prisma.jobCard.update({
        where: { id: jobCardId },
        data: { status: "APPROVED" },
      });
    }

    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "JobCard",
        description: `Performed inspection for job card ID ${jobCardId}`,
        referenceId: jobCardId,
      },
    });

    return NextResponse.json({ message: "Inspection saved successfully", inspection });
  } catch (error) {
    console.error("Error saving inspection:", error);
    return NextResponse.json({ error: "Failed to save inspection" }, { status: 500 });
  }
}
