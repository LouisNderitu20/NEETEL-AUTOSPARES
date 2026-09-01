import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Reception Dashboard" };

export default async function ReceptionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [todayJobs, pendingJobs, customers, vehicles, mechanics] = await Promise.all([
    prisma.jobCard.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.jobCard.count({ where: { status: "PENDING" } }),
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.user.findMany({ where: { role: "MECHANIC", isActive: true }, select: { id: true, name: true } }),
  ]);

  const recentJobs = await prisma.jobCard.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, licensePlate: true } },
      mechanic: { select: { name: true } },
    },
  });

  return (
    <div className="animate-fade-up">
      {}
      <div className="row g-3 mb-4">
        {[
          { label: "Jobs Today", value: todayJobs, icon: "bi-card-checklist", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
          { label: "Pending Jobs", value: pendingJobs, icon: "bi-hourglass-split", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
          { label: "Total Customers", value: customers, icon: "bi-people-fill", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
          { label: "Total Vehicles", value: vehicles, icon: "bi-car-front", color: "#0ea5e9", bg: "rgba(14,165,233,0.15)" },
        ].map((s, i) => (
          <div key={i} className={`col-6 col-lg-3 animate-fade-up delay-${i + 1}`}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className={`bi ${s.icon}`}></i>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header fw-semibold">Quick Actions</div>
            <div className="card-body d-flex flex-wrap gap-2">
              <Link href="/dashboard/job-cards/new" className="btn btn-primary" id="quick-new-job">
                <i className="bi bi-plus-circle-fill me-1"></i> New Job Card
              </Link>
              <Link href="/dashboard/customers/new" className="btn btn-outline-primary" id="quick-new-customer">
                <i className="bi bi-person-plus-fill me-1"></i> New Customer
              </Link>
              <Link href="/dashboard/customers" className="btn" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                <i className="bi bi-search me-1"></i> Find Customer
              </Link>
              <Link href="/dashboard/vehicles" className="btn" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                <i className="bi bi-car-front me-1"></i> Vehicles
              </Link>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold">Recent Job Cards</span>
          <Link href="/dashboard/job-cards/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus me-1"></i> New
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
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job) => (
                <tr key={job.id}>
                  <td><code style={{ color: "var(--primary-light)" }}>{job.jobNumber}</code></td>
                  <td><div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{job.customer.name}</div><div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{job.customer.phone}</div></td>
                  <td style={{ fontSize: "0.82rem" }}>{job.vehicle.make} {job.vehicle.model}<br /><code style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{job.vehicle.licensePlate}</code></td>
                  <td style={{ fontSize: "0.82rem" }}>{job.mechanic?.name || <span className="text-muted">Unassigned</span>}</td>
                  <td><span className={`status-badge ${job.status === "PENDING" ? "status-pending" : job.status === "IN_PROGRESS" ? "status-in-progress" : job.status === "COMPLETED" ? "status-completed" : "status-billed"}`}>{job.status.replace("_", " ")}</span></td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td><Link href={`/dashboard/job-cards/${job.id}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
