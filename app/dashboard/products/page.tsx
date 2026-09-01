import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";

export const metadata = { title: "Products & Parts" };

export default async function ProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    prisma.garageSettings.findFirst(),
  ]);

  const canManage = ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"].includes(session.user.role);
  const currencySymbol = settings?.currencySymbol || "$";

  return (
    <ProductsClient
      initialProducts={products}
      currencySymbol={currencySymbol}
      canManage={canManage}
    />
  );
}
