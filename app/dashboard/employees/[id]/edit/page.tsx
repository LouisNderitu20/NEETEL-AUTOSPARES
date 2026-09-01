import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmployeeForm from "@/components/employees/EmployeeForm";

export const metadata = { title: "Edit Employee" };

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) redirect("/dashboard/overview");

  const { id } = await params;
  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (!employee) {
    notFound();
  }

  return (
    <div className="container py-2">
      <EmployeeForm initialData={employee} currentUserRole={session.user.role} />
    </div>
  );
}
