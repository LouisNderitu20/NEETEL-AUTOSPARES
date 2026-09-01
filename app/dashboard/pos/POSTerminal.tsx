"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface POSTerminalProps {
  products: any[];
  customers: any[];
  categories: any[];
  currencySymbol: string;
  defaultCustomerId?: string;
}

export default function POSTerminal({
  products: initialProducts,
  customers,
  categories,
  currencySymbol: sym,
  defaultCustomerId,
}: POSTerminalProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    defaultCustomerId || customers.find((c) => c.name.toLowerCase() === "walk-in customer")?.id || customers[0]?.id || ""
  );
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(16); 
  
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState(initialProducts);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  
  useEffect(() => {
    let filtered = initialProducts;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    setProducts(filtered);
  }, [search, selectedCategory, initialProducts]);

  
  const addToCart = (product: any) => {
    
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.quantity) {
        toast.error(`Only ${product.quantity} ${product.unit || "units"} available in stock.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  
  const updateQty = (productId: string, amount: number) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    const prod = initialProducts.find((p) => p.id === productId);
    if (!prod) return;

    const newQty = item.qty + amount;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.id !== productId));
      return;
    }

    if (newQty > prod.quantity) {
      toast.error(`Only ${prod.quantity} units available in stock.`);
      return;
    }

    setCart(cart.map((i) => (i.id === productId ? { ...i, qty: newQty } : i)));
  };

  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.id !== productId));
  };

  
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const targetCustomerId = selectedCustomerId || defaultCustomerId || customers[0]?.id;
    if (!targetCustomerId) {
      toast.error("No valid customer account found for checkout");
      return;
    }

    setLoading(true);
    try {
      const invoiceItems = cart.map((item) => ({
        productId: item.id,
        description: `Part: ${item.name} (${item.sku})`,
        quantity: item.qty,
        unitPrice: item.sellingPrice,
      }));

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: targetCustomerId,
          items: invoiceItems,
          discountAmount: parseFloat(discount as any) || 0,
          taxRate: parseFloat(taxRate as any) || 0,
          notes: "Walk-in POS Sale Checkout",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "POS checkout failed");
      }

      const invoice = await res.json();
      toast.success(`POS checkout successful! Invoice ${invoice.invoiceNumber} generated.`);
      setCart([]);
      router.push(`/dashboard/invoices/${invoice.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = r2(cart.reduce((sum, item) => sum + r2(item.qty * item.sellingPrice), 0));
  const taxAmount = r2(Math.max(0, subtotal - discount) * (taxRate / 100));
  const grandTotal = r2(Math.max(0, subtotal - discount + taxAmount));

  return (
    <div className="animate-fade-up">
      {}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h4 fw-bold mb-0">POS Terminal</h2>
          <p className="text-muted small mb-0">Create cash sales and customer invoices instantly</p>
        </div>
      </div>

      <div className="row g-4" style={{ minHeight: "70vh" }}>
        {}
        <div className="col-12 col-lg-7 d-flex flex-column gap-3">
          {}
          <div className="card p-3">
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="search"
                    className="form-control border-start-0"
                    placeholder="Search by part name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Product Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {}
          <div className="card flex-grow-1 p-3">
            <div
              className="row g-3"
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                alignContent: "start",
              }}
            >
              {products.map((p) => (
                <div key={p.id} className="col-12 col-sm-6 col-md-4">
                  <div
                    onClick={() => addToCart(p)}
                    className="card h-100 p-2 cursor-pointer product-card-hover"
                    style={{
                      border: "1px solid var(--border-color)",
                      background: "rgba(255,255,255,0.02)",
                      transition: "all 0.2s ease-in-out",
                      cursor: "pointer",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span
                        className="badge bg-secondary"
                        style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }}
                      >
                        {p.sku}
                      </span>
                      <span
                        className={`badge bg-${p.quantity <= p.minStock ? "danger" : "success"}`}
                        style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }}
                      >
                        Stock: {p.quantity}
                      </span>
                    </div>
                    <div className="fw-semibold text-truncate small mb-1" title={p.name}>
                      {p.name}
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-auto pt-1">
                      <span className="fw-bold text-success" style={{ fontSize: "0.85rem" }}>
                        {sym}{p.sellingPrice.toFixed(0)}
                      </span>
                      <button className="btn btn-sm btn-primary p-1 py-0" style={{ fontSize: "0.75rem" }}>
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="col-12 text-center text-muted py-5">
                  <i className="bi bi-box-seam fs-2 d-block mb-2"></i>
                  No spare parts found in stock.
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-5 d-flex flex-column gap-3">
          <div className="card flex-grow-1 d-flex flex-column" style={{ maxHeight: "75vh" }}>
            <div className="card-header fw-bold text-primary-custom d-flex justify-content-between align-items-center">
              <span>Checkout Cart ({cart.length} items)</span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="btn btn-sm btn-outline-danger py-0 px-2"
                  style={{ fontSize: "0.75rem" }}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {}
            <div className="p-3 border-bottom">
              <label className="form-label small fw-semibold mb-1 text-secondary" htmlFor="checkout-customer">
                Client Account (Optional - Defaults to Walk-In)
              </label>
              <select
                id="checkout-customer"
                className="form-select form-select-sm"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.toLowerCase() === "walk-in customer"
                      ? "🛒 Walk-In Customer (Default / Cash Sale)"
                      : `${c.name} (${c.phone})`}
                  </option>
                ))}
              </select>
            </div>

            {}
            <div className="flex-grow-1 overflow-y-auto p-3" style={{ maxHeight: "30vh" }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <div className="text-truncate me-2" style={{ maxWidth: "55%" }}>
                    <div className="fw-semibold text-truncate">{item.name}</div>
                    <span className="text-muted small" style={{ fontSize: "0.7rem" }}>
                      {sym}{item.sellingPrice.toFixed(0)} / {item.unit || "unit"}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="btn btn-sm btn-outline-secondary py-0 px-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="fw-bold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="btn btn-sm btn-outline-secondary py-0 px-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-sm btn-link text-danger py-0 px-1 ms-2"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-cart fs-3 d-block mb-1"></i>
                  Cart is empty. Click parts from the list on the left to add items.
                </div>
              )}
            </div>

            {}
            {cart.length > 0 && (
              <div className="card-footer p-3">
                <div className="row g-2 mb-3" style={{ fontSize: "0.82rem" }}>
                  <div className="col-6">
                    <label className="form-label mb-1 text-muted fw-semibold" htmlFor="pos-discount">Discount (KSh)</label>
                    <input
                      id="pos-discount"
                      type="number"
                      min="0"
                      className="form-control form-control-sm"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1 text-muted fw-semibold" htmlFor="pos-tax-rate">VAT Tax Rate (%)</label>
                    <input
                      id="pos-tax-rate"
                      type="number"
                      min="0"
                      className="form-control form-control-sm"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Subtotal:</span>
                    <span className="fw-semibold">{sym}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">VAT Tax:</span>
                    <span className="fw-semibold">{sym}{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Discounts:</span>
                    <span className="fw-semibold text-danger">-{sym}{discount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-1">
                    <span className="fw-bold text-success h6 mb-0">Grand Total:</span>
                    <span className="fw-bold text-success h6 mb-0">{sym}{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn btn-primary w-100 fw-bold mt-4 py-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Creating Checkout Invoice...
                    </>
                  ) : (
                    "Generate Invoice & Checkout"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
