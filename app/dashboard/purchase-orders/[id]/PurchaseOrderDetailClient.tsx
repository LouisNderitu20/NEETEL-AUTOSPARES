"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface PurchaseOrderDetailClientProps {
  po: any;
  currencySymbol: string;
}

export default function PurchaseOrderDetailClient({
  po,
  currencySymbol: sym,
}: PurchaseOrderDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [receivingModalOpen, setReceivingModalOpen] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: string, customItems?: any[]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          items: customItems,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update PO status");
      }

      toast.success(
        newStatus === "RECEIVED"
          ? "Stock received and inventory counts updated successfully!"
          : `Purchase Order status updated to ${newStatus.toLowerCase()}`
      );
      setReceivingModalOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Purchase Order "${po.poNumber}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete purchase order");
      }

      toast.success("Purchase order deleted successfully.");
      router.push("/dashboard/purchase-orders");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    DRAFT: "warning",
    SENT: "info",
    RECEIVED: "success",
    CANCELLED: "danger",
  };

  return (
    <div className="animate-fade-up print-container">
      {}
      <div className="card mb-4 print-hide">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-3">
          <div className="d-flex align-items-center gap-2">
            <Link href="/dashboard/purchase-orders" className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0">{po.poNumber}</h4>
                <span
                  className="badge"
                  style={{
                    background: po.status === "RECEIVED" ? "#d1fae5" : po.status === "SENT" ? "#dbeafe" : po.status === "CANCELLED" ? "#fee2e2" : "#f1f5f9",
                    color:      po.status === "RECEIVED" ? "#065f46" : po.status === "SENT" ? "#1e40af" : po.status === "CANCELLED" ? "#991b1b" : "#475569",
                    fontSize: "0.72rem",
                  }}
                >
                  {po.status}
                </span>
              </div>
              <span className="text-muted small">Issued on {new Date(po.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            {po.status !== "RECEIVED" && (
              <button onClick={handleDelete} disabled={loading} className="btn btn-sm btn-outline-danger me-auto">
                <i className="bi bi-trash me-1"></i>Delete Order
              </button>
            )}

            <button onClick={handlePrint} className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-printer me-1"></i>Print PO
            </button>

            {po.status === "DRAFT" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  disabled={loading}
                  className="btn btn-sm btn-outline-danger"
                >
                  <i className="bi bi-x-lg me-1"></i>Cancel Order
                </button>
                <button
                  onClick={() => handleUpdateStatus("SENT")}
                  disabled={loading}
                  className="btn btn-sm btn-outline-info"
                >
                  <i className="bi bi-send me-1"></i>Mark as Sent
                </button>
              </>
            )}

            {po.status === "SENT" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  disabled={loading}
                  className="btn btn-sm btn-outline-danger"
                >
                  <i className="bi bi-x-lg me-1"></i>Cancel Order
                </button>
                <button
                  onClick={() => {
                    const initialQtys: Record<string, string> = {};
                    po.items.forEach((item: any) => {
                      const pending = item.quantityOrdered - item.quantityReceived;
                      initialQtys[item.id] = Math.max(0, pending).toString();
                    });
                    setReceivedQtys(initialQtys);
                    setReceivingModalOpen(true);
                  }}
                  disabled={loading}
                  className="btn btn-sm btn-success text-white"
                >
                  <i className="bi bi-box-arrow-in-down me-1"></i>Receive Stock
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="d-none d-print-block mb-4">
        <div className="d-flex align-items-center justify-content-between pb-3" style={{ borderBottom: "3px solid #c5a059" }}>
          <div className="d-flex align-items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="NEETEL AUTOSPARES Logo" 
              style={{ height: "65px", width: "65px", objectFit: "cover", borderRadius: "8px", border: "1px solid #c5a059" }} 
            />
            <div>
              <h3 className="h5 fw-bold mb-1" style={{ color: "#0f1013", letterSpacing: "0.5px" }}>NEETEL AUTOSPARES</h3>
              <p className="small text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                Garages, Diagnostics & Premium Auto Spare Parts Specialist
              </p>
              <p className="small text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                Kirinyaga Road, Nairobi, Kenya | Phone: +254 700 000 000 | PIN: P051682736C
              </p>
            </div>
          </div>
          <div className="text-end">
            <h4 className="fw-bold mb-1" style={{ color: "#c5a059", fontSize: "1.2rem" }}>PURCHASE ORDER</h4>
            <div className="small text-muted" style={{ fontSize: "0.78rem" }}>
              <div><strong>No:</strong> {po.poNumber}</div>
              <div><strong>Date:</strong> {new Date(po.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        {}
        <div className="row g-4 mb-4 pt-2">
          <div className="col-12 col-md-6">
            <span className="text-muted small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Supplier Details</span>
            <h5 className="fw-bold mb-1">{po.supplier.name}</h5>
            <p className="text-secondary small mb-0">Contact Person: {po.supplier.contactName}</p>
            <p className="text-secondary small mb-0">Phone: {po.supplier.phone}</p>
            {po.supplier.email && <p className="text-secondary small mb-0">Email: {po.supplier.email}</p>}
            {po.supplier.address && <p className="text-secondary small mb-0">Address: {po.supplier.address}</p>}
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <span className="text-muted small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>PO Metadata</span>
            <div className="d-flex flex-column gap-1">
              <div><span className="text-muted small me-2">Date Created:</span> <span className="fw-semibold small">{new Date(po.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-muted small me-2">Created By:</span> <span className="fw-semibold small">{po.createdBy.name}</span></div>
              {po.receivedAt && (
                <div><span className="text-muted small me-2">Received Date:</span> <span className="fw-semibold small text-success">{new Date(po.receivedAt).toLocaleDateString()}</span></div>
              )}
              {po.receivedBy && (
                <div><span className="text-muted small me-2">Received By:</span> <span className="fw-semibold small text-success">{po.receivedBy.name}</span></div>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="table-responsive mb-4">
          <table className="table align-middle" style={{ fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th>Spare Part Description</th>
                <th className="text-center" style={{ width: "15%" }}>Qty Ordered</th>
                <th className="text-center" style={{ width: "15%" }}>Qty Received</th>
                <th className="text-end" style={{ width: "18%" }}>Unit Cost</th>
                <th className="text-end" style={{ width: "18%" }}>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div className="fw-semibold">{item.product.name}</div>
                    <div className="text-muted small" style={{ fontSize: "0.72rem" }}>SKU: {item.product.sku}</div>
                  </td>
                  <td className="text-center fw-semibold">{item.quantityOrdered}</td>
                  <td className="text-center">
                    {po.status === "RECEIVED" ? (
                      (() => {
                        const isFullyReceived = item.quantityReceived === item.quantityOrdered;
                        const isZeroReceived = item.quantityReceived === 0;
                        let badgeBg = "rgba(16,185,129,0.12)";
                        let badgeColor = "#10b981";
                        if (isZeroReceived) {
                          badgeBg = "rgba(239,68,68,0.12)";
                          badgeColor = "#fca5a5";
                        } else if (!isFullyReceived) {
                          badgeBg = "rgba(245,158,11,0.12)";
                          badgeColor = "#fcd34d";
                        }
                        return (
                          <div className="d-inline-flex flex-column align-items-center gap-1 p-1 px-2 rounded" style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}25` }}>
                            <span className="fw-bold" style={{ fontSize: "0.8rem" }}>{item.quantityReceived}</span>
                            <span className="fw-medium text-uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.3px", opacity: 0.8 }}>
                              {isFullyReceived ? "Full" : isZeroReceived ? "Shortage" : "Partial"}
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td className="text-end">{sym}{item.unitCost.toFixed(2)}</td>
                  <td className="text-end fw-semibold">{sym}{item.totalCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div className="row justify-content-end mb-4">
          <div className="col-12 col-md-5 col-lg-4">
            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Subtotal:</span>
                <span className="fw-semibold">{sym}{po.subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Estimated Tax (16%):</span>
                <span className="fw-semibold">{sym}{po.taxAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between pt-1">
                <span className="fw-bold h6 mb-0 text-success">Grand Total Cost:</span>
                <span className="fw-bold h6 mb-0 text-success">{sym}{po.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {}
        {po.notes && (
          <div className="p-3 rounded" style={{ background: "var(--hover-bg)", fontSize: "0.82rem" }}>
            <span className="fw-semibold text-muted d-block mb-1">Purchase Order Remarks:</span>
            <p className="mb-0 text-secondary">{po.notes}</p>
          </div>
        )}

        <hr className="my-4 border-light border-opacity-10" />

        {}
        <div className="text-center text-muted" style={{ fontSize: "0.75rem" }}>
          <p className="mb-1">This purchase order is an official stock replenishment request from NEETEL AUTOSPARES.</p>
          <p className="mb-0">Please check quantities and invoice details prior to shipment.</p>
        </div>
      </div>
      {}
      {receivingModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">Receive Stock Quantity</h5>
                <button type="button" className="btn-close" onClick={() => setReceivingModalOpen(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const payload = po.items.map((item: any) => {
                  const rqStr = receivedQtys[item.id] || "0";
                  const rq = parseInt(rqStr, 10);
                  return {
                    itemId: item.id,
                    receivedQty: isNaN(rq) || rq < 0 ? 0 : rq,
                  };
                });
                handleUpdateStatus("RECEIVED", payload);
              }}>
                <div className="modal-body py-3">
                  <p className="text-muted small">Specify the number of parts delivered in this batch. If items remain pending, the order status will stay active so you can record subsequent deliveries as they arrive.</p>
                  <div className="table-responsive">
                    <table className="table align-middle text-start" style={{ fontSize: "0.85rem" }}>
                      <thead>
                        <tr>
                          <th>Item / Spare Part</th>
                          <th className="text-center" style={{ width: "20%" }}>Ordered</th>
                          <th className="text-center" style={{ width: "20%" }}>Rec. So Far</th>
                          <th className="text-center" style={{ width: "25%" }}>This Delivery *</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.items.map((item: any) => {
                          const remaining = item.quantityOrdered - item.quantityReceived;
                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="fw-semibold">{item.product.name}</div>
                                <code className="text-muted small" style={{ fontSize: "0.7rem" }}>{item.product.sku}</code>
                              </td>
                              <td className="text-center fw-medium">{item.quantityOrdered} {item.product.unit}</td>
                              <td className="text-center text-muted">{item.quantityReceived}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={remaining}
                                  className="form-control text-center mx-auto"
                                  style={{ maxWidth: "120px" }}
                                  value={receivedQtys[item.id] || "0"}
                                  disabled={remaining <= 0}
                                  onChange={(e) => {
                                    setReceivedQtys({
                                      ...receivedQtys,
                                      [item.id]: e.target.value,
                                    });
                                  }}
                                  required
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setReceivingModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success text-white fw-semibold" disabled={loading}>
                    {loading ? "Receiving Stock..." : "Confirm & Receive"}
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
