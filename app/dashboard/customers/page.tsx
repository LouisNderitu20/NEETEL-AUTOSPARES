import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomersClient from "./CustomersClient";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicles: { select: { id: true } },
      jobCards: { select: { id: true } },
    },
  });

  const canDelete = ["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role);

  return <CustomersClient initialCustomers={customers} canDelete={canDelete} />;
}
