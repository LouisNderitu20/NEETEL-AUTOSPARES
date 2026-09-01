import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VehicleEditClient from "./VehicleEditClient";

export const metadata = { title: "Edit Vehicle" };

export default async function EditVehiclePage({
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
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  if (!vehicle) notFound();

  return <VehicleEditClient vehicle={vehicle} />;
}
