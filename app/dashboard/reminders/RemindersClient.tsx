"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

interface Reminder {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceType: string;
  dueDate: string;
  dueMileage: number | null;
  lastServicedDate: string | null;
  status: "DUE_SOON" | "OVERDUE" | "SENT" | "SERVICED" | "CANCELLED";
  notes: string | null;
  sentAt: string | null;
  customer: { id: string; name: string; phone: string; email: string | null };
  vehicle: { id: string; licensePlate: string; make: string; model: string; mileage: number | null };
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  vehicles: { id: string; licensePlate: string; make: string; model: string; mileage: number | null }[];
}

interface RemindersClientProps {
  initialReminders: Reminder[];
  customers: CustomerOption[];
}

export default function RemindersClient({ initialReminders, customers }: RemindersClientProps) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    vehicleId: "",
    serviceType: "Scheduled 3-Month Maintenance",
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dueMileage: "",
    notes: "",
  });

  const selectedCustomer = customers.find((c) => c.id === formData.customerId);

  const handleCustomerChange = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      customerId,
      vehicleId: cust && cust.vehicles.length > 0 ? cust.vehicles[0].id : "",
    });
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.vehicleId || !formData.serviceType || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create reminder");
      }

      const newReminder = await res.json();
      setReminders([newReminder, ...reminders]);
      toast.success("Service reminder created successfully");
      setShowModal(false);
      setFormData({
        customerId: "",
        vehicleId: "",
        serviceType: "Scheduled 3-Month Maintenance",
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dueMileage: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Reminder["status"]) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      setReminders(reminders.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      toast.success(`Reminder marked as ${newStatus.replace("_", " ")}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update reminder");
    }
  };

  const filteredReminders = reminders.filter((r) => {
    const matchesSearch =
      r.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.phone.includes(search) ||
      r.vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceType.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const dueSoonCount = reminders.filter((r) => r.status === "DUE_SOON").length;
  const overdueCount = reminders.filter((r) => r.status === "OVERDUE" || (new Date(r.dueDate) < new Date() && r.status !== "SERVICED")).length;
  const sentCount = reminders.filter((r) => r.status === "SENT").length;
  const servicedCount = reminders.filter((r) => r.status === "SERVICED").length;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 font-weight-bold text-primary-custom">Service & Maintenance Reminders</h1>
          <p className="text-muted-custom mb-0 small">
            Automatically track vehicle maintenance schedules and re-engage past garage customers.
          </p>
        </div>
        <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg"></i>
          <span>New Service Reminder</span>
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-card border-custom p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-alarm fs-4"></i>
              </div>
              <div>
                <div className="text-muted-custom small fw-semibold">Due Soon</div>
                <div className="h4 mb-0 fw-bold">{dueSoonCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-card border-custom p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle p-3 bg-danger bg-opacity-10 text-danger">
                <i className="bi bi-exclamation-triangle fs-4"></i>
              </div>
              <div>
                <div className="text-muted-custom small fw-semibold">Overdue</div>
                <div className="h4 mb-0 fw-bold text-danger">{overdueCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-card border-custom p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle p-3 bg-info bg-opacity-10 text-info">
                <i className="bi bi-send fs-4"></i>
              </div>
              <div>
                <div className="text-muted-custom small fw-semibold">Sent Alerts</div>
                <div className="h4 mb-0 fw-bold text-info">{sentCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-card border-custom p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle p-3 bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
              <div>
                <div className="text-muted-custom small fw-semibold">Completed</div>
                <div className="h4 mb-0 fw-bold text-success">{servicedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-card border-custom mb-4">
        <div className="card-header bg-transparent border-custom d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 400 }}>
            <i className="bi bi-search text-muted"></i>
            <input
              type="text"
              className="form-control bg-dark border-custom text-light search-input"
              placeholder="Search customer, phone, license plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            {["ALL", "DUE_SOON", "OVERDUE", "SENT", "SERVICED"].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Due Date</th>
                  <th>Target Mileage</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No service reminders found.
                    </td>
                  </tr>
                ) : (
                  filteredReminders.map((r) => {
                    const isPastDue = new Date(r.dueDate) < new Date() && r.status !== "SERVICED";
                    const displayStatus = isPastDue ? "OVERDUE" : r.status;

                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="fw-semibold text-light">{r.customer.name}</div>
                          <div className="small text-muted">{r.customer.phone}</div>
                        </td>
                        <td>
                          <div className="fw-bold text-primary-custom">{r.vehicle.licensePlate}</div>
                          <div className="small text-muted">{r.vehicle.make} {r.vehicle.model}</div>
                        </td>
                        <td>
                          <span className="fw-semibold text-light">{r.serviceType}</span>
                          {r.notes && <div className="small text-muted">{r.notes}</div>}
                        </td>
                        <td>
                          <div className={`fw-semibold ${isPastDue ? "text-danger" : "text-light"}`}>
                            {new Date(r.dueDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td>
                          {r.dueMileage ? (
                            <span className="badge bg-secondary">{r.dueMileage.toLocaleString()} km</span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          {displayStatus === "DUE_SOON" && <span className="badge bg-warning text-dark">Due Soon</span>}
                          {displayStatus === "OVERDUE" && <span className="badge bg-danger">Overdue</span>}
                          {displayStatus === "SENT" && <span className="badge bg-info text-dark">Alert Sent</span>}
                          {displayStatus === "SERVICED" && <span className="badge bg-success">Serviced</span>}
                          {displayStatus === "CANCELLED" && <span className="badge bg-secondary">Cancelled</span>}
                        </td>
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            {r.status !== "SERVICED" && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  title="Mark Alert Sent"
                                  onClick={() => {
                                    handleStatusChange(r.id, "SENT");
                                    const message = `Hello ${r.customer.name}, your vehicle ${r.vehicle.licensePlate} is due for ${r.serviceType} at NEETEL AUTOSPARES. Book today!`;
                                    window.open(`https://wa.me/${r.customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
                                  }}
                                >
                                  <i className="bi bi-whatsapp"></i> Notify
                                </button>

                                <Link
                                  href={`/dashboard/job-cards/new?customerId=${r.customerId}&vehicleId=${r.vehicleId}`}
                                  className="btn btn-sm btn-outline-primary"
                                  title="Book Job Card"
                                >
                                  <i className="bi bi-card-checklist"></i> Book Job
                                </Link>

                                <button
                                  className="btn btn-sm btn-outline-success"
                                  title="Mark Serviced"
                                  onClick={() => handleStatusChange(r.id, "SERVICED")}
                                >
                                  <i className="bi bi-check-lg"></i> Complete
                                </button>
                              </>
                            )}
                          </div>
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

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-card border-custom text-light">
              <div className="modal-header border-custom">
                <h5 className="modal-title font-weight-bold">Schedule Service Reminder</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateReminder}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small font-weight-semibold">Customer</label>
                    <select
                      className="form-select bg-dark border-custom text-light"
                      value={formData.customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      required
                    >
                      <option value="">Select Customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-semibold">Vehicle</label>
                    <select
                      className="form-select bg-dark border-custom text-light"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      required
                      disabled={!formData.customerId}
                    >
                      <option value="">Select Vehicle...</option>
                      {selectedCustomer?.vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.licensePlate} — {v.make} {v.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-semibold">Service Type</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-custom text-light"
                      placeholder="e.g. Engine Oil Change, Brake Service"
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small font-weight-semibold">Due Date</label>
                      <input
                        type="date"
                        className="form-control bg-dark border-custom text-light"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-semibold">Target Mileage (km)</label>
                      <input
                        type="number"
                        className="form-control bg-dark border-custom text-light"
                        placeholder="e.g. 85000"
                        value={formData.dueMileage}
                        onChange={(e) => setFormData({ ...formData, dueMileage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-semibold">Notes</label>
                    <textarea
                      className="form-control bg-dark border-custom text-light"
                      rows={2}
                      placeholder="Optional notes or service details..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-custom">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Create Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
