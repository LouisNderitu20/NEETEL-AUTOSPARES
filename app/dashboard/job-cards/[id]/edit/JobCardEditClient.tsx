"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface JobCardEditClientProps {
  jobCard: any;
  products: any[];
  services: any[];
  currencySymbol: string;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export default function JobCardEditClient({
  jobCard,
  products,
  services,
  currencySymbol: sym,
  currentUser,
}: JobCardEditClientProps) {
  const [loading, setLoading] = useState(false);
  const [laborRate, setLaborRate] = useState<string>(String(jobCard.laborRate || 0));
  const isMechanic = currentUser?.role === "MECHANIC";
  
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [partQty, setPartQty] = useState<string>("1");
  const [partNotes, setPartNotes] = useState("");

  
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceHours, setServiceHours] = useState<string>("1");
  const [serviceNotes, setServiceNotes] = useState("");

  const router = useRouter();

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    const qty = parseInt(partQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCard.id}/use-part`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: qty,
          notes: partNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add part");
      }

      toast.success("Spare part added to job card successfully!");
      setSelectedProductId("");
      setPartQty("1");
      setPartNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleRemovePart = async (partItemId: string) => {
    if (!confirm("Are you sure you want to remove this part? The stock quantity will be restored.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCard.id}/use-part?partItemId=${partItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove part");
      }

      toast.success("Spare part removed and stock restored successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      toast.error("Please select a service");
      return;
    }
    const hours = parseFloat(serviceHours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Please enter a valid hours / quantity");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCard.id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          hours: hours,
          notes: serviceNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add service");
      }

      toast.success("Labor service added to job card!");
      setSelectedServiceId("");
      setServiceHours("1");
      setServiceNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleRemoveService = async (serviceItemId: string) => {
    if (!confirm("Are you sure you want to remove this service?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCard.id}/services?serviceItemId=${serviceItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove service");
      }

      toast.success("Labor service removed successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleSaveLaborRate = async () => {
    const rate = parseFloat(laborRate);
    if (isNaN(rate) || rate < 0) {
      toast.error("Please enter a valid labor rate");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laborRate: rate }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update labor rate");
      }

      toast.success("General labor rate updated successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link
          href={`/dashboard/job-cards/${jobCard.id}`}
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Job Card
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">Manage Parts & Labor</h2>
          <p className="text-muted small mb-0">Configure items for {jobCard.jobNumber}</p>
        </div>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {}
          <div className="card">
            <div className="card-header fw-bold">
              <i className="bi bi-box-seam me-2" style={{ color: "var(--primary)" }}></i>
              Allocate Spare Parts
            </div>
            <div className="card-body">
              <form onSubmit={handleAddPart}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="part-select">Select Spare Part *</label>
                  <select
                    id="part-select"
                    className="form-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Part --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) — {sym}{p.sellingPrice.toFixed(0)} [Stock: {p.quantity} {p.unit}]
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold" htmlFor="part-qty">Quantity *</label>
                    <input
                      id="part-qty"
                      type="number"
                      min="1"
                      className="form-control"
                      value={partQty}
                      onChange={(e) => setPartQty(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold" htmlFor="part-notes">Usage Notes</label>
                    <input
                      id="part-notes"
                      className="form-control"
                      placeholder="e.g. Front axle"
                      value={partNotes}
                      onChange={(e) => setPartNotes(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary w-100 fw-semibold">
                  Add Part & Deduct Stock
                </button>
              </form>
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header fw-bold">
              <i className="bi bi-wrench-adjustable me-2" style={{ color: "var(--primary)" }}></i>
              Add Labor / Services
            </div>
            <div className="card-body">
              <form onSubmit={handleAddService}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="service-select">Select Service *</label>
                  <select
                    id="service-select"
                    className="form-select"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {sym}{(s.defaultRate || 0).toFixed(0)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold" htmlFor="service-hours">Hours / Qty *</label>
                    <input
                      id="service-hours"
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-control"
                      value={serviceHours}
                      onChange={(e) => setServiceHours(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold" htmlFor="service-notes">Notes</label>
                    <input
                      id="service-notes"
                      className="form-control"
                      placeholder="Special instructions"
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-outline-primary w-100 fw-semibold">
                  Add Labor Item
                </button>
              </form>
            </div>
          </div>

          {}
          {!isMechanic && (
            <div className="card">
              <div className="card-header fw-bold">
                <i className="bi bi-cash-stack me-2" style={{ color: "var(--primary)" }}></i>
                General Diagnostics & Labor Cost
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="labor-rate-input">General Labor Rate ({sym}) *</label>
                  <div className="input-group">
                    <span className="input-group-text">{sym}</span>
                    <input
                      id="labor-rate-input"
                      type="number"
                      className="form-control"
                      value={laborRate}
                      onChange={(e) => setLaborRate(e.target.value)}
                    />
                  </div>
                </div>
                <button type="button" onClick={handleSaveLaborRate} disabled={loading} className="btn btn-outline-info w-100 fw-semibold">
                  Update General Labor Rate
                </button>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header fw-bold">Allocated Items Summary</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Type</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Total Price</th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {}
                    {jobCard.items.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-semibold">{item.product.name}</div>
                          <div className="text-muted small" style={{ fontSize: "0.72rem" }}>SKU: {item.product.sku}</div>
                        </td>
                        <td><span className="badge bg-secondary bg-opacity-25" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Part</span></td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end fw-semibold">{sym}{item.totalPrice.toFixed(2)}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleRemovePart(item.id)}
                            disabled={loading}
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            title="Remove part & restore stock"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {}
                    {jobCard.services.map((s: any) => (
                      <tr key={s.id}>
                        <td className="fw-semibold">{s.service.name}</td>
                        <td><span className="badge bg-primary bg-opacity-25 text-primary-custom" style={{ fontSize: "0.7rem" }}>Labor</span></td>
                        <td className="text-center">{s.hours} hr</td>
                        <td className="text-end fw-semibold">{sym}{s.totalPrice.toFixed(2)}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleRemoveService(s.id)}
                            disabled={loading}
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            title="Remove labor"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {}
                    {jobCard.laborRate > 0 && (
                      <tr>
                        <td className="fw-semibold text-secondary">General Diagnostics & Labor</td>
                        <td><span className="badge bg-info bg-opacity-25 text-info" style={{ fontSize: "0.7rem" }}>Labor</span></td>
                        <td className="text-center">1</td>
                        <td className="text-end fw-semibold">{sym}{jobCard.laborRate.toFixed(2)}</td>
                        <td className="text-end">
                          {}
                        </td>
                      </tr>
                    )}

                    {}
                    {jobCard.items.length === 0 && jobCard.services.length === 0 && jobCard.laborRate === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">
                          <i className="bi bi-wrench-adjustable fs-2 text-muted d-block mb-2"></i>
                          No parts or services added to this job card yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
