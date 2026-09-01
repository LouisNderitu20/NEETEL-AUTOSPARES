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
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { name: true } },
        receivedBy: { select: { name: true } },
        items: { include: { product: true } },
      },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json(po);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch PO" }, { status: 500 });
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
    const { status, items: receivedItems } = await req.json();

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!existingPO) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    if (existingPO.status === "RECEIVED") {
      return NextResponse.json({ error: "Purchase order has already been received and stock added." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalStatus = status;

      
      if (status === "RECEIVED") {
        let allFullyReceived = true;

        for (const item of existingPO.items) {
          
          const matched = receivedItems?.find((ri: any) => ri.itemId === item.id);
          const remainingQty = item.quantityOrdered - item.quantityReceived;
          const receivedQty = matched !== undefined ? parseInt(matched.receivedQty, 10) : remainingQty;

          if (isNaN(receivedQty) || receivedQty < 0 || receivedQty > remainingQty) {
            throw new Error(
              `Invalid received quantity (${receivedQty}) for product "${item.product?.name || item.productId}". Remaining pending is ${remainingQty}.`
            );
          }

          if (receivedQty > 0) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { quantity: true, name: true, sku: true },
            });

            if (product) {
              const newQty = product.quantity + receivedQty;

              
              await tx.product.update({
                where: { id: item.productId },
                data: { quantity: newQty },
              });

              
              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: "PURCHASE",
                  quantity: receivedQty,
                  balanceBefore: product.quantity,
                  balanceAfter: newQty,
                  reference: existingPO.poNumber,
                  notes: `Received ${receivedQty} units of ${product.name} via PO ${existingPO.poNumber} (Additional Delivery)`,
                  userId: session.user.id,
                },
              });
            }
          }

          const updatedQtyReceived = item.quantityReceived + receivedQty;

          
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { quantityReceived: updatedQtyReceived },
          });

          
          if (updatedQtyReceived < item.quantityOrdered) {
            allFullyReceived = false;
          }
        }

        
        finalStatus = allFullyReceived ? "RECEIVED" : "SENT";
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: finalStatus,
          receivedById: finalStatus === "RECEIVED" ? session.user.id : undefined,
          receivedAt: finalStatus === "RECEIVED" ? new Date() : undefined,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          module: "PurchaseOrder",
          description: `Updated PO ${existingPO.poNumber}: Status set to ${status}`,
          referenceId: id,
        },
      });

      return updatedPO;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating PO:", error);
    return NextResponse.json({ error: error.message || "Failed to update PO" }, { status: 500 });
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
      return NextResponse.json({ error: "Forbidden. Only owners or managers can delete orders." }, { status: 403 });
    }

    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    if (po.status === "RECEIVED") {
      return NextResponse.json({ error: "Cannot delete a purchase order that has already been received." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      
      await tx.purchaseOrder.delete({ where: { id } });
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "PurchaseOrder",
        description: `Deleted purchase order ${po.poNumber}`,
        referenceId: id,
      },
    });

    return NextResponse.json({ message: "Purchase order deleted successfully", deleted: true });
  } catch (error) {
    console.error("Error deleting PO:", error);
    return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 });
  }
}
