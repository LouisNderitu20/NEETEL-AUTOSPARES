import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_DASHBOARDS } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role as UserRole;
  redirect(ROLE_DASHBOARDS[role] || "/dashboard/overview");
}
