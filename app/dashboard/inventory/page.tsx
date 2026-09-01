import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Inventory Dashboard" };

export default async function InventoryDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const [total, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { quantity: 0 } }),
  ]);

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
  });

  const lowStock = products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0).length;
  const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
  const lowItems = products
    .filter((p) => p.quantity <= p.minStockLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  return (
    <div className="animate-fade-up">
      <div className="row g-3 mb-4">
        {[
          { label: "Total Products", value: total, icon: "bi-box-seam", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
          { label: "Low Stock", value: lowStock, icon: "bi-exclamation-triangle-fill", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
          { label: "Out of Stock", value: outOfStock, icon: "bi-x-circle-fill", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
          { label: "Total Units", value: totalUnits.toLocaleString(), icon: "bi-boxes", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
        ].map((s, i) => (
          <div key={i} className={`col-6 col-lg-3 animate-fade-up delay-${i + 1}`}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}><i className={`bi ${s.icon}`}></i></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-4">
        <Link href="/dashboard/products/new" className="btn btn-primary">
          <i className="bi bi-plus-circle-fill me-1"></i>Add Product
        </Link>
        <Link href="/dashboard/purchase-orders/new" className="btn btn-outline-primary">
          <i className="bi bi-bag-plus me-1"></i>New Purchase Order
        </Link>
      </div>

      <div className="card">
        <div className="card-header fw-semibold" style={{ color: "#fbbf24" }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>Low Stock Alert
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>SKU</th><th>Product</th><th>Category</th><th>Qty</th><th>Min Level</th><th>Action</th></tr>
            </thead>
            <tbody>
              {lowItems.map((p) => (
                <tr key={p.id}>
                  <td><code style={{ color: "var(--primary-light)", fontSize: "0.78rem" }}>{p.sku}</code></td>
                  <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{p.name}</td>
                  <td><span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{p.category.name}</span></td>
                  <td><span className="fw-bold" style={{ color: p.quantity === 0 ? "#ef4444" : "#f59e0b" }}>{p.quantity}</span></td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{p.minStockLevel}</td>
                  <td>
                    <Link
                      href={`/dashboard/purchase-orders/new?productId=${p.id}`}
                      className="btn btn-sm"
                      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "0.75rem" }}
                    >
                      Restock
                    </Link>
                  </td>
                </tr>
              ))}
              {lowItems.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-4">All items are well stocked!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
