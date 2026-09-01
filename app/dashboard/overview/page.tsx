import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OverviewClient from "./OverviewClient";

export const metadata = { title: "Overview Dashboard" };

async function getDashboardStats() {
  try {
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
      products,
      monthRevenue,
      lastMonthRevenue,
      recentJobs,
      recentPayments,
      jobsByStatus,
      rawDailyRevenue,
    ] = await Promise.all([
      prisma.customer.count({ where: { isActive: true } }),
      prisma.vehicle.count(),
      prisma.jobCard.count({ where: { status: { in: ["PENDING", "APPROVED", "IN_PROGRESS"] } } }),
      prisma.jobCard.count({ where: { completedAt: { gte: startOfDay } } }),
      prisma.jobCard.count({ where: { status: { notIn: ["BILLED", "CANCELLED"] } } }),
      prisma.product.findMany({ select: { quantity: true, minStockLevel: true } }),
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
      prisma.$queryRaw<Array<{ date: string; total: any }>>`
        SELECT 
          DATE("processedAt")::text as date,
          COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE "processedAt" >= NOW() - INTERVAL '7 days'
        GROUP BY DATE("processedAt")
        ORDER BY date ASC
      `,
    ]);

    const lowStockProducts = products.filter((p) => p.quantity <= p.minStockLevel).length;

    const monthRevenueTotal = monthRevenue._sum.amount ?? 0;
    const lastMonthRevenueTotal = lastMonthRevenue._sum.amount ?? 0;
    const revenueChange =
      lastMonthRevenueTotal > 0
        ? ((monthRevenueTotal - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100
        : 0;

    const dailyRevenue = (rawDailyRevenue || []).map((d) => ({
      date: String(d.date),
      total: Number(d.total || 0),
    }));

    return {
      totalCustomers,
      totalVehicles,
      activeJobs,
      completedToday,
      pendingBilling,
      lowStockProducts,
      monthRevenue: monthRevenueTotal,
      revenueChange,
      recentJobs: JSON.parse(JSON.stringify(recentJobs)),
      recentPayments: JSON.parse(JSON.stringify(recentPayments)),
      jobsByStatus,
      dailyRevenue,
    };
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return {
      totalCustomers: 0,
      totalVehicles: 0,
      activeJobs: 0,
      completedToday: 0,
      pendingBilling: 0,
      lowStockProducts: 0,
      monthRevenue: 0,
      revenueChange: 0,
      recentJobs: [],
      recentPayments: [],
      jobsByStatus: [],
      dailyRevenue: [],
    };
  }
}

export default async function OverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
    redirect("/dashboard/reception");
  }

  const [stats, settings] = await Promise.all([
    getDashboardStats(),
    prisma.garageSettings.findFirst().catch(() => null),
  ]);

  return <OverviewClient stats={stats} settings={settings} />;
}
