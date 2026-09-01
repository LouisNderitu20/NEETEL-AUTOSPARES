import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InspectionForm from "./InspectionForm";

export const metadata = { title: "Perform Inspection" };

export default async function JobCardInspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const jobCard = await prisma.jobCard.findUnique({
    where: { id },
    include: { inspection: true },
  });

  if (!jobCard) {
    notFound();
  }

  
  if (session.user.role === "MECHANIC" && jobCard.mechanicId !== session.user.id) {
    redirect("/dashboard/overview");
  }

  
  let initialInspection: any = null;
  if (jobCard.inspection) {
    let checks: any = {};
    try {
      checks = JSON.parse(jobCard.inspection.visibleFaults || "{}");
    } catch (e) {}

    initialInspection = {
      ...jobCard.inspection,
      odometer: jobCard.inspection.mileage || 0,
      belongings: jobCard.inspection.customerBelongings || "",
      bodyDents: jobCard.inspection.exteriorDamage || "",
      notes: jobCard.inspection.additionalFindings || "",
      lightsCheck: checks.lightsCheck || "All operational",
      brakesCheck: checks.brakesCheck || "Brakes functional",
      tiresCheck: checks.tiresCheck || "Tire tread depth ok",
      fluidsCheck: checks.fluidsCheck || "Coolant & engine oil level ok",
    };
  }

  return (
    <div className="container py-2">
      <InspectionForm
        jobCardId={jobCard.id}
        jobNumber={jobCard.jobNumber}
        initialData={initialInspection}
      />
    </div>
  );
}
