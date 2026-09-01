import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Vehicles" };

export default async function VehiclesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      _count: { select: { jobCards: true } },
    },
  });

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Vehicles</h2>
          <p className="text-muted small mb-0">{vehicles.length} registered vehicles</p>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>Plate</th><th>Make & Model</th><th>Owner</th><th>Year</th><th>Fuel</th><th>Jobs</th><th></th></tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td><code style={{ color: "var(--primary-light)" }}>{v.licensePlate}</code></td>
                  <td>
                    <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{v.make} {v.model}</div>
                    {v.color && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{v.color}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.82rem" }}>{v.customer.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{v.customer.phone}</div>
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>{v.year || "—"}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{v.fuelType || "—"}</td>
                  <td><span className="badge bg-primary bg-opacity-25 text-primary-custom">{v._count.jobCards}</span></td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link href={`/dashboard/job-cards/new?vehicleId=${v.id}`} className="btn btn-sm btn-outline-primary py-1 px-2" style={{ fontSize: "0.75rem" }}>
                        New Job
                      </Link>
                      {["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role) && (
                        <Link href={`/dashboard/vehicles/${v.id}/edit`} className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ fontSize: "0.75rem", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                          <i className="bi bi-pencil-square"></i>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-5">No vehicles registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
