import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Quotations" };

export default async function QuotationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [quotes, settings] = await Promise.all([
    prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        jobCard: { select: { jobNumber: true, vehicle: { select: { make: true, model: true } } } },
      },
    }),
    prisma.garageSettings.findFirst(),
  ]);

  const sym = settings?.currencySymbol || "KSh";

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING:  { bg: "#fef3c7", text: "#92400e" },
    APPROVED: { bg: "#d1fae5", text: "#065f46" },
    REJECTED: { bg: "#fee2e2", text: "#991b1b" },
    EXPIRED:  { bg: "#f1f5f9", text: "#475569" },
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Quotations</h2>
          <p className="text-muted small mb-0">{quotes.length} quotations</p>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>Quote #</th><th>Customer</th><th>Job Card</th><th>Total</th><th>Status</th><th>Valid Until</th><th></th></tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td><code style={{ color: "var(--primary-light)" }}>{q.quoteNumber}</code></td>
                  <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{q.customer.name}</td>
                  <td><code style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{q.jobCard.jobNumber}</code></td>
                  <td className="fw-semibold">{sym}{q.total.toFixed(2)}</td>
                  <td>
                    <span className="badge" style={{ background: (statusColors[q.status] || { bg: "#f1f5f9" }).bg, color: (statusColors[q.status] || { text: "#475569" }).text, fontSize: "0.72rem" }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "—"}
                  </td>
                  <td><Link href={`/dashboard/quotations/${q.id}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-5">No quotations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
