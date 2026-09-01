import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";



const usePartSchema = z.object({
  productId: z.string().min(1, "Product required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

export async function POST(
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

  
  const jobCard = await prisma.jobCard.findUnique({
    where: { id: jobCardId },
    select: { id: true, status: true, jobNumber: true },
  });

  if (!jobCard) {
    return NextResponse.json({ error: "Job card not found" }, { status: 404 });
  }

  if (!["APPROVED", "IN_PROGRESS"].includes(jobCard.status)) {
    return NextResponse.json(
      { error: "Parts can only be added to approved or in-progress jobs" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = usePartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { productId, quantity, notes } = parsed.data;

  
  const result = await prisma.$transaction(async (tx) => {
    
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sku: true, quantity: true, sellingPrice: true, unit: true },
    });

    if (!product) throw new Error("Product not found");

    if (product.quantity < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${product.quantity} ${product.unit}, Requested: ${quantity}`
      );
    }

    
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        quantity: { gte: quantity },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });

    if (updated.count === 0) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.unit}`);
    }

    const newQuantity = product.quantity - quantity;

    
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        type: "JOB_USAGE",
        quantity: -quantity,
        balanceBefore: product.quantity,
        balanceAfter: newQuantity,
        reference: jobCard.jobNumber,
        notes: notes || `Used on job card ${jobCard.jobNumber}`,
        userId: session.user.id,
      },
    });

    
    const existing = await tx.jobCardItem.findFirst({
      where: { jobCardId, productId },
    });

    let jobCardItem;
    if (existing) {
      jobCardItem = await tx.jobCardItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          totalPrice: (existing.quantity + quantity) * product.sellingPrice,
        },
      });
    } else {
      jobCardItem = await tx.jobCardItem.create({
        data: {
          jobCardId,
          productId,
          quantity,
          unitPrice: product.sellingPrice,
          totalPrice: quantity * product.sellingPrice,
          notes: notes || null,
        },
      });
    }

    
    if (jobCard.status === "APPROVED") {
      await tx.jobCard.update({
        where: { id: jobCardId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
    }

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "STOCK_OUT",
        module: "JobCard",
        description: `Used ${quantity} x ${product.name} (${product.sku}) on ${jobCard.jobNumber}. Stock: ${product.quantity} → ${newQuantity}`,
        referenceId: jobCardId,
        metadata: { productId, sku: product.sku, qty: quantity, newStock: newQuantity },
      },
    });

    return { jobCardItem, movement, newStock: newQuantity, product };
  });

  return NextResponse.json(result, { status: 200 });
}


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const items = await prisma.jobCardItem.findMany({
    where: { jobCardId: id },
    include: {
      product: {
        select: { name: true, sku: true, unit: true, sellingPrice: true, quantity: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
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
  const partItemId = searchParams.get("partItemId");

  if (!partItemId) {
    return NextResponse.json({ error: "Missing partItemId" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      
      const item = await tx.jobCardItem.findUnique({
        where: { id: partItemId },
        include: { product: true },
      });

      if (!item) throw new Error("Job card item not found");
      if (item.jobCardId !== jobCardId) throw new Error("Item does not belong to this job card");

      
      const newQuantity = item.product.quantity + item.quantity;
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: newQuantity },
      });

      
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "ADJUSTMENT",
          quantity: item.quantity,
          balanceBefore: item.product.quantity,
          balanceAfter: newQuantity,
          reference: `RESTORED-${jobCardId}`,
          notes: `Restored back from cancelled job card item`,
          userId: session.user.id,
        },
      });

      
      await tx.jobCardItem.delete({
        where: { id: partItemId },
      });

      return { success: true, newStock: newQuantity };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error deleting job card item:", error);
    return NextResponse.json({ error: error.message || "Failed to remove part" }, { status: 500 });
  }
}
