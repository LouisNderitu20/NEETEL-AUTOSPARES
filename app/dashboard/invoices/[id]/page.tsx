import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const metadata = { title: "Invoice Details & Receipt" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      payments: {
        orderBy: { processedAt: "desc" },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <InvoiceDetailClient
        invoice={invoice}
        currencySymbol={sym}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
