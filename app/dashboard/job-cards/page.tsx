import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { JobStatus } from "@prisma/client";

export const metadata = { title: "Job Cards" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  BILLED: "Billed",
  CANCELLED: "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "status-pending",
  AWAITING_APPROVAL: "status-pending",
  APPROVED: "status-in-progress",
  IN_PROGRESS: "status-in-progress",
  COMPLETED: "status-completed",
  BILLED: "status-billed",
  CANCELLED: "status-cancelled",
};

export default async function JobCardsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isMechanic = session.user.role === "MECHANIC";

  const jobCards = await prisma.jobCard.findMany({
    where: isMechanic ? { mechanicId: session.user.id } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, licensePlate: true, year: true } },
      mechanic: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true, services: true } },
    },
  });

  const canCreate = ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role);

  return (
    <div className="animate-fade-up">
      {}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Job Cards</h2>
          <p className="text-muted small mb-0">
            {isMechanic ? "Jobs assigned to you" : `${jobCards.length} total job cards`}
          </p>
        </div>
        <div className="d-flex gap-2">
          {}
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            id="status-filter"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {canCreate && (
            <Link href="/dashboard/job-cards/new" className="btn btn-primary btn-sm" id="new-jobcard-btn">
              <i className="bi bi-plus-circle-fill me-1"></i>
              New Job Card
            </Link>
          )}
        </div>
      </div>

      {}
      {jobCards.length === 0 ? (
        <div className="card text-center py-5">
          <i className="bi bi-card-checklist fs-1 text-muted d-block mb-2"></i>
          <p className="text-muted mb-3">No job cards found</p>
          {canCreate && (
            <Link href="/dashboard/job-cards/new" className="btn btn-primary btn-sm mx-auto" style={{ width: "fit-content" }}>
              Create First Job Card
            </Link>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {jobCards.map((job, i) => (
            <div key={job.id} className={`col-12 col-md-6 col-xl-4 animate-fade-up delay-${(i % 4) + 1}`}>
              <div className="card h-100" style={{ borderRadius: "var(--radius-lg)" }}>
                {}
                <div className="card-header d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fw-bold" style={{ color: "var(--primary-light)", fontSize: "0.875rem" }}>
                      {job.jobNumber}
                    </span>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                      {new Date(job.createdAt).toLocaleDateString("en", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>
                  <span className={`status-badge ${STATUS_CLASS[job.status] || "status-pending"}`}>
                    {STATUS_LABELS[job.status] || job.status}
                  </span>
                </div>

                <div className="card-body">
                  {}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "var(--primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.9rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                      }}
                    >
                      {job.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                        {job.customer.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        {job.customer.phone}
                      </div>
                    </div>
                  </div>

                  {}
                  <div
                    className="p-2 rounded-2 mb-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-car-front text-muted"></i>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                        </div>
                        <code style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {job.vehicle.licensePlate}
                        </code>
                      </div>
                    </div>
                  </div>

                  {}
                  <p
                    className="text-muted mb-3"
                    style={{ fontSize: "0.8rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    <i className="bi bi-chat-left-text me-1"></i>
                    {job.complaint}
                  </p>

                  {}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                        <i className="bi bi-box me-1"></i>{job._count.items} parts
                      </span>
                      <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                        <i className="bi bi-tools me-1"></i>{job._count.services} services
                      </span>
                    </div>
                    {job.mechanic && (
                      <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                        <i className="bi bi-person me-1"></i>{job.mechanic.name}
                      </span>
                    )}
                  </div>
                </div>

                {}
                <div
                  className="card-footer d-flex gap-2"
                  style={{ background: "transparent", borderTop: "1px solid var(--border-color)" }}
                >
                  <Link
                    href={`/dashboard/job-cards/${job.id}`}
                    className="btn btn-primary btn-sm flex-grow-1"
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </Link>
                  {["IT_ADMIN", "OWNER", "MANAGER", "MECHANIC"].includes(session.user.role) &&
                    !["BILLED", "CANCELLED"].includes(job.status) && (
                    <Link
                      href={`/dashboard/job-cards/${job.id}/edit`}
                      className="btn btn-sm"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                    >
                      <i className="bi bi-pencil"></i>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
