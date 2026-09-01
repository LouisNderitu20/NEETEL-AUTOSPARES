import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        jobCard: { select: { jobNumber: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.garageSettings.findFirst(),
  ]);

  const sym = settings?.currencySymbol || "$";

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING:  { bg: "#fef3c7", text: "#92400e" },
    PARTIAL:  { bg: "#dbeafe", text: "#1e40af" },
    PAID:     { bg: "#d1fae5", text: "#065f46" },
    REFUNDED: { bg: "#fee2e2", text: "#991b1b" },
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Invoices</h2>
          <p className="text-muted small mb-0">{invoices.length} invoices</p>
        </div>
        <Link href="/dashboard/pos" className="btn btn-primary btn-sm">
          <i className="bi bi-bag-fill me-1"></i>New Sale (POS)
        </Link>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Job</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><code style={{ color: "var(--primary-light)" }}>{inv.invoiceNumber}</code></td>
                  <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{inv.customer.name}</td>
                  <td><code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inv.jobCard?.jobNumber || "Walk-in"}</code></td>
                  <td className="fw-semibold">{sym}{inv.total.toFixed(2)}</td>
                  <td style={{ color: "#10b981", fontWeight: 600 }}>{sym}{inv.amountPaid.toFixed(2)}</td>
                  <td style={{ color: inv.balance > 0 ? "#f59e0b" : "var(--text-muted)", fontWeight: inv.balance > 0 ? 600 : 400 }}>
                    {sym}{inv.balance.toFixed(2)}
                  </td>
                  <td>
                    <span className="badge" style={{ background: (statusColors[inv.paymentStatus] || { bg: "#f1f5f9" }).bg, color: (statusColors[inv.paymentStatus] || { text: "#475569" }).text, fontSize: "0.72rem" }}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="btn btn-sm btn-outline-primary">View</Link>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted py-5">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
