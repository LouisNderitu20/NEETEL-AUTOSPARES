"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface InvoiceDetailClientProps {
  invoice: any;
  currencySymbol: string;
  currentUserRole: string;
}

export default function InvoiceDetailClient({
  invoice,
  currencySymbol: sym,
  currentUserRole,
}: InvoiceDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [payAmount, setPayAmount] = useState(
    invoice.balance != null ? String(invoice.balance) : ""
  );
  const [payMethod, setPayMethod] = useState("MOBILE_MONEY");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const router = useRouter();

  
  const paymentMethodInfo = (method: string) => {
    switch (method) {
      case "MOBILE_MONEY":
        return { icon: "bi-phone", label: "M-Pesa", color: "#43a047" };
      case "CASH":
        return { icon: "bi-cash-stack", label: "Cash", color: "#ef6c00" };
      case "CARD":
        return { icon: "bi-credit-card", label: "Card", color: "#1565c0" };
      case "BANK_TRANSFER":
        return { icon: "bi-bank", label: "Bank Transfer", color: "#6a1b9a" };
      case "PARTIAL":
        return { icon: "bi-pie-chart", label: "Partial", color: "#f9a825" };
      case "DEPOSIT":
        return { icon: "bi-safe", label: "Deposit", color: "#00838f" };
      case "CREDIT":
        return { icon: "bi-clock-history", label: "Credit", color: "#c62828" };
      default:
        return { icon: "bi-wallet2", label: method, color: "#757575" };
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(payAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }

    if (amt > invoice.balance + 0.01) {
      toast.error(`Payment exceeds remaining balance of ${sym}${invoice.balance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          method: payMethod,
          amount: amt,
          reference: payRef,
          notes: payNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }

      toast.success("Payment recorded successfully!");
      setPayRef("");
      setPayNotes("");
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
            <Link href="/dashboard/invoices" className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0">{invoice.invoiceNumber}</h4>
                <span
                  className="badge"
                  style={{
                    background: invoice.paymentStatus === "PAID" ? "#d1fae5" : invoice.paymentStatus === "PARTIAL" ? "#fef3c7" : invoice.paymentStatus === "REFUNDED" ? "#f1f5f9" : "#fee2e2",
                    color:      invoice.paymentStatus === "PAID" ? "#065f46" : invoice.paymentStatus === "PARTIAL" ? "#92400e" : invoice.paymentStatus === "REFUNDED" ? "#475569" : "#991b1b",
                    fontSize: "0.72rem",
                  }}
                >
                  {invoice.paymentStatus}
                </span>
              </div>
              <span className="text-muted small">Generated on {new Date(invoice.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button onClick={handlePrint} className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-printer me-1"></i>Print Receipt
            </button>
            {invoice.jobCardId && (
              <Link href={`/dashboard/job-cards/${invoice.jobCardId}`} className="btn btn-sm btn-primary">
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
            <h4 className="fw-bold mb-1" style={{ color: "#c5a059", fontSize: "1.2rem" }}>TAX INVOICE / RECEIPT</h4>
            <div className="small text-muted" style={{ fontSize: "0.78rem" }}>
              <div><strong>No:</strong> {invoice.invoiceNumber}</div>
              <div><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12 col-lg-8 d-flex flex-column gap-4">
          {}
          <div className="card p-4">
            <div className="row g-4 mb-4 pt-2">
              <div className="col-12 col-md-6">
                <span className="text-muted small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Bill To Customer</span>
                <h5 className="fw-bold mb-1">{invoice.customer.name}</h5>
                <p className="text-secondary small mb-0">Phone: {invoice.customer.phone}</p>
                {invoice.customer.email && <p className="text-secondary small mb-0">Email: {invoice.customer.email}</p>}
                {invoice.customer.company && <p className="text-secondary small mb-0">Company: {invoice.customer.company}</p>}
              </div>
              <div className="col-12 col-md-6 text-md-end">
                <span className="text-muted small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Invoice Details</span>
                <div className="d-flex flex-column gap-1">
                  <div><span className="text-muted small me-2">Date Generated:</span> <span className="fw-semibold small">{new Date(invoice.createdAt).toLocaleDateString()}</span></div>
                  <div><span className="text-muted small me-2">Due Date:</span> <span className="fw-semibold small">Immediate</span></div>
                  <div><span className="text-muted small me-2">Tax Rate:</span> <span className="fw-semibold small">16% VAT Included</span></div>
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
                  {invoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="fw-medium">{item.description}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{sym}{item.unitPrice.toFixed(2)}</td>
                      <td className="text-end fw-semibold">{sym}{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {}
            <div className="row justify-content-end mb-4">
              <div className="col-12 col-md-6 col-lg-5">
                <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Subtotal:</span>
                    <span className="fw-semibold">{sym}{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">VAT (16%):</span>
                    <span className="fw-semibold">{sym}{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="d-flex justify-content-between border-bottom pb-2 text-danger">
                      <span className="text-danger">Discount Applied:</span>
                      <span className="fw-semibold">-{sym}{invoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between pt-1 border-bottom pb-2">
                    <span className="fw-bold text-success">Grand Total:</span>
                    <span className="fw-bold text-success">{sym}{invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-1 border-bottom pb-2 text-info">
                    <span className="fw-medium">Total Paid:</span>
                    <span className="fw-semibold">{sym}{invoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-1">
                    <span className="fw-bold text-warning">Remaining Balance:</span>
                    <span className="fw-bold text-warning">{sym}{invoice.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            {invoice.notes && (
              <div className="p-3 rounded" style={{ background: "var(--hover-bg)", fontSize: "0.82rem" }}>
                <span className="fw-semibold text-muted d-block mb-1">Invoice Notes:</span>
                <p className="mb-0 text-secondary">{invoice.notes}</p>
              </div>
            )}

            <hr className="my-4 border-light border-opacity-10" />

            {}
            <div className="text-center text-muted" style={{ fontSize: "0.75rem" }}>
              <p className="mb-1">Thank you for doing business with NEETEL AUTOSPARES.</p>
              <p className="mb-0">All parts and labor carry a 14-day warranty unless stated otherwise.</p>
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header fw-bold">Payments History</div>
            <div className="table-responsive">
              <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Reference Code</th>
                    <th>Notes</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td>{new Date(p.processedAt).toLocaleString()}</td>
                      <td>
                        {(() => {
                          const info = paymentMethodInfo(p.method);
                          return (
                            <span
                              className="badge d-inline-flex align-items-center gap-1"
                              style={{ fontSize: "0.72rem", backgroundColor: info.color, color: "#fff" }}
                            >
                              <i className={`bi ${info.icon}`}></i>
                              {info.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td><code>{p.reference || "—"}</code></td>
                      <td className="text-muted small">{p.notes || "—"}</td>
                      <td className="text-end fw-semibold text-success">+{sym}{p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {invoice.payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">No payments recorded for this invoice yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        {invoice.balance >= 0.01 && ["OWNER", "MANAGER", "CASHIER"].includes(currentUserRole) && (
          <div className="col-12 col-lg-4 print-hide animate-fade-up">
            <div className="card shadow-sm h-100">
              <div className="card-header fw-bold text-warning">
                <i className="bi bi-wallet2 me-2"></i>Record Invoice Payment
              </div>
              <div className="card-body">
                <form onSubmit={handlePayment}>
                  {}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="payment-amount">Payment Amount ({sym}) *</label>
                    <input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={invoice.balance}
                      className="form-control"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                  </div>

                  {}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="payment-method">Payment Method *</label>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{
                          width: "38px",
                          height: "38px",
                          backgroundColor: paymentMethodInfo(payMethod).color,
                          color: "#fff",
                          fontSize: "1.1rem",
                          flexShrink: 0,
                        }}
                      >
                        <i className={`bi ${paymentMethodInfo(payMethod).icon}`}></i>
                      </span>
                      <select
                        id="payment-method"
                        className="form-select"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        required
                      >
                        <option value="MOBILE_MONEY">📱 M-Pesa (Mobile Money)</option>
                        <option value="CASH">💵 Cash</option>
                        <option value="CARD">💳 Credit/Debit Card</option>
                        <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  {}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="payment-reference">Transaction Reference (e.g. M-Pesa Code)</label>
                    <input
                      id="payment-reference"
                      className="form-control text-uppercase"
                      placeholder="M-Pesa code or Cheque #"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                    />
                  </div>

                  {}
                  <div className="mb-4">
                    <label className="form-label small fw-semibold" htmlFor="payment-notes">Internal Notes</label>
                    <textarea
                      id="payment-notes"
                      className="form-control"
                      rows={2}
                      placeholder="Payment comments or cashier logs..."
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-warning w-100 fw-bold">
                    {loading ? "Recording Payment..." : "Record Payment Receipt"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
