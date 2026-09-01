import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const adjustSchema = z.object({
  newQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  notes: z.string().optional().nullable(),
});


export async function POST(
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
    const parsed = adjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { quantity: true, name: true, sku: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const balanceBefore = product.quantity;
    const balanceAfter = d.newQuantity;
    const diff = balanceAfter - balanceBefore;

    if (diff === 0) {
      return NextResponse.json({ message: "No stock change occurred", product });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: { quantity: balanceAfter },
      });

      await tx.stockMovement.create({
        data: {
          productId: id,
          type: "ADJUSTMENT",
          quantity: diff,
          balanceBefore,
          balanceAfter,
          notes: d.notes || `Manual stock adjustment from ${balanceBefore} to ${balanceAfter}`,
          userId: session.user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          module: "Product",
          description: `Adjusted stock for ${product.name} (${product.sku}): ${balanceBefore} -> ${balanceAfter}`,
          referenceId: id,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}
