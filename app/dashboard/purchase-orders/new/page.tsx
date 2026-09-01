import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PurchaseOrderNewClient from "./PurchaseOrderNewClient";

export const metadata = { title: "New Purchase Order" };

export default async function NewPurchaseOrderPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <PurchaseOrderNewClient
        suppliers={suppliers}
        products={products}
        currencySymbol={sym}
      />
    </div>
  );
}
