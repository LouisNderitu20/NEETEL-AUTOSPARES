import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuotationDetailClient from "./QuotationDetailClient";

export const metadata = { title: "Quotation Details" };

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      jobCard: {
        include: {
          items: { include: { product: true } },
          services: { include: { service: true } },
        },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <QuotationDetailClient quotation={quotation} currencySymbol={sym} />
    </div>
  );
}
