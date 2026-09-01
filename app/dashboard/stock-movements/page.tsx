import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Stock Movements" };

export default async function StockMovementsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
    },
  });

  const typeColors: Record<string, { bg: string; text: string }> = {
    PURCHASE:   { bg: "#d1fae5", text: "#065f46" },
    SALE:       { bg: "#fee2e2", text: "#991b1b" },
    JOB_USAGE:  { bg: "#fef3c7", text: "#92400e" },
    ADJUSTMENT: { bg: "#cffafe", text: "#164e63" },
    RETURN:     { bg: "#ede9fe", text: "#4c1d95" },
    TRANSFER:   { bg: "#f1f5f9", text: "#475569" },
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <h2 className="h5 fw-bold mb-0">Stock Movements</h2>
        <p className="text-muted small mb-0">Inventory audit trail — last 100 entries</p>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>Date</th><th>Product</th><th>Type</th><th>Qty Change</th><th>Before</th><th>After</th><th>Reference</th><th>By</th></tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{m.product.name}</div>
                    <code style={{ fontSize: "0.7rem", color: "var(--primary-light)" }}>{m.product.sku}</code>
                  </td>
                  <td>
                    <span className="badge" style={{ background: (typeColors[m.type] || { bg: "#f1f5f9" }).bg, color: (typeColors[m.type] || { text: "#475569" }).text, fontSize: "0.68rem" }}>
                      {m.type.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <span className="fw-bold" style={{ color: m.quantity > 0 ? "#10b981" : "#ef4444" }}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>{m.balanceBefore}</td>
                  <td style={{ fontSize: "0.82rem", fontWeight: 600 }}>{m.balanceAfter}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.reference || "—"}</td>
                  <td style={{ fontSize: "0.78rem" }}>{m.user.name}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted py-5">No stock movements recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
