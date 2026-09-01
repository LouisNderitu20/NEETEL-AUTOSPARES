import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductFormClient from "../../ProductFormClient";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"].includes(session.user.role)) {
    redirect("/dashboard/products");
  }

  const { id } = await params;

  const [product, categories, suppliers] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductFormClient categories={categories} suppliers={suppliers} initialData={product} />;
}
