import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SuppliersClient from "./SuppliersClient";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true, purchaseOrders: true } },
    },
  });

  const canManage = ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"].includes(session.user.role);

  return <SuppliersClient initialSuppliers={suppliers} canManage={canManage} />;
}
