import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductFormClient from "../ProductFormClient";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"].includes(session.user.role)) {
    redirect("/dashboard/products");
  }

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <ProductFormClient categories={categories} suppliers={suppliers} />;
}
