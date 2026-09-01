import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaymentReceiptClient from "./PaymentReceiptClient";

export const metadata = { title: "Payment Receipt" };

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        include: {
          customer: true,
          jobCard: {
            select: {
              jobNumber: true,
              vehicle: { select: { make: true, model: true, licensePlate: true } },
            },
          },
          items: true,
        },
      },
    },
  });

  if (!payment) notFound();

  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <PaymentReceiptClient payment={payment} currencySymbol={sym} />
    </div>
  );
}
