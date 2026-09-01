import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export const metadata = { title: "Reports & Analytics" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  
  const [invoices, payments, products, jobCards, customers, stockMovements] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      orderBy: { quantity: "desc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.jobCard.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mechanic: { select: { name: true } },
        items: { select: { totalPrice: true } },
        services: { select: { totalPrice: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        vehicles: { select: { id: true } },
      },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <ReportsClient
      invoices={invoices}
      payments={payments}
      products={products}
      jobCards={jobCards}
      customers={customers}
      stockMovements={stockMovements}
      currencySymbol={sym}
    />
  );
}
