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
    const s = search.toLowerCase();
    const matchesSearch =
      r.customer.name.toLowerCase().includes(s) ||
      r.customer.phone.toLowerCase().includes(s) ||
      r.vehicle.licensePlate.toLowerCase().includes(s) ||
      r.serviceType.toLowerCase().includes(s);

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const dueSoonCount = reminders.filter((r) => r.status === "DUE_SOON").length;
  const overdueCount = reminders.filter(
    (r) => r.status === "OVERDUE" || (new Date(r.dueDate) < new Date() && r.status !== "SERVICED")
  ).length;
  const sentCount = reminders.filter((r) => r.status === "SENT").length;
  const servicedCount = reminders.filter((r) => r.status === "SERVICED").length;

  const statCards = [
    { label: "Due Soon", value: dueSoonCount, icon: "bi-alarm", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    { label: "Overdue", value: overdueCount, icon: "bi-exclamation-triangle-fill", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Sent Alerts", value: sentCount, icon: "bi-send-fill", color: "#0ea5e9", bg: "rgba(14,165,233,0.15)" },
    { label: "Completed", value: servicedCount, icon: "bi-check-circle-fill", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ];

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h5 fw-bold mb-0">Service & Maintenance Reminders</h2>
          <p className="text-muted small mb-0">
            Automatically track vehicle maintenance schedules and re-engage past garage customers.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle-fill me-1"></i> New Service Reminder
        </button>
      </div>

      <div className="row g-3 mb-4">
        {statCards.map((card, i) => (
          <div key={i} className={`col-6 col-lg-3 animate-fade-up delay-${i + 1}`}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="search-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="search"
              className="search-input"
              placeholder="Search customer, phone, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-1 flex-wrap">
            {[
              { id: "ALL", label: "All Reminders" },
              { id: "DUE_SOON", label: "Due Soon" },
              { id: "OVERDUE", label: "Overdue" },
              { id: "SENT", label: "Sent Alerts" },
              { id: "SERVICED", label: "Serviced" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${statusFilter === tab.id ? "btn-primary" : ""}`}
                style={
                  statusFilter !== tab.id
                    ? { background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }
                    : {}
                }
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table mb-0 align-middle">
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
                  <td colSpan={7}>
                    <div className="text-center py-5">
                      <i className="bi bi-bell-slash fs-1 text-muted d-block mb-2"></i>
                      <p className="text-muted mb-0">No service reminders found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReminders.map((r) => {
                  const isPastDue = new Date(r.dueDate) < new Date() && r.status !== "SERVICED";
                  const displayStatus = isPastDue ? "OVERDUE" : r.status;

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                          {r.customer.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {r.customer.phone}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: "0.875rem", color: "var(--primary-light)" }}>
                          {r.vehicle.licensePlate}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {r.vehicle.make} {r.vehicle.model}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                          {r.serviceType}
                        </div>
                        {r.notes && (
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {r.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={`fw-semibold ${isPastDue ? "text-danger" : ""}`} style={{ fontSize: "0.85rem" }}>
                          {new Date(r.dueDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td>
                        {r.dueMileage ? (
                          <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-secondary)" }}>
                            {r.dueMileage.toLocaleString()} km
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {displayStatus === "DUE_SOON" && <span className="status-badge status-pending">Due Soon</span>}
                        {displayStatus === "OVERDUE" && <span className="status-badge status-cancelled">Overdue</span>}
                        {displayStatus === "SENT" && <span className="status-badge status-in-progress">Alert Sent</span>}
                        {displayStatus === "SERVICED" && <span className="status-badge status-billed">Serviced</span>}
                        {displayStatus === "CANCELLED" && <span className="status-badge status-cancelled">Cancelled</span>}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          {r.status !== "SERVICED" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}
                                title="Notify via WhatsApp"
                                onClick={() => {
                                  handleStatusChange(r.id, "SENT");
                                  const message = `Hello ${r.customer.name}, your vehicle ${r.vehicle.licensePlate} is due for ${r.serviceType} at NEETEL AUTOSPARES. Book today!`;
                                  window.open(
                                    `https://wa.me/${r.customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`,
                                    "_blank"
                                  );
                                }}
                              >
                                <i className="bi bi-whatsapp me-1"></i> Notify
                              </button>

                              <Link
                                href={`/dashboard/job-cards/new?customerId=${r.customerId}&vehicleId=${r.vehicleId}`}
                                className="btn btn-sm btn-outline-primary"
                                title="Book Job Card"
                              >
                                <i className="bi bi-card-checklist me-1"></i> Book Job
                              </Link>

                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}
                                title="Mark Serviced"
                                onClick={() => handleStatusChange(r.id, "SERVICED")}
                              >
                                <i className="bi bi-check-lg me-1"></i> Complete
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

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Schedule Service Reminder</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateReminder}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Customer</label>
                    <select
                      className="form-select"
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
                    <label className="form-label">Vehicle</label>
                    <select
                      className="form-select"
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
                    <label className="form-label">Service Type</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Engine Oil Change, Brake Service"
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Target Mileage (km)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 85000"
                        value={formData.dueMileage}
                        onChange={(e) => setFormData({ ...formData, dueMileage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional notes or service details..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
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
