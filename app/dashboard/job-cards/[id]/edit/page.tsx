import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobCardEditClient from "./JobCardEditClient";

export const metadata = { title: "Manage Job Card Items" };

export default async function EditJobCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "MECHANIC", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  const { id } = await params;
  const jobCard = await prisma.jobCard.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      services: { include: { service: true } },
    },
  });

  if (!jobCard) {
    notFound();
  }

  
  if (jobCard.status === "BILLED") {
    redirect(`/dashboard/job-cards/${id}`);
  }

  
  const products = await prisma.product.findMany({
    where: { quantity: { gt: 0 } },
    orderBy: { name: "asc" },
  });

  
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <JobCardEditClient
        jobCard={jobCard}
        products={products}
        services={services}
        currencySymbol={sym}
        currentUser={session.user}
      />
    </div>
  );
}
