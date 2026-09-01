import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  unit: z.string().optional().nullable().default("pcs"),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be positive"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
  quantity: z.coerce.number().int().min(0).default(0),
  minStockLevel: z.coerce.number().int().min(0).default(5),
  location: z.string().optional().nullable(),
});


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const lowStock = searchParams.get("lowStock") === "true";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  


  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  return NextResponse.json(products);
}


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"];
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const d = parsed.data;

  
  const existing = await prisma.product.findUnique({ where: { sku: d.sku } });
  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      sku: d.sku,
      name: d.name,
      description: d.description || null,
      categoryId: d.categoryId,
      supplierId: d.supplierId || null,
      brand: d.brand || null,
      unit: d.unit || "pcs",
      purchasePrice: d.purchasePrice,
      sellingPrice: d.sellingPrice,
      quantity: d.quantity,
      minStockLevel: d.minStockLevel,
      location: d.location || null,
    },
  });

  
  if (d.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "ADJUSTMENT",
        quantity: d.quantity,
        balanceBefore: 0,
        balanceAfter: d.quantity,
        notes: "Initial stock entry",
        userId: session.user.id,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      module: "Inventory",
      description: `Added product: ${product.name} (SKU: ${product.sku})`,
      referenceId: product.id,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
