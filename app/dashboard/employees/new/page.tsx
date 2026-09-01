import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EmployeeForm from "@/components/employees/EmployeeForm";

export const metadata = { title: "Add Employee" };

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) redirect("/dashboard/overview");

  return (
    <div className="container py-2">
      <EmployeeForm currentUserRole={session.user.role} />
    </div>
  );
}
