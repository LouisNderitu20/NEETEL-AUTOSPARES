import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";


const r2 = (n: number) => Math.round(n * 100) / 100;

const poItemSchema = z.object({
  productId: z.string().min(1),
  quantityOrdered: z.number().int().positive(),
  unitCost: z.number().min(0),
});

const createPOSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional().or(z.literal("")),
});

async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count({
    where: { poNumber: { startsWith: `PO-${year}-` } },
  });
  return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pos = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json(pos);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch POs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createPOSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;
    const poNumber = await generatePONumber();

    
    const subtotal = r2(d.items.reduce((sum, item) => sum + r2(item.quantityOrdered * item.unitCost), 0));
    const taxAmount = r2(subtotal * 0.16); 
    const total = r2(subtotal + taxAmount);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: d.supplierId,
        createdById: session.user.id,
        subtotal,
        taxAmount,
        total,
        status: "DRAFT",
        notes: d.notes || null,
        items: {
          create: d.items.map((item) => ({
            productId: item.productId,
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            unitCost: item.unitCost,
            totalCost: item.quantityOrdered * item.unitCost,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(po, { status: 201 });
  } catch (error: any) {
    console.error("Error creating PO:", error);
    return NextResponse.json({ error: "Failed to create PO" }, { status: 500 });
  }
}
