import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PurchaseOrdersClient from "./PurchaseOrdersClient";

export const metadata = { title: "Purchase Orders" };

export default async function PurchaseOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const pos = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";
  const canDelete = ["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role);

  return (
    <PurchaseOrdersClient
      initialPos={pos}
      currencySymbol={sym}
      canDelete={canDelete}
    />
  );
}
