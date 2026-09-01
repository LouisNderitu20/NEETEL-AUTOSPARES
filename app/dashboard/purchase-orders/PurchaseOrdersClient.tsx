"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface PurchaseOrdersClientProps {
  initialPos: any[];
  currencySymbol: string;
  canDelete: boolean;
}

export default function PurchaseOrdersClient({ initialPos, currencySymbol: sym, canDelete }: PurchaseOrdersClientProps) {
  const router = useRouter();
  const [pos, setPos] = useState(initialPos);
  const [search, setSearch] = useState("");

  const statusColors: Record<string, { bg: string; text: string }> = {
    DRAFT:     { bg: "#f1f5f9", text: "#475569" },
    SENT:      { bg: "#dbeafe", text: "#1e40af" },
    RECEIVED:  { bg: "#d1fae5", text: "#065f46" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
  };

  const filteredPos = pos.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.poNumber.toLowerCase().includes(s) ||
      p.supplier.name.toLowerCase().includes(s) ||
      p.status.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: string, poNumber: string) => {
    if (!confirm(`Are you sure you want to delete Purchase Order "${poNumber}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete purchase order");
      }

      toast.success(`Purchase Order "${poNumber}" deleted successfully.`);
      setPos(pos.filter((p) => p.id !== id));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Purchase Orders</h2>
          <p className="text-muted small mb-0">{pos.length} purchase orders</p>
        </div>
        <div className="d-flex gap-2">
          <div className="search-wrapper d-block">
            <i className="bi bi-search"></i>
            <input
              type="search"
              className="search-input"
              placeholder="Search by PO# or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/purchase-orders/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-circle-fill me-1"></i>New PO
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPos.map((p) => (
                <tr key={p.id}>
                  <td><code style={{ color: "var(--primary-light)" }}>{p.poNumber}</code></td>
                  <td style={{ fontSize: "0.875rem", fontWeight: 600 }}>{p.supplier.name}</td>
                  <td>
                    <span className="badge" style={{ background: (statusColors[p.status] || { bg: "#f1f5f9" }).bg, color: (statusColors[p.status] || { text: "#475569" }).text, fontSize: "0.72rem" }}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p._count.items} items</td>
                  <td className="fw-semibold">{sym}{p.total.toFixed(2)}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-1">
                      <Link href={`/dashboard/purchase-orders/${p.id}`} className="btn btn-sm btn-outline-primary">
                        View
                      </Link>
                      {canDelete && p.status !== "RECEIVED" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete PO"
                          onClick={() => handleDelete(p.id, p.poNumber)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPos.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-5">No purchase orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
