import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional().nullable(),
});


export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true, purchaseOrders: true } },
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
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
    const parsed = supplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;

    
    const existing = await prisma.supplier.findFirst({
      where: { name: d.name },
    });

    if (existing) {
      return NextResponse.json({ error: "A supplier with this name already exists." }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: d.name,
        contactName: d.contactName || null,
        email: d.email || null,
        phone: d.phone,
        address: d.address || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "Supplier",
        description: `Registered new supplier: ${supplier.name}`,
        referenceId: supplier.id,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
