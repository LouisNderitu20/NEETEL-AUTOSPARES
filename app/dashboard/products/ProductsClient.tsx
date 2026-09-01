"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

interface ProductsClientProps {
  initialProducts: any[];
  currencySymbol: string;
  canManage: boolean;
}

export default function ProductsClient({ initialProducts, currencySymbol, canManage }: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [newQty, setNewQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  
  const filteredProducts = products.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      (p.brand && p.brand.toLowerCase().includes(s)) ||
      p.category.name.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete the product permanently.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete product");
      }

      toast.success(`Product "${name}" deleted successfully.`);
      setProducts(products.filter((p) => p.id !== id));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 0) {
      toast.error("Please enter a valid non-negative quantity.");
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await fetch(`/api/products/${adjustingProduct.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newQuantity: qty,
          notes: adjustNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to adjust stock");
      }

      const updated = await res.json();
      toast.success(`Stock for "${adjustingProduct.name}" updated successfully!`);

      
      setProducts(products.map((p) => (p.id === updated.id ? { ...p, quantity: updated.quantity } : p)));
      setAdjustingProduct(null);
      setNewQty("");
      setAdjustNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Products & Spare Parts</h2>
          <p className="text-muted small mb-0">{products.length} products in inventory</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="search-wrapper d-block">
            <i className="bi bi-search"></i>
            <input
              type="search"
              className="search-input"
              placeholder="Search by name, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Link href="/dashboard/products/new" className="btn btn-primary btn-sm" id="add-product-btn">
              <i className="bi bi-plus-circle-fill me-1"></i> Add Product
            </Link>
          )}
        </div>
      </div>

      {}
      {products.filter((p) => p.quantity <= p.minStockLevel).length > 0 && (
        <div
          className="alert d-flex align-items-center gap-2 mb-4"
          style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}
        >
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>
            <strong>{products.filter((p) => p.quantity <= p.minStockLevel).length} items</strong> are at or below minimum stock level.
            <Link href="/dashboard/purchase-orders/new" className="ms-2" style={{ color: "#fca5a5", textDecoration: "underline" }}>
              Create Purchase Order
            </Link>
          </div>
        </div>
      )}

      {}
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>SKU / Part No.</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Stock</th>
                <th>Location</th>
                {canManage && <th className="text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8}>
                    <div className="text-center py-5">
                      <i className="bi bi-box-seam fs-1 text-muted d-block mb-2"></i>
                      <p className="text-muted mb-3">No products found matching filters.</p>
                      {canManage && search === "" && (
                        <Link href="/dashboard/products/new" className="btn btn-primary btn-sm">
                          Add First Product
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.quantity <= product.minStockLevel;
                  const isOut = product.quantity === 0;
                  return (
                    <tr key={product.id}>
                      <td>
                        <code
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--primary-light)",
                            background: "rgba(99,102,241,0.1)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {product.sku}
                        </code>
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-muted small text-truncate" style={{ fontSize: "0.7rem", maxWidth: "200px" }}>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>
                          {product.category.name}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>{product.brand || "—"}</td>
                      <td style={{ fontSize: "0.82rem" }}>{currencySymbol}{product.purchasePrice.toFixed(2)}</td>
                      <td>
                        <span className="fw-semibold" style={{ color: "var(--success)", fontSize: "0.875rem" }}>
                          {currencySymbol}{product.sellingPrice.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="fw-bold"
                            style={{
                              color: isOut ? "#ef4444" : isLow ? "#f59e0b" : "var(--text-primary)",
                              fontSize: "0.875rem",
                            }}
                          >
                            {product.quantity}
                          </span>
                          <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                            {product.unit}
                          </span>
                          {isOut && (
                            <span className="badge" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: "0.65rem" }}>
                              OUT
                            </span>
                          )}
                          {isLow && !isOut && (
                            <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.65rem" }}>
                              LOW
                            </span>
                          )}
                        </div>
                        <div className="progress mt-1" style={{ height: 3 }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${Math.min(100, (product.quantity / Math.max(product.minStockLevel * 2, 1)) * 100)}%`,
                              background: isOut ? "#ef4444" : isLow ? "#f59e0b" : "var(--primary)",
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {product.location || "—"}
                      </td>
                      {canManage && (
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <Link
                              href={`/dashboard/products/${product.id}/edit`}
                              className="btn btn-sm"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                              title="Edit Details"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", color: "#38bdf8" }}
                              title="Adjust Stock"
                              onClick={() => {
                                setAdjustingProduct(product);
                                setNewQty(product.quantity.toString());
                              }}
                            >
                              <i className="bi bi-arrow-left-right"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Delete Product"
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {adjustingProduct && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">Adjust Stock</h5>
                <button type="button" className="btn-close" onClick={() => setAdjustingProduct(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleAdjustStock}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <span className="text-muted d-block small">Product</span>
                    <strong className="fs-6">{adjustingProduct.name}</strong>
                    <span className="badge bg-secondary ms-2" style={{ fontSize: "0.7rem" }}>{adjustingProduct.sku}</span>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small text-muted mb-1">Current Stock</label>
                      <input className="form-control" value={`${adjustingProduct.quantity} ${adjustingProduct.unit}`} disabled />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted mb-1">New Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="0"
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small text-muted mb-1">Adjustment Notes *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Recount correction, damaged stock..."
                        value={adjustNotes}
                        onChange={(e) => setAdjustNotes(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setAdjustingProduct(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={adjustLoading}>
                    {adjustLoading ? "Saving..." : "Save Adjustment"}
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
