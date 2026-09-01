import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RemindersClient from "./RemindersClient";

export const metadata = {
  title: "Service Reminders",
};

export default async function RemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const reminders = await prisma.serviceReminder.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      vehicle: { select: { id: true, licensePlate: true, make: true, model: true, mileage: true } },
    },
  });

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      vehicles: {
        select: { id: true, licensePlate: true, make: true, model: true, mileage: true },
      },
    },
  });

  const serializedReminders = reminders.map((r) => ({
    ...r,
    dueDate: r.dueDate.toISOString(),
    lastServicedDate: r.lastServicedDate ? r.lastServicedDate.toISOString() : null,
    sentAt: r.sentAt ? r.sentAt.toISOString() : null,
  }));

  return <RemindersClient initialReminders={serializedReminders} customers={customers} />;
}
