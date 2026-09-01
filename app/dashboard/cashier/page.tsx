import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Cashier Dashboard" };

export default async function CashierDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const [pendingBills, todayPayments, completedJobs] = await Promise.all([
    prisma.invoice.findMany({
      where: { paymentStatus: { in: ["PENDING", "PARTIAL"] } },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        jobCard: { select: { jobNumber: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.payment.aggregate({
      where: { processedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.jobCard.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true, licensePlate: true, year: true } },
        items: { include: { product: { select: { name: true } } } },
        services: { include: { service: { select: { name: true } } } },
      },
    }),
  ]);

  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "$";

  return (
    <div className="animate-fade-up">
      {}
      <div className="row g-3 mb-4">
        {[
          { label: "Jobs Ready to Bill", value: completedJobs.length, icon: "bi-check-circle-fill", color: "#0ea5e9", bg: "rgba(14,165,233,0.15)" },
          { label: "Pending Bills", value: pendingBills.length, icon: "bi-receipt", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
          { label: "Today's Revenue", value: `${sym}${(todayPayments._sum.amount || 0).toFixed(2)}`, icon: "bi-currency-dollar", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
          { label: "Transactions Today", value: todayPayments._count, icon: "bi-credit-card", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
        ].map((s, i) => (
          <div key={i} className={`col-6 col-lg-3 animate-fade-up delay-${i+1}`}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}><i className={`bi ${s.icon}`}></i></div>
              <div className="stat-value" style={{ fontSize: typeof s.value === "string" && s.value.length > 8 ? "1.2rem" : "1.75rem" }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-4">
        <Link href="/dashboard/pos" className="btn btn-primary" id="open-pos-btn">
          <i className="bi bi-bag-fill me-1"></i> Open POS
        </Link>
        <Link href="/dashboard/job-cards" className="btn btn-outline-primary">
          <i className="bi bi-card-checklist me-1"></i> All Job Cards
        </Link>
        <Link href="/dashboard/invoices" className="btn btn-outline-secondary">
          <i className="bi bi-receipt me-1"></i> All Invoices
        </Link>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header fw-semibold d-flex align-items-center justify-content-between py-3">
              <span>
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                Completed Job Cards (Ready to Bill)
              </span>
              <span className="badge bg-success bg-opacity-10 text-success fs-7">
                {completedJobs.length} Ready
              </span>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Items & Labor</th>
                    <th>Est. Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No completed job cards pending billing.
                      </td>
                    </tr>
                  ) : (
                    completedJobs.map((job) => {
                      const partsTotal = job.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
                      const servicesTotal = job.services.reduce((acc, s) => acc + ((s.hours || 1) * (s.rate || 0)), 0);
                      const laborRate = job.laborRate || 0;
                      const estTotal = partsTotal + servicesTotal + laborRate;

                      return (
                        <tr key={job.id}>
                          <td>
                            <code style={{ color: "var(--primary-light)", fontWeight: 600 }}>{job.jobNumber}</code>
                            {job.completedAt && (
                              <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
                                {new Date(job.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{job.customer.name}</div>
                            <div className="text-muted small">{job.customer.phone}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                            </div>
                            <code style={{ fontSize: "0.72rem" }}>{job.vehicle.licensePlate}</code>
                          </td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-10 text-muted me-1" style={{ fontSize: "0.72rem" }}>
                              {job.items.length} Parts
                            </span>
                            <span className="badge bg-secondary bg-opacity-10 text-muted" style={{ fontSize: "0.72rem" }}>
                              {job.services.length} Services
                            </span>
                          </td>
                          <td className="fw-bold text-success">
                            {sym}{estTotal.toFixed(2)}
                          </td>
                          <td>
                            <Link href={`/dashboard/job-cards/${job.id}`} className="btn btn-sm btn-success text-white">
                              <i className="bi bi-receipt me-1"></i> View & Bill
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header fw-semibold d-flex align-items-center justify-content-between py-3">
              <span>
                <i className="bi bi-clock-history text-warning me-2"></i>
                Pending Unpaid Invoices
              </span>
              <span className="badge bg-warning bg-opacity-10 text-warning fs-7">
                {pendingBills.length} Unpaid
              </span>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Job Card</th>
                    <th>Total</th>
                    <th>Balance Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">No pending invoices</td>
                    </tr>
                  ) : (
                    pendingBills.map((inv) => (
                      <tr key={inv.id}>
                        <td><code style={{ color: "var(--primary-light)", fontWeight: 600 }}>{inv.invoiceNumber}</code></td>
                        <td>
                          <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{inv.customer.name}</div>
                          <div className="text-muted small">{inv.customer.phone}</div>
                        </td>
                        <td><span className="text-muted" style={{ fontSize: "0.78rem" }}>{inv.jobCard?.jobNumber || "Walk-in"}</span></td>
                        <td className="fw-semibold">{sym}{inv.total.toFixed(2)}</td>
                        <td style={{ color: "#f59e0b", fontWeight: 700 }}>{sym}{inv.balance.toFixed(2)}</td>
                        <td>
                          <Link href={`/dashboard/invoices/${inv.id}`} className="btn btn-sm btn-primary">
                            <i className="bi bi-cash me-1"></i> Collect Payment
                          </Link>
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
