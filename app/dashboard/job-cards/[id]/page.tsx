import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobCardDetailClient from "./JobCardDetailClient";

export const metadata = { title: "Job Card Details" };

export default async function JobCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const jobCard = await prisma.jobCard.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      mechanic: { select: { id: true, name: true, email: true } },
      createdBy: { select: { name: true } },
      inspection: true,
      items: {
        include: {
          product: {
            select: { name: true, sku: true, sellingPrice: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      services: {
        include: {
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!jobCard) {
    notFound();
  }

  
  if (jobCard.inspection) {
    let checks: any = {};
    try {
      checks = JSON.parse(jobCard.inspection.visibleFaults || "{}");
    } catch (e) {}

    jobCard.inspection = {
      ...jobCard.inspection,
      odometer: jobCard.inspection.mileage || 0,
      belongings: jobCard.inspection.customerBelongings || "",
      bodyDents: jobCard.inspection.exteriorDamage || "",
      notes: jobCard.inspection.additionalFindings || "",
      lightsCheck: checks.lightsCheck || "All operational",
      brakesCheck: checks.brakesCheck || "Brakes functional",
      tiresCheck: checks.tiresCheck || "Tire tread depth ok",
      fluidsCheck: checks.fluidsCheck || "Coolant & engine oil level ok",
    } as any;
  }

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <JobCardDetailClient
        jobCard={jobCard}
        currentUser={session.user}
        currencySymbol={sym}
      />
    </div>
  );
}
