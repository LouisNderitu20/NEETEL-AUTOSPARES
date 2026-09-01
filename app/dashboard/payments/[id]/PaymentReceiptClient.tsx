"use client";

import Link from "next/link";

interface PaymentReceiptClientProps {
  payment: any;
  currencySymbol: string;
}

const methodInfo: Record<string, { icon: string; label: string; color: string }> = {
  MOBILE_MONEY: { icon: "bi-phone", label: "M-Pesa / Mobile Money", color: "#43a047" },
  CASH: { icon: "bi-cash-stack", label: "Cash", color: "#ef6c00" },
  CARD: { icon: "bi-credit-card", label: "Card Payment", color: "#1565c0" },
  BANK_TRANSFER: { icon: "bi-bank", label: "Bank Transfer", color: "#6a1b9a" },
  PARTIAL: { icon: "bi-pie-chart", label: "Partial Payment", color: "#f9a825" },
  DEPOSIT: { icon: "bi-safe", label: "Deposit", color: "#00838f" },
  CREDIT: { icon: "bi-clock-history", label: "Credit", color: "#c62828" },
};

const getMethod = (m: string) =>
  methodInfo[m] || { icon: "bi-wallet2", label: m.replace("_", " "), color: "#757575" };

export default function PaymentReceiptClient({
  payment,
  currencySymbol: sym,
}: PaymentReceiptClientProps) {
  const inv = payment.invoice;
  const method = getMethod(payment.method);
  const balanceAfter = inv.balance;
  const isPaidInFull = balanceAfter <= 0;

  return (
    <div className="animate-fade-up print-container">
      {}
      <div className="card mb-4 print-hide">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-3">
          <div className="d-flex align-items-center gap-2">
            <Link
              href="/dashboard/payments"
              className="btn btn-sm btn-outline-secondary py-1 px-2"
              style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
            >
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0">Payment Receipt</h4>
                <span
                  className="badge fw-semibold"
                  style={{
                    background: isPaidInFull ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: isPaidInFull ? "#059669" : "#d97706",
                    fontSize: "0.72rem",
                  }}
                >
                  {isPaidInFull ? "PAID IN FULL" : "PARTIAL PAYMENT"}
                </span>
              </div>
              <span className="text-muted small">
                Processed on {new Date(payment.processedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link
              href={`/dashboard/invoices/${inv.id}`}
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="bi bi-file-earmark-text me-1"></i>View Invoice
            </Link>
            <button onClick={() => window.print()} className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-printer me-1"></i>Print Receipt
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="d-none d-print-block mb-4">
        <div
          className="d-flex align-items-center justify-content-between pb-3"
          style={{ borderBottom: "3px solid #c5a059" }}
        >
          <div className="d-flex align-items-center gap-3">
            <img
              src="/logo.jpg"
              alt="NEETEL AUTOSPARES Logo"
              style={{ height: "65px", width: "65px", objectFit: "cover", borderRadius: "8px", border: "1px solid #c5a059" }}
            />
            <div>
              <h3 className="h5 fw-bold mb-1" style={{ color: "#0f1013", letterSpacing: "0.5px" }}>
                NEETEL AUTOSPARES
              </h3>
              <p className="small text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                Garages, Diagnostics &amp; Premium Auto Spare Parts Specialist
              </p>
              <p className="small text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                Kirinyaga Road, Nairobi, Kenya | Phone: +254 700 000 000 | PIN: P051682736C
              </p>
            </div>
          </div>
          <div className="text-end">
            <h4 className="fw-bold mb-1" style={{ color: "#c5a059", fontSize: "1.2rem" }}>
              PAYMENT RECEIPT
            </h4>
            <div className="small text-muted" style={{ fontSize: "0.78rem" }}>
              <div>
                <strong>Invoice:</strong> {inv.invoiceNumber}
              </div>
              <div>
                <strong>Date:</strong> {new Date(payment.processedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="card p-4">
        {}
        <div className="row g-4 mb-4 pt-2">
          <div className="col-12 col-md-6">
            <span
              className="text-muted small d-block mb-1 text-uppercase fw-bold"
              style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
            >
              Received From
            </span>
            <h5 className="fw-bold mb-1">{inv.customer.name}</h5>
            {inv.customer.company && (
              <p className="text-secondary small mb-0">{inv.customer.company}</p>
            )}
            <p className="text-secondary small mb-0">{inv.customer.phone}</p>
            {inv.customer.email && (
              <p className="text-secondary small mb-0">{inv.customer.email}</p>
            )}
            {inv.jobCard?.vehicle && (
              <p className="text-secondary small mb-0 mt-1">
                Vehicle:{" "}
                <strong>
                  {inv.jobCard.vehicle.make} {inv.jobCard.vehicle.model}
                </strong>{" "}
                — {inv.jobCard.vehicle.licensePlate}
              </p>
            )}
          </div>

          <div className="col-12 col-md-6 text-md-end">
            <span
              className="text-muted small d-block mb-1 text-uppercase fw-bold"
              style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
            >
              Payment Details
            </span>
            <div className="d-flex flex-column gap-1" style={{ fontSize: "0.875rem" }}>
              <div>
                <span className="text-muted small me-2">Invoice No:</span>
                <code style={{ color: "var(--primary-light)", fontWeight: 600 }}>
                  {inv.invoiceNumber}
                </code>
              </div>
              {inv.jobCard && (
                <div>
                  <span className="text-muted small me-2">Job Card:</span>
                  <code style={{ color: "var(--primary-light)", fontWeight: 600 }}>
                    {inv.jobCard.jobNumber}
                  </code>
                </div>
              )}
              <div>
                <span className="text-muted small me-2">Payment Date:</span>
                <span className="fw-semibold small">
                  {new Date(payment.processedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted small me-2">Payment Time:</span>
                <span className="fw-semibold small">
                  {new Date(payment.processedAt).toLocaleTimeString()}
                </span>
              </div>
              {payment.reference && (
                <div>
                  <span className="text-muted small me-2">Reference:</span>
                  <span className="fw-semibold small">{payment.reference}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <div
          className="d-flex align-items-center gap-3 p-3 mb-4"
          style={{
            background: `${method.color}12`,
            border: `1px solid ${method.color}30`,
            borderRadius: "4px",
          }}
        >
          <i
            className={`bi ${method.icon} fs-4`}
            style={{ color: method.color }}
          ></i>
          <div>
            <div className="fw-bold" style={{ color: method.color }}>
              {method.label}
            </div>
            <div className="text-muted small">Payment Method</div>
          </div>
          <div className="ms-auto text-end">
            <div
              className="fw-bold"
              style={{ fontSize: "1.5rem", color: method.color }}
            >
              {sym}{payment.amount.toFixed(2)}
            </div>
            <div className="text-muted small">Amount Received</div>
          </div>
        </div>

        {}
        <div className="table-responsive mb-4">
          <table className="table align-middle" style={{ fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center" style={{ width: "10%" }}>Qty</th>
                <th className="text-end" style={{ width: "18%" }}>Unit Price</th>
                <th className="text-end" style={{ width: "18%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
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
          <div className="col-12 col-md-5 col-lg-4">
            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Invoice Subtotal:</span>
                <span className="fw-semibold">{sym}{inv.subtotal.toFixed(2)}</span>
              </div>
              {inv.taxAmount > 0 && (
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Tax (16% VAT):</span>
                  <span className="fw-semibold">{sym}{inv.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {inv.discountAmount > 0 && (
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Discount:</span>
                  <span className="fw-semibold text-danger">-{sym}{inv.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Invoice Total:</span>
                <span className="fw-bold">{sym}{inv.total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Previously Paid:</span>
                <span className="fw-semibold text-success">
                  {sym}{(inv.amountPaid - payment.amount).toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="fw-bold" style={{ color: "var(--primary-light)" }}>
                  This Payment:
                </span>
                <span className="fw-bold" style={{ color: "var(--primary-light)" }}>
                  {sym}{payment.amount.toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between pt-1">
                <span className={`fw-bold h6 mb-0 ${isPaidInFull ? "text-success" : "text-warning"}`}>
                  {isPaidInFull ? "Balance: CLEARED" : "Outstanding Balance:"}
                </span>
                <span className={`fw-bold h6 mb-0 ${isPaidInFull ? "text-success" : "text-warning"}`}>
                  {isPaidInFull ? "PAID" : `${sym}${balanceAfter.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {}
        {payment.notes && (
          <div
            className="p-3"
            style={{ background: "var(--hover-bg)", fontSize: "0.82rem", borderRadius: "4px" }}
          >
            <span className="fw-semibold text-muted d-block mb-1">Cashier Notes:</span>
            <p className="mb-0 text-secondary">{payment.notes}</p>
          </div>
        )}

        <hr className="my-4 border-light border-opacity-10" />

        {}
        <div className="text-center text-muted" style={{ fontSize: "0.75rem" }}>
          <p className="mb-1">
            Thank you for your payment. This is an official receipt from NEETEL AUTOSPARES.
          </p>
          <p className="mb-0">
            Please retain this document for your records. For queries, contact us at +254 700 000 000.
          </p>
        </div>
      </div>
    </div>
  );
}
