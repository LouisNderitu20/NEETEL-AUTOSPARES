import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobCardNewForm from "@/components/job-cards/JobCardNewForm";

export const metadata = { title: "New Job Card" };

export default async function NewJobCardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  
  const mechanics = await prisma.user.findMany({
    where: { role: "MECHANIC", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container py-2">
      <JobCardNewForm mechanics={mechanics} />
    </div>
  );
}
