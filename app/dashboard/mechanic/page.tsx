import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MechanicDashboardClient from "./MechanicDashboardClient";

export const metadata = { title: "Mechanic Dashboard" };

export default async function MechanicDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "MECHANIC") redirect("/dashboard/overview");

  
  const myJobs = await prisma.jobCard.findMany({
    where: {
      mechanicId: session.user.id,
      status: { in: ["PENDING", "APPROVED", "IN_PROGRESS", "AWAITING_APPROVAL"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, year: true, licensePlate: true, fuelType: true } },
      inspection: true,
      _count: { select: { items: true, services: true } },
    },
  });

  
  const unassignedJobs = await prisma.jobCard.findMany({
    where: {
      mechanicId: null,
      status: { in: ["PENDING", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, year: true, licensePlate: true, fuelType: true } },
    },
  });

  return (
    <MechanicDashboardClient
      initialMyJobs={myJobs}
      initialUnassignedJobs={unassignedJobs}
      currentUserId={session.user.id}
    />
  );
}
