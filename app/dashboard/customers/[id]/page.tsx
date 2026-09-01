import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Customer Profile" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: true,
      jobCards: {
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: true,
          mechanic: { select: { name: true } },
          items: { select: { totalPrice: true } },
          services: { select: { totalPrice: true } },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  const statusColors: Record<string, string> = {
    PENDING: "warning",
    APPROVED: "info",
    IN_PROGRESS: "primary",
    COMPLETED: "success",
    BILLED: "secondary",
    CANCELLED: "danger",
  };

  return (
    <div className="animate-fade-up">
      {}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Link href="/dashboard/customers" className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
            <i className="bi bi-arrow-left"></i>
          </Link>
          <h2 className="h5 fw-bold mb-0">Customer Profile</h2>
        </div>
        <div className="d-flex gap-2">
          {["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role) && (
            <Link href={`/dashboard/customers/${customer.id}/edit`} className="btn btn-outline-primary btn-sm">
              <i className="bi bi-pencil-square me-1"></i>Edit Profile
            </Link>
          )}
          {["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role) && (
            <Link href={`/dashboard/vehicles/new?customerId=${customer.id}`} className="btn btn-outline-secondary btn-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-car-front-fill me-1"></i>Register Vehicle
            </Link>
          )}
          {["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role) && (
            <Link href={`/dashboard/job-cards/new?customerId=${customer.id}`} className="btn btn-success btn-sm text-white">
              <i className="bi bi-plus-circle me-1"></i>New Job Card
            </Link>
          )}
        </div>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-body text-center p-4">
              <div className="mx-auto mb-3" style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
                {customer.name.charAt(0)}
              </div>
              <h4 className="fw-bold mb-1">{customer.name}</h4>
              {customer.company && <p className="text-muted small mb-3">{customer.company}</p>}
              
              <hr className="my-4 border-light border-opacity-10" />
              
              <div className="text-start d-flex flex-column gap-3" style={{ fontSize: "0.85rem" }}>
                <div>
                  <span className="text-muted d-block small">Phone</span>
                  <span className="fw-medium">{customer.phone}</span>
                </div>
                {customer.phone2 && (
                  <div>
                    <span className="text-muted d-block small">Alternative Phone</span>
                    <span className="fw-medium">{customer.phone2}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted d-block small">Email Address</span>
                  <span className="fw-medium">{customer.email || "—"}</span>
                </div>
                <div>
                  <span className="text-muted d-block small">ID / Passport Number</span>
                  <span className="fw-medium">{customer.idNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-muted d-block small">Credit Limit</span>
                  <span className="fw-medium text-success">{sym}{customer.creditLimit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted d-block small">Notes / Remarks</span>
                  <span className="fw-medium text-secondary">{customer.notes || "No notes available."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-8 d-flex flex-column gap-4">
          {}
          <div className="card">
            <div className="card-header fw-bold">
              <i className="bi bi-car-front-fill me-2" style={{ color: "var(--primary)" }}></i>
              Registered Vehicles
            </div>
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>License Plate</th>
                    <th>Make & Model</th>
                    <th>Year / Color</th>
                    <th>Fuel / Transmission</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customer.vehicles.map((v) => (
                    <tr key={v.id}>
                      <td><code style={{ color: "var(--primary-light)" }}>{v.licensePlate}</code></td>
                      <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{v.make} {v.model}</td>
                      <td style={{ fontSize: "0.82rem" }}>{v.year} — {v.color || "—"}</td>
                      <td style={{ fontSize: "0.82rem" }}>{v.fuelType} — {v.transmission}</td>
                      <td>
                        <Link
                          href={`/dashboard/vehicles/${v.id}/edit`}
                          className="btn btn-sm btn-outline-primary py-0 px-2"
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-pencil-square me-1"></i>Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {customer.vehicles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No vehicles registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header fw-bold">
              <i className="bi bi-wrench-adjustable me-2" style={{ color: "var(--primary)" }}></i>
              Service History (Job Cards)
            </div>
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Vehicle</th>
                    <th>Mechanic</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customer.jobCards.map((j) => {
                    const partsCost = j.items.reduce((sum, item) => sum + item.totalPrice, 0);
                    const servicesCost = j.services.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
                    const grandTotal = partsCost + servicesCost + (j.laborRate || 0);

                    return (
                      <tr key={j.id}>
                        <td><code style={{ color: "var(--primary-light)" }}>{j.jobNumber}</code></td>
                        <td style={{ fontSize: "0.82rem" }}>{j.vehicle.make} {j.vehicle.model} ({j.vehicle.licensePlate})</td>
                        <td style={{ fontSize: "0.82rem" }}>{j.mechanic?.name || "Unassigned"}</td>
                        <td>
                          <span className={`badge bg-${statusColors[j.status] || "secondary"} bg-opacity-75`} style={{ fontSize: "0.72rem" }}>
                            {j.status}
                          </span>
                        </td>
                        <td className="fw-semibold" style={{ fontSize: "0.82rem" }}>{sym}{grandTotal.toFixed(2)}</td>
                        <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Link href={`/dashboard/job-cards/${j.id}`} className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: "0.75rem" }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {customer.jobCards.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">No service history found.</td>
                    </tr>
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
