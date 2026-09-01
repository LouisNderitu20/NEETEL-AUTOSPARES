"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface CustomersClientProps {
  initialCustomers: any[];
  canDelete: boolean;
}

export default function CustomersClient({ initialCustomers, canDelete }: CustomersClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.phone.toLowerCase().includes(s) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.company && c.company.toLowerCase().includes(s))
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete customer");
      }

      const reply = await res.json();
      toast.success(reply.message || `Customer "${name}" deleted successfully.`);

      if (reply.deactivated) {
        
        setCustomers(customers.map((c) => (c.id === id ? { ...c, isActive: false } : c)));
      } else {
        
        setCustomers(customers.filter((c) => c.id !== id));
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="animate-fade-up">
      {}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Customers</h2>
          <p className="text-muted small mb-0">{customers.length} registered customers</p>
        </div>
        <div className="d-flex gap-2">
          <div className="search-wrapper d-block">
            <i className="bi bi-search"></i>
            <input
              type="search"
              className="search-input"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/customers/new" className="btn btn-primary" id="add-customer-btn">
            <i className="bi bi-person-plus-fill me-1"></i>
            Add Customer
          </Link>
        </div>
      </div>

      {}
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Vehicles</th>
                <th>Jobs</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="text-center py-5">
                      <i className="bi bi-people fs-1 text-muted d-block mb-2"></i>
                      <p className="text-muted mb-3">No customers found.</p>
                      {search === "" && (
                        <Link href="/dashboard/customers/new" className="btn btn-primary btn-sm">
                          Add First Customer
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                            {customer.name}
                          </div>
                          {customer.company && (
                            <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                              {customer.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{customer.phone}</td>
                    <td style={{ fontSize: "0.875rem" }}>{customer.email || "—"}</td>
                    <td>
                      <span className="badge bg-primary bg-opacity-25 text-primary-custom">
                        <i className="bi bi-car-front me-1"></i>
                        {customer.vehicles.length}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-secondary)" }}>
                        <i className="bi bi-card-checklist me-1"></i>
                        {customer.jobCards.length}
                      </span>
                    </td>
                    <td>
                      {customer.isActive ? (
                        <span className="status-badge status-billed">Active</span>
                      ) : (
                        <span className="status-badge status-cancelled">Inactive</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="btn btn-sm btn-outline-primary"
                          title="View Profile"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link
                          href={`/dashboard/customers/${customer.id}/edit`}
                          className="btn btn-sm"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                          title="Edit Profile"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <Link
                          href={`/dashboard/job-cards/new?customerId=${customer.id}`}
                          className="btn btn-sm"
                          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}
                          title="New Job Card"
                        >
                          <i className="bi bi-plus-circle"></i>
                        </Link>
                        {canDelete && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Customer"
                            onClick={() => handleDelete(customer.id, customer.name)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
