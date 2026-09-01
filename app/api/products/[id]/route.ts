import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required"),
  purchasePrice: z.number().min(0, "Purchase price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  minStockLevel: z.number().min(0).default(0),
  location: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional().nullable(),
});


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
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
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;

    
    const existingSku = await prisma.product.findFirst({
      where: {
        sku: d.sku,
        NOT: { id },
      },
    });

    if (existingSku) {
      return NextResponse.json({ error: "Product SKU already registered." }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: d.sku,
        name: d.name,
        description: d.description || null,
        brand: d.brand || null,
        unit: d.unit,
        purchasePrice: Math.round(d.purchasePrice * 100) / 100,
        sellingPrice: Math.round(d.sellingPrice * 100) / 100,
        minStockLevel: d.minStockLevel,
        location: d.location || null,
        categoryId: d.categoryId,
        supplierId: d.supplierId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "Product",
        description: `Updated product details: ${updated.name} (${updated.sku})`,
        referenceId: updated.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
      return NextResponse.json({ error: "Forbidden. Only owner or manager can delete products." }, { status: 403 });
    }

    const { id } = await params;

    
    const [jobCardCount, poCount, invoiceCount] = await Promise.all([
      prisma.jobCardItem.count({ where: { productId: id } }),
      prisma.purchaseOrderItem.count({ where: { productId: id } }),
      prisma.invoiceItem.count({ where: { productId: id } }),
    ]);

    if (jobCardCount > 0 || poCount > 0 || invoiceCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete product. It has existing transactional history: ${jobCardCount} job cards, ${poCount} purchase orders, ${invoiceCount} invoices.`,
        },
        { status: 400 }
      );
    }

    
    await prisma.stockMovement.deleteMany({ where: { productId: id } });

    
    const deleted = await prisma.product.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "Product",
        description: `Deleted product: ${deleted.name} (${deleted.sku})`,
        referenceId: id,
      },
    });

    return NextResponse.json({ message: "Product deleted successfully", deleted: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
