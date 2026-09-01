"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface QuotationDetailClientProps {
  quotation: any;
  currencySymbol: string;
}

export default function QuotationDetailClient({
  quotation,
  currencySymbol: sym,
}: QuotationDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update quotation status");
      }

      toast.success(`Quotation ${newStatus.toLowerCase()} successfully!`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-up print-container">
      {}
      <div className="card mb-4 print-hide">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-3">
          <div className="d-flex align-items-center gap-2">
            <Link href="/dashboard/quotations" className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0">{quotation.quoteNumber}</h4>
                <span
                  className="badge"
                  style={{
                    background: quotation.status === "APPROVED" ? "#d1fae5" : quotation.status === "REJECTED" ? "#fee2e2" : quotation.status === "EXPIRED" ? "#f1f5f9" : "#fef3c7",
                    color:      quotation.status === "APPROVED" ? "#065f46" : quotation.status === "REJECTED" ? "#991b1b" : quotation.status === "EXPIRED" ? "#475569" : "#92400e",
                    fontSize: "0.72rem",
                  }}
                >
                  {quotation.status}
                </span>
              </div>
              <span className="text-muted small">Generated on {new Date(quotation.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button onClick={handlePrint} className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-printer me-1"></i>Print Quote
            </button>
            {quotation.status === "PENDING" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={loading}
                  className="btn btn-sm btn-outline-danger"
                >
                  <i className="bi bi-x-lg me-1"></i>Reject Quote
                </button>
                <button
                  onClick={() => handleUpdateStatus("APPROVED")}
                  disabled={loading}
                  className="btn btn-sm btn-success text-white"
                >
                  <i className="bi bi-check-lg me-1"></i>Approve Quote
                </button>
              </>
            )}
            {quotation.jobCardId && (
              <Link href={`/dashboard/job-cards/${quotation.jobCardId}`} className="btn btn-sm btn-primary">
                <i className="bi bi-wrench-adjustable me-1"></i>View Linked Job Card
              </Link>
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
            <h4 className="fw-bold mb-1" style={{ color: "#c5a059", fontSize: "1.2rem" }}>PROFORMA QUOTATION</h4>
            <div className="small text-muted" style={{ fontSize: "0.78rem" }}>
              <div><strong>No:</strong> {quotation.quoteNumber}</div>
              <div><strong>Date:</strong> {new Date(quotation.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="card p-4">
        {}
        <div className="row g-4 mb-4 pt-2">
          <div className="col-12 col-md-6">
            <span className="text-muted small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Quotation Client</span>
            <h5 className="fw-bold mb-1">{quotation.customer.name}</h5>
            <p className="text-secondary small mb-0">Phone: {quotation.customer.phone}</p>
            {quotation.customer.email && <p className="text-secondary small mb-0">Email: {quotation.customer.email}</p>}
            {quotation.customer.company && <p className="text-secondary small mb-0">Company: {quotation.customer.company}</p>}
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <span className="text-muted small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Quotation Metadata</span>
            <div className="d-flex flex-column gap-1">
              <div><span className="text-muted small me-2">Date Generated:</span> <span className="fw-semibold small">{new Date(quotation.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-muted small me-2">Validity:</span> <span className="fw-semibold small">30 Days</span></div>
              <div><span className="text-muted small me-2">Tax Rate:</span> <span className="fw-semibold small">16.0% VAT Included</span></div>
            </div>
          </div>
        </div>

        {}
        <div className="table-responsive mb-4">
          <table className="table align-middle" style={{ fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center" style={{ width: "10%" }}>Qty</th>
                <th className="text-end" style={{ width: "20%" }}>Unit Price</th>
                <th className="text-end" style={{ width: "20%" }}>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const quoteItems: any[] = [];
                if (quotation.jobCard) {
                  quotation.jobCard.items.forEach((item: any) => {
                    quoteItems.push({
                      id: item.id,
                      description: `Part: ${item.product.name} (${item.product.sku})`,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      totalPrice: item.totalPrice,
                    });
                  });
                  quotation.jobCard.services.forEach((s: any) => {
                    quoteItems.push({
                      id: s.id,
                      description: `Labor: ${s.service.name}`,
                      quantity: s.hours,
                      unitPrice: s.rate,
                      totalPrice: s.totalPrice,
                    });
                  });
                  if (quotation.jobCard.laborRate > 0) {
                    quoteItems.push({
                      id: "labor-rate",
                      description: "General Diagnostics & Labor",
                      quantity: 1,
                      unitPrice: quotation.jobCard.laborRate,
                      totalPrice: quotation.jobCard.laborRate,
                    });
                  }
                }
                
                if (quoteItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">No spare parts or services associated with this quotation.</td>
                    </tr>
                  );
                }

                return quoteItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="fw-medium">{item.description}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">{sym}{item.unitPrice.toFixed(2)}</td>
                    <td className="text-end fw-semibold">{sym}{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {}
        <div className="row justify-content-end mb-4">
          <div className="col-12 col-md-5 col-lg-4">
            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Subtotal:</span>
                <span className="fw-semibold">{sym}{quotation.subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">VAT (16%):</span>
                <span className="fw-semibold">{sym}{quotation.taxAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between pt-1">
                <span className="fw-bold h6 mb-0 text-success">Grand Total:</span>
                <span className="fw-bold h6 mb-0 text-success">{sym}{quotation.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {}
        {quotation.notes && (
          <div className="p-3 rounded" style={{ background: "var(--hover-bg)", fontSize: "0.82rem" }}>
            <span className="fw-semibold text-muted d-block mb-1">Quotation Notes & Instructions:</span>
            <p className="mb-0 text-secondary">{quotation.notes}</p>
          </div>
        )}

        <hr className="my-4 border-light border-opacity-10" />

        {}
        <div className="text-center text-muted" style={{ fontSize: "0.75rem" }}>
          <p className="mb-1">Thank you for choosing NEETEL AUTOSPARES for your auto spare and service needs.</p>
          <p className="mb-0">This is an official proforma quotation valid for 30 days from date of issue.</p>
        </div>
      </div>
    </div>
  );
}
