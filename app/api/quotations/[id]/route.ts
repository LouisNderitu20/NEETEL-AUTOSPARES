import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        jobCard: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quotation" }, { status: 500 });
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
    const { status } = await req.json();

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: { status },
    });

    
    if (status === "APPROVED" && updatedQuotation.jobCardId) {
      const job = await prisma.jobCard.findUnique({ where: { id: updatedQuotation.jobCardId } });
      if (job && job.status === "PENDING") {
        await prisma.jobCard.update({
          where: { id: job.id },
          data: { status: "APPROVED" },
        });
      }
    }

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}
