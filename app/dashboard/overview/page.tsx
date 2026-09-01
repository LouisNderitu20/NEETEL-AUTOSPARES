import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OverviewClient from "./OverviewClient";

export const metadata = { title: "Overview Dashboard" };

async function getDashboardStats() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    totalCustomers,
    totalVehicles,
    activeJobs,
    completedToday,
    pendingBilling,
    lowStockProducts,
    monthRevenue,
    lastMonthRevenue,
    recentJobs,
    recentPayments,
    jobsByStatus,
    dailyRevenue,
  ] = await Promise.all([
    prisma.customer.count({ where: { isActive: true } }),
    prisma.vehicle.count(),
    prisma.jobCard.count({ where: { status: { in: ["PENDING", "APPROVED", "IN_PROGRESS"] } } }),
    prisma.jobCard.count({ where: { completedAt: { gte: startOfDay } } }),
    prisma.jobCard.count({ where: { status: { notIn: ["BILLED", "CANCELLED"] } } }),
    prisma.product.count({ where: { quantity: { lte: prisma.product.fields.minStockLevel } } }),
    prisma.payment.aggregate({
      where: { processedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { processedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.jobCard.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { make: true, model: true, licensePlate: true } },
        mechanic: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { processedAt: "desc" },
      include: {
        invoice: {
          include: { customer: { select: { name: true } } },
        },
      },
    }),
    prisma.jobCard.groupBy({
      by: ["status"],
      _count: true,
    }),
    
    prisma.$queryRaw<{ date: string; total: number }[]>`
      SELECT 
        DATE("processedAt")::text as date,
        SUM(amount) as total
      FROM payments
      WHERE "processedAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("processedAt")
      ORDER BY date ASC
    `,
  ]);

  const monthRevenueTotal = monthRevenue._sum.amount ?? 0;
  const lastMonthRevenueTotal = lastMonthRevenue._sum.amount ?? 0;
  const revenueChange =
    lastMonthRevenueTotal > 0
      ? ((monthRevenueTotal - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100
      : 0;

  return {
    totalCustomers,
    totalVehicles,
    activeJobs,
    completedToday,
    pendingBilling,
    lowStockProducts,
    monthRevenue: monthRevenueTotal,
    revenueChange,
    recentJobs,
    recentPayments,
    jobsByStatus,
    dailyRevenue,
  };
}

export default async function OverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
    redirect("/dashboard/reception");
  }

  const [stats, settings] = await Promise.all([
    getDashboardStats(),
    prisma.garageSettings.findFirst(),
  ]);

  return <OverviewClient stats={stats} settings={settings} />;
}
