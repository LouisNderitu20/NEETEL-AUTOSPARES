"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface SuppliersClientProps {
  initialSuppliers: any[];
  canManage: boolean;
}

export default function SuppliersClient({ initialSuppliers, canManage }: SuppliersClientProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");

  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const filteredSuppliers = suppliers.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.contactName && s.contactName.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      s.phone.toLowerCase().includes(term)
    );
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setName(supplier.name || "");
    setContactName(supplier.contactName || "");
    setEmail(supplier.email || "");
    setPhone(supplier.phone || "");
    setAddress(supplier.address || "");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error("Supplier Name and Phone Number are required.");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        name: name.trim(),
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim(),
        address: address.trim() || null,
      };

      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save supplier");
      }

      const saved = await res.json();
      toast.success(editingSupplier ? "Supplier updated successfully!" : "New supplier registered successfully!");

      
      if (editingSupplier) {
        setSuppliers(suppliers.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
      } else {
        setSuppliers([...suppliers, { ...saved, _count: { products: 0, purchaseOrders: 0 } }]);
      }

      setModalOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, supplierName: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${supplierName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete supplier");
      }

      toast.success(`Supplier "${supplierName}" deleted successfully.`);
      setSuppliers(suppliers.filter((s) => s.id !== id));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Suppliers</h2>
          <p className="text-muted small mb-0">{suppliers.length} suppliers</p>
        </div>
        <div className="d-flex gap-2">
          <div className="search-wrapper d-block">
            <i className="bi bi-search"></i>
            <input
              type="search"
              className="search-input"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
              <i className="bi bi-plus-circle-fill me-1"></i>Add Supplier
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Products</th>
                <th>Orders</th>
                <th className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{s.name}</td>
                  <td style={{ fontSize: "0.82rem" }}>{s.contactName || "—"}</td>
                  <td style={{ fontSize: "0.82rem" }}>{s.phone}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{s.email || "—"}</td>
                  <td>
                    <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {s._count?.products || 0}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {s._count?.purchaseOrders || 0}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-1">
                      <Link
                        href={`/dashboard/purchase-orders/new?supplierId=${s.id}`}
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        New PO
                      </Link>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                            onClick={() => openEditModal(s)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(s.id, s.name)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-5">No suppliers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {modalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : "Register New Supplier"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    {}
                    <div className="col-12">
                      <label className="form-label small text-muted mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. AutoParts Wholesale Ltd"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    {}
                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted mb-1">Contact Person</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. David Supplies"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    {}
                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted mb-1">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +254 700 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    {}
                    <div className="col-12">
                      <label className="form-label small text-muted mb-1">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. contact@supplier.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {}
                    <div className="col-12">
                      <label className="form-label small text-muted mb-1">Physical Address</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 456 Supplier Ave, Suite 12"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                    {submitLoading ? "Saving..." : "Save Supplier"}
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
