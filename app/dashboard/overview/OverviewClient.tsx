"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import Link from "next/link";

Chart.register(...registerables);

interface JobStatus {
  status: string;
  _count: number;
}

interface DailyRevenue {
  date: string;
  total: number;
}

interface StatsProps {
  stats: {
    totalCustomers: number;
    totalVehicles: number;
    activeJobs: number;
    completedToday: number;
    pendingBilling: number;
    lowStockProducts: number;
    monthRevenue: number;
    revenueChange: number;
    recentJobs: any[];
    recentPayments: any[];
    jobsByStatus: JobStatus[];
    dailyRevenue: DailyRevenue[];
  };
  settings: any;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  BILLED: "Billed",
  CANCELLED: "Cancelled",
};

export default function OverviewClient({ stats, settings }: StatsProps) {
  
  const paymentMethodInfo = (method: string) => {
    const map: Record<string, { icon: string; label: string; color: string }> = {
      MOBILE_MONEY: { icon: "bi-phone", label: "M-Pesa", color: "#43a047" },
      CASH: { icon: "bi-cash-stack", label: "Cash", color: "#ef6c00" },
      CARD: { icon: "bi-credit-card", label: "Card", color: "#1565c0" },
      BANK_TRANSFER: { icon: "bi-bank", label: "Bank Transfer", color: "#6a1b9a" },
      PARTIAL: { icon: "bi-pie-chart", label: "Partial", color: "#f9a825" },
      DEPOSIT: { icon: "bi-safe", label: "Deposit", color: "#00838f" },
      CREDIT: { icon: "bi-clock-history", label: "Credit", color: "#c62828" },
    };
    return map[method] || { icon: "bi-wallet2", label: method.replace("_", " "), color: "#757575" };
  };

  const currencySymbol = settings?.currencySymbol || "KSh";
  const currencyCode = settings?.currency || "KES";
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const jobsChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartInstance = useRef<Chart | null>(null);
  const jobsChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (revenueChartRef.current) {
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
      const ctx = revenueChartRef.current.getContext("2d");
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

        revenueChartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: stats.dailyRevenue.map((d) =>
              new Date(d.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })
            ),
            datasets: [
              {
                label: "Daily Revenue",
                data: stats.dailyRevenue.map((d) => Number(d.total)),
                borderColor: "#6366f1",
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#6366f1",
                pointBorderColor: "#0f172a",
                pointBorderWidth: 2,
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#1e293b",
                borderColor: "rgba(148,163,184,0.1)",
                borderWidth: 1,
                titleColor: "#f8fafc",
                bodyColor: "#94a3b8",
                callbacks: {
                  label: (ctx) => ` ${currencySymbol}${Number(ctx.raw).toFixed(2)}`,
                },
              },
            },
            scales: {
              x: {
                grid: { color: "rgba(148,163,184,0.06)" },
                ticks: { color: "#64748b", font: { size: 11 } },
              },
              y: {
                grid: { color: "rgba(148,163,184,0.06)" },
                ticks: {
                  color: "#64748b",
                  font: { size: 11 },
                  callback: (v) => `${currencySymbol}${v}`,
                },
              },
            },
          },
        });
      }
    }

    if (jobsChartRef.current) {
      if (jobsChartInstance.current) jobsChartInstance.current.destroy();
      const ctx = jobsChartRef.current.getContext("2d");
      if (ctx) {
        const statusColors: Record<string, string> = {
          PENDING: "#f59e0b",
          AWAITING_APPROVAL: "#f97316",
          APPROVED: "#06b6d4",
          IN_PROGRESS: "#3b82f6",
          COMPLETED: "#8b5cf6",
          BILLED: "#10b981",
          CANCELLED: "#ef4444",
        };

        jobsChartInstance.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: stats.jobsByStatus.map((s) => STATUS_LABELS[s.status] || s.status),
            datasets: [
              {
                data: stats.jobsByStatus.map((s) => s._count),
                backgroundColor: stats.jobsByStatus.map(
                  (s) => statusColors[s.status] || "#64748b"
                ),
                borderColor: "#1e293b",
                borderWidth: 3,
                hoverOffset: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: "#94a3b8",
                  font: { size: 11 },
                  padding: 12,
                  usePointStyle: true,
                  pointStyleWidth: 8,
                },
              },
              tooltip: {
                backgroundColor: "#1e293b",
                borderColor: "rgba(148,163,184,0.1)",
                borderWidth: 1,
                titleColor: "#f8fafc",
                bodyColor: "#94a3b8",
              },
            },
          },
        });
      }
    }

    return () => {
      revenueChartInstance.current?.destroy();
      jobsChartInstance.current?.destroy();
    };
  }, [stats]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(v);

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "status-pending",
      AWAITING_APPROVAL: "status-pending",
      APPROVED: "status-in-progress",
      IN_PROGRESS: "status-in-progress",
      COMPLETED: "status-completed",
      BILLED: "status-billed",
      CANCELLED: "status-cancelled",
    };
    return map[status] || "status-pending";
  };

  const statCards = [
    {
      label: "Monthly Revenue",
      value: formatCurrency(stats.monthRevenue),
      icon: "bi-currency-dollar",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.15)",
      change: stats.revenueChange,
    },
    {
      label: "Active Jobs",
      value: stats.activeJobs.toString(),
      icon: "bi-wrench-adjustable",
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.15)",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: "bi-people-fill",
      color: "#10b981",
      bg: "rgba(16,185,129,0.15)",
    },
    {
      label: "Vehicles",
      value: stats.totalVehicles.toLocaleString(),
      icon: "bi-car-front",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
    },
    {
      label: "Completed Today",
      value: stats.completedToday.toString(),
      icon: "bi-check-circle-fill",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.15)",
    },
    {
      label: "Pending Billing",
      value: stats.pendingBilling.toString(),
      icon: "bi-receipt",
      color: "#f97316",
      bg: "rgba(249,115,22,0.15)",
    },
    {
      label: "Low Stock Items",
      value: stats.lowStockProducts.toString(),
      icon: "bi-exclamation-triangle-fill",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
    },
    {
      label: "Total Vehicles",
      value: stats.totalVehicles.toLocaleString(),
      icon: "bi-boxes",
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.15)",
    },
  ];

  return (
    <div className="animate-fade-up">
      {}
      <div className="row g-3 mb-4">
        {statCards.slice(0, 4).map((card, i) => (
          <div key={i} className={`col-6 col-lg-3 delay-${i + 1} animate-fade-up`}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
              {card.change !== undefined && (
                <div className={`stat-change ${card.change >= 0 ? "up" : "down"}`}>
                  <i className={`bi bi-arrow-${card.change >= 0 ? "up" : "down"}-right me-1`}></i>
                  {Math.abs(card.change).toFixed(1)}% vs last month
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="row g-3 mb-4">
        {statCards.slice(4, 7).map((card, i) => (
          <div key={i} className={`col-6 col-lg-4 delay-${i + 1} animate-fade-up`}>
            <div
              className="card h-100"
              style={{ padding: "1rem", display: "flex", flexDirection: "row", alignItems: "center", gap: "1rem" }}
            >
              <div
                className="stat-icon mb-0"
                style={{ background: card.bg, color: card.color, width: 40, height: 40, fontSize: "1rem", flexShrink: 0 }}
              >
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {card.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="row g-3 mb-4">
        {}
        <div className="col-12 col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-semibold">Revenue — Last 7 Days</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Daily income trend</div>
              </div>
              <Link href="/dashboard/reports" className="btn btn-sm btn-outline-primary">
                Full Report
              </Link>
            </div>
            <div className="card-body" style={{ height: 240 }}>
              <canvas ref={revenueChartRef}></canvas>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <div className="fw-semibold">Jobs by Status</div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Current job distribution</div>
            </div>
            <div className="card-body" style={{ height: 240 }}>
              <canvas ref={jobsChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="row g-3">
        {}
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Recent Job Cards</span>
              <Link href="/dashboard/job-cards" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Mechanic</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No job cards yet
                      </td>
                    </tr>
                  ) : (
                    stats.recentJobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <Link href={`/dashboard/job-cards/${job.id}`} className="fw-semibold" style={{ color: "var(--primary-light)" }}>
                            {job.jobNumber}
                          </Link>
                        </td>
                        <td>{job.customer.name}</td>
                        <td>
                          <span style={{ fontSize: "0.82rem" }}>
                            {job.vehicle.make} {job.vehicle.model}
                          </span>
                          <br />
                          <code style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {job.vehicle.licensePlate}
                          </code>
                        </td>
                        <td>{job.mechanic?.name || <span className="text-muted">Unassigned</span>}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(job.status)}`}>
                            {STATUS_LABELS[job.status] || job.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Recent Payments</span>
              <Link href="/dashboard/payments" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Method</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">
                        No payments yet
                      </td>
                    </tr>
                  ) : (
                    stats.recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                            {payment.invoice?.customer?.name || "Walk-in"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {new Date(payment.processedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          {(() => {
                            const info = paymentMethodInfo(payment.method);
                            return (
                              <span
                                className="badge d-inline-flex align-items-center gap-1"
                                style={{ fontSize: "0.68rem", backgroundColor: info.color, color: "#fff" }}
                              >
                                <i className={`bi ${info.icon}`}></i>
                                {info.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ color: "var(--success)" }}>
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
