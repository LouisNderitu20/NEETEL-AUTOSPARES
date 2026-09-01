import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";


const r2 = (n: number) => Math.round(n * 100) / 100;

const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  serviceId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const createInvoiceSchema = z.object({
  jobCardId: z.string().optional(),
  customerId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item required"),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  notes: z.string().optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
  });
  
  let invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  
  
  let exists = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    select: { id: true },
  });
  while (exists) {
    count++;
    invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
    exists = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    });
  }
  
  return invoiceNumber;
}


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      items: true,
      payments: true,
      jobCard: { select: { jobNumber: true } },
    },
  });

  return NextResponse.json(invoices);
}


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "CASHIER"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const d = parsed.data;
    const invoiceNumber = await generateInvoiceNumber();

    const subtotal = r2(d.items.reduce((sum, item) => sum + r2(item.quantity * item.unitPrice), 0));
    const taxAmount = r2((subtotal - d.discountAmount) * (d.taxRate / 100));
    const total = r2(subtotal - d.discountAmount + taxAmount);

    const invoice = await prisma.$transaction(async (tx) => {
      let targetCustomerId = d.customerId;
      if (!targetCustomerId) {
        let walkIn = await tx.customer.findFirst({
          where: { OR: [{ name: { equals: "Walk-In Customer", mode: "insensitive" } }, { phone: "0000000000" }] },
        });
        if (!walkIn) {
          walkIn = await tx.customer.create({
            data: {
              name: "Walk-In Customer",
              phone: "0000000000",
              email: "walkin@garage.local",
              address: "Over the Counter",
            },
          });
        }
        targetCustomerId = walkIn.id;
      }

      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          jobCardId: d.jobCardId || null,
          customerId: targetCustomerId,
          subtotal,
          taxAmount,
          discountAmount: d.discountAmount,
          total,
          balance: total,
          notes: d.notes || null,
          items: {
            create: d.items.map((item) => ({
              productId: item.productId || null,
              serviceId: item.serviceId || null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: r2(item.quantity * item.unitPrice),
            })),
          },
        },
        include: { items: true, customer: true },
      });

      
      
      if (!d.jobCardId) {
        for (const item of d.items) {
          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { quantity: true, name: true, sku: true },
            });
            if (!product) continue;

            const qty = Math.ceil(item.quantity);
            const updated = await tx.product.updateMany({
              where: {
                id: item.productId,
                quantity: { gte: qty },
              },
              data: {
                quantity: { decrement: qty },
              },
            });

            if (updated.count === 0) {
              throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
            }

            const newQty = product.quantity - qty;

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: "SALE",
                quantity: -qty,
                balanceBefore: product.quantity,
                balanceAfter: newQty,
                reference: invoiceNumber,
                notes: `POS sale - Invoice ${invoiceNumber}`,
                userId: session.user.id,
              },
            });
          }
        }
      }

      
      if (d.jobCardId) {
        await tx.jobCard.update({
          where: { id: d.jobCardId },
          data: { status: "BILLED" },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          module: "Invoice",
          description: `Created invoice ${invoiceNumber} — Total: ${total.toFixed(2)}`,
          referenceId: inv.id,
          metadata: { total, itemCount: d.items.length },
        },
      });

      return inv;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("[POS Checkout API Error]:", error);
    return NextResponse.json({ error: error.message || "POS checkout failed" }, { status: 500 });
  }
}
