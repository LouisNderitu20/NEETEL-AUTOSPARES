import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerEditForm from "./CustomerEditForm";

export const metadata = { title: "Edit Customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { vehicles: true },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="container py-2">
      <CustomerEditForm initialData={customer} />
    </div>
  );
}
