import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";


const r2 = (n: number) => Math.round(n * 100) / 100;

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER", "PARTIAL", "DEPOSIT", "CREDIT"]),
  amount: z.number().positive("Amount must be positive"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["IT_ADMIN", "OWNER", "MANAGER", "CASHIER"];
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const d = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: d.invoiceId },
      select: { id: true, invoiceNumber: true, total: true, amountPaid: true, balance: true, customerId: true },
    });

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.balance <= 0) throw new Error("Invoice is already fully paid");
    
    const updatedInvoiceCount = await tx.invoice.updateMany({
      where: {
        id: d.invoiceId,
        balance: { gte: r2(d.amount) - 0.01 },
      },
      data: {
        amountPaid: { increment: r2(d.amount) },
        balance: { decrement: r2(d.amount) },
      },
    });

    if (updatedInvoiceCount.count === 0) {
      throw new Error(`Payment failed: Amount exceeds remaining balance of ${invoice.balance.toFixed(2)} or concurrent payment occurred.`);
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId: d.invoiceId,
        method: d.method,
        amount: r2(d.amount),
        reference: d.reference || null,
        notes: d.notes || null,
      },
    });

    
    const updatedInvoice = await tx.invoice.findUnique({
      where: { id: d.invoiceId },
      select: { amountPaid: true, balance: true, total: true },
    });

    const newBalance = updatedInvoice ? r2(Math.max(0, updatedInvoice.balance)) : 0;
    const newAmountPaid = updatedInvoice ? r2(updatedInvoice.amountPaid) : r2(invoice.amountPaid + d.amount);
    const paymentStatus = newBalance <= 0.01 ? "PAID" : "PARTIAL";

    await tx.invoice.update({
      where: { id: d.invoiceId },
      data: {
        balance: newBalance,
        paymentStatus,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT",
        module: "Payment",
        description: `Received ${d.method} payment of ${d.amount.toFixed(2)} for invoice ${invoice.invoiceNumber}`,
        referenceId: payment.id,
        metadata: { invoiceId: d.invoiceId, method: d.method, amount: d.amount, newBalance },
      },
    });

    return { payment, paymentStatus, newBalance, newAmountPaid };
  });

  return NextResponse.json(result, { status: 201 });
}


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    orderBy: { processedAt: "desc" },
    include: {
      invoice: {
        include: {
          customer: { select: { name: true } },
          jobCard: { select: { jobNumber: true } },
        },
      },
    },
    take: 100,
  });

  return NextResponse.json(payments);
}
