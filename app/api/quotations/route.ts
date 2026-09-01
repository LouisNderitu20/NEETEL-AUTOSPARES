import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";


const r2 = (n: number) => Math.round(n * 100) / 100;

const quotationItemSchema = z.object({
  productId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const createQuotationSchema = z.object({
  jobCardId: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(quotationItemSchema).min(1, "At least one item required"),
  taxRate: z.number().min(0).default(16),
  notes: z.string().optional(),
});

async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count({
    where: { quoteNumber: { startsWith: `QTN-${year}-` } },
  });
  return `QTN-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;
    if (!d.jobCardId) {
      return NextResponse.json({ error: "Job card is required to generate a quotation" }, { status: 400 });
    }

    const quoteNumber = await generateQuotationNumber();

    const subtotal = r2(d.items.reduce((sum, item) => sum + r2(item.quantity * item.unitPrice), 0));
    const taxAmount = r2(subtotal * (d.taxRate / 100));
    const total = r2(subtotal + taxAmount);

    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,
        jobCardId: d.jobCardId,
        customerId: d.customerId,
        subtotal,
        taxAmount,
        total,
        status: "PENDING",
        notes: d.notes || null,
      },
      include: { customer: true },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("Error creating quotation:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
