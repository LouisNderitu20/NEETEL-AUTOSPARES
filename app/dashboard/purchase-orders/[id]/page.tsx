import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PurchaseOrderDetailClient from "./PurchaseOrderDetailClient";

export const metadata = { title: "Purchase Order Details" };

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

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
    notFound();
  }

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <PurchaseOrderDetailClient po={po} currencySymbol={sym} />
    </div>
  );
}
