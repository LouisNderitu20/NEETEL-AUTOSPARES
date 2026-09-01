"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface MechanicDashboardClientProps {
  initialMyJobs: any[];
  initialUnassignedJobs: any[];
  currentUserId: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  AWAITING_APPROVAL: "Awaiting Approval",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "status-pending",
  APPROVED: "status-in-progress",
  IN_PROGRESS: "status-in-progress",
  COMPLETED: "status-completed",
  AWAITING_APPROVAL: "status-pending",
};

export default function MechanicDashboardClient({
  initialMyJobs,
  initialUnassignedJobs,
  currentUserId,
}: MechanicDashboardClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleClaimJob = async (jobId: string) => {
    setLoading(jobId);
    try {
      const res = await fetch(`/api/job-cards/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mechanicId: currentUserId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to claim job card");
      }

      toast.success("Job card assigned to your queue successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  const myJobsCount = initialMyJobs.length;
  const unassignedCount = initialUnassignedJobs.length;

  return (
    <div className="animate-fade-up">
      {}
      <div className="row g-3 mb-4">
        <div className="col-6 animate-fade-up delay-1">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
              <i className="bi bi-wrench-adjustable"></i>
            </div>
            <div className="stat-value">{myJobsCount}</div>
            <div className="stat-label">My Active Jobs</div>
          </div>
        </div>
        <div className="col-6 animate-fade-up delay-2">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
              <i className="bi bi-collection"></i>
            </div>
            <div className="stat-value">{unassignedCount}</div>
            <div className="stat-label">Available Shop Jobs</div>
          </div>
        </div>
      </div>

      {}
      <div className="row mb-4">
        <div className="col-12">
          <h5 className="fw-semibold mb-3">My Job Queue</h5>

          {initialMyJobs.length === 0 ? (
            <div className="card text-center py-5 mb-5">
              <i className="bi bi-check-all fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted">No active jobs assigned to you right now.</p>
            </div>
          ) : (
            <div className="row g-3 mb-5">
              {initialMyJobs.map((job, i) => (
                <div key={job.id} className={`col-12 col-md-6 animate-fade-up delay-${(i % 4) + 1}`}>
                  <div className="card h-100">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <code style={{ color: "var(--primary-light)" }}>{job.jobNumber}</code>
                      <span className={`status-badge ${STATUS_CLASS[job.status] || "status-pending"}`}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="fw-semibold mb-1">{job.customer.name}</div>
                      <div className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>
                        <i className="bi bi-car-front me-1"></i>
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model} —{" "}
                        <code style={{ fontSize: "0.72rem" }}>{job.vehicle.licensePlate}</code>
                      </div>
                      <p className="text-muted mb-2" style={{ fontSize: "0.82rem" }}>
                        <i className="bi bi-chat-left-text me-1"></i>
                        {job.complaint}
                      </p>
                      <div className="d-flex gap-2 mb-1">
                        <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                          {job._count.items} parts used
                        </span>
                        {!job.inspection && (
                          <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.68rem" }}>
                            <i className="bi bi-exclamation-triangle me-1"></i>Inspection needed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-footer d-flex gap-2" style={{ background: "transparent", borderTop: "1px solid var(--border-color)" }}>
                      <Link href={`/dashboard/job-cards/${job.id}`} className="btn btn-primary btn-sm flex-grow-1">
                        <i className="bi bi-wrench me-1"></i> Work on Job
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h5 className="fw-semibold mb-3">Available Unassigned Jobs</h5>

          {initialUnassignedJobs.length === 0 ? (
            <div className="card text-center py-4 text-muted">
              <i className="bi bi-emoji-smile fs-2 d-block mb-1"></i>
              <span className="small">No unassigned jobs currently in the workshop queue.</span>
            </div>
          ) : (
            <div className="row g-3">
              {initialUnassignedJobs.map((job, i) => (
                <div key={job.id} className={`col-12 col-md-6 animate-fade-up delay-${(i % 4) + 1}`}>
                  <div className="card h-100" style={{ borderStyle: "dashed" }}>
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <code style={{ color: "var(--primary-light)" }}>{job.jobNumber}</code>
                      <span className="badge bg-warning bg-opacity-15 text-warning" style={{ fontSize: "0.7rem" }}>
                        Unassigned
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="fw-semibold mb-1">{job.customer.name}</div>
                      <div className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>
                        <i className="bi bi-car-front me-1"></i>
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model} —{" "}
                        <code style={{ fontSize: "0.72rem" }}>{job.vehicle.licensePlate}</code>
                      </div>
                      <p className="text-muted mb-2" style={{ fontSize: "0.82rem" }}>
                        <i className="bi bi-chat-left-text me-1"></i>
                        {job.complaint}
                      </p>
                    </div>
                    <div className="card-footer d-flex gap-2" style={{ background: "transparent", borderTop: "1px solid var(--border-color)" }}>
                      <button
                        onClick={() => handleClaimJob(job.id)}
                        disabled={loading === job.id}
                        className="btn btn-outline-warning btn-sm flex-grow-1"
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        {loading === job.id ? "Assigning..." : "Assign Job to Me"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
