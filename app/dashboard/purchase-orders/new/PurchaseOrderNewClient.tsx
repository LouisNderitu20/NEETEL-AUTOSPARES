"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface PurchaseOrderNewClientProps {
  suppliers: any[];
  products: any[];
  currencySymbol: string;
}

export default function PurchaseOrderNewClient({
  suppliers,
  products,
  currencySymbol: sym,
}: PurchaseOrderNewClientProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);

  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("0.00");

  const router = useRouter();

  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    
    if (items.some((item) => item.productId === selectedProductId)) {
      toast.error("Product already added to list. Edit its quantity instead.");
      return;
    }

    const q = parseInt(qty, 10);
    const cost = parseFloat(unitCost);

    if (isNaN(q) || q <= 0) {
      toast.error("Quantity must be a positive integer");
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast.error("Unit cost cannot be negative");
      return;
    }

    setItems([
      ...items,
      {
        productId: selectedProductId,
        name: prod.name,
        sku: prod.sku,
        quantityOrdered: q,
        unitCost: Math.round(cost * 100) / 100,
      },
    ]);

    setSelectedProductId("");
    setQty("1");
    setUnitCost("0.00");
  };

  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  
  const handleSubmitPO = async () => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          items: items.map((i) => ({
            productId: i.productId,
            quantityOrdered: i.quantityOrdered,
            unitCost: i.unitCost,
          })),
          notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create purchase order");
      }

      const po = await res.json();
      toast.success(`Purchase Order ${po.poNumber} created successfully!`);
      router.push(`/dashboard/purchase-orders/${po.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const grandSubtotal = items.reduce((sum, i) => sum + i.quantityOrdered * i.unitCost, 0);
  const grandTax = grandSubtotal * 0.16;
  const grandTotal = grandSubtotal + grandTax;

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link
          href="/dashboard/purchase-orders"
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">New Purchase Order</h2>
          <p className="text-muted small mb-0">Replenish inventory stock from registered suppliers</p>
        </div>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          <div className="card">
            <div className="card-header fw-bold">Supplier & Metadata</div>
            <div className="card-body">
              {}
              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="supplier-select">Select Supplier *</label>
                <select
                  id="supplier-select"
                  className="form-select"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactName})
                    </option>
                  ))}
                </select>
              </div>

              {}
              <div className="mb-0">
                <label className="form-label small fw-semibold" htmlFor="po-notes">Remarks / Comments</label>
                <textarea
                  id="po-notes"
                  className="form-control"
                  rows={2}
                  placeholder="Delivery terms, partial receipt rules, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header fw-bold">Add Spare Part to Order</div>
            <div className="card-body">
              <form onSubmit={handleAddItem}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="po-product-select">Select Spare Part *</label>
                  <select
                    id="po-product-select"
                    className="form-select"
                     value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) setUnitCost(prod.purchasePrice != null ? prod.purchasePrice.toString() : "0.00");
                    }}
                    required
                  >
                    <option value="">-- Choose Part --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) [Stock: {p.quantity}]
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold" htmlFor="po-qty">Order Qty *</label>
                    <input
                      id="po-qty"
                      type="number"
                      min="1"
                      className="form-control"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold" htmlFor="po-cost">Unit Cost ({sym}) *</label>
                    <input
                      id="po-cost"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-outline-primary w-100 fw-semibold">
                  Add Item to List
                </button>
              </form>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-7 d-flex flex-column gap-4">
          <div className="card flex-grow-1">
            <div className="card-header fw-bold">Purchase Order Items</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Order Qty</th>
                      <th className="text-end">Unit Cost</th>
                      <th className="text-end">Total Cost</th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fw-semibold">{item.name}</div>
                          <div className="text-muted small" style={{ fontSize: "0.72rem" }}>SKU: {item.sku}</div>
                        </td>
                        <td className="text-center fw-semibold">{item.quantityOrdered}</td>
                        <td className="text-end">{sym}{item.unitCost.toFixed(2)}</td>
                        <td className="text-end fw-semibold">{sym}{(item.quantityOrdered * item.unitCost).toFixed(2)}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">
                          <i className="bi bi-cart-plus fs-2 text-muted d-block mb-2"></i>
                          Add spare parts from the panel on the left to begin compiling this purchase order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {}
            {items.length > 0 && (
              <div className="card-footer p-3">
                <div className="d-flex flex-column align-items-end gap-2" style={{ fontSize: "0.85rem" }}>
                  <div><span className="text-muted me-2">Subtotal:</span> <span className="fw-semibold">{sym}{grandSubtotal.toFixed(2)}</span></div>
                  <div><span className="text-muted me-2">Estimated VAT (16%):</span> <span className="fw-semibold">{sym}{grandTax.toFixed(2)}</span></div>
                  <div>
                    <span className="text-muted small me-2">Est. Grand Total:</span>
                    <span className="fw-bold h5 mb-0 text-success">{sym}{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={handleSubmitPO}
              disabled={loading}
              className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
            >
              {loading ? "Creating Draft Purchase Order..." : "Create Draft Purchase Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
