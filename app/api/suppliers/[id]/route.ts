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


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = supplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;

    
    const duplicate = await prisma.supplier.findFirst({
      where: {
        name: d.name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "A supplier with this name already exists." }, { status: 400 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
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
        action: "UPDATE",
        module: "Supplier",
        description: `Updated supplier details: ${updated.name}`,
        referenceId: updated.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["IT_ADMIN", "OWNER", "MANAGER"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden. Only owner or manager can delete suppliers." }, { status: 403 });
    }

    const { id } = await params;

    
    const [productCount, poCount] = await Promise.all([
      prisma.product.count({ where: { supplierId: id } }),
      prisma.purchaseOrder.count({ where: { supplierId: id } }),
    ]);

    if (productCount > 0 || poCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete supplier. They have linked history: ${productCount} products, ${poCount} purchase orders.`,
        },
        { status: 400 }
      );
    }

    const deleted = await prisma.supplier.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "Supplier",
        description: `Deleted supplier: ${deleted.name}`,
        referenceId: id,
      },
    });

    return NextResponse.json({ message: "Supplier deleted successfully", deleted: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
