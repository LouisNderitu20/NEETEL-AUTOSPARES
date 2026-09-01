"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface ProductFormProps {
  categories: any[];
  suppliers: any[];
  initialData?: any;
}

export default function ProductFormClient({ categories, suppliers, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [sku, setSku] = useState(initialData?.sku || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [unit, setUnit] = useState(initialData?.unit || "pcs");
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchasePrice?.toString() || "");
  const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice?.toString() || "");
  const [minStockLevel, setMinStockLevel] = useState(initialData?.minStockLevel?.toString() || "5");
  const [location, setLocation] = useState(initialData?.location || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [supplierId, setSupplierId] = useState(initialData?.supplierId || "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "0"); 

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku.trim() || !name.trim() || !categoryId) {
      toast.error("SKU, Name, and Category are required");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || null,
        brand: brand.trim() || null,
        unit: unit.trim() || "pcs",
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        minStockLevel: parseInt(minStockLevel) || 0,
        location: location.trim() || null,
        categoryId,
        supplierId: supplierId || null,
      };

      if (!isEdit) {
        payload.quantity = parseInt(quantity) || 0;
      }

      const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save product");
      }

      toast.success(isEdit ? "Product details updated!" : "Product registered successfully!");
      router.push("/dashboard/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link
          href="/dashboard/products"
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Cancel
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">{isEdit ? "Edit Product" : "Register Product"}</h2>
          <p className="text-muted small mb-0">{isEdit ? `Update properties for ${initialData.name}` : "Create a new inventory spare part"}</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-box-seam me-2" style={{ color: "var(--primary-light)" }}></i>
              Product Specifications
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">SKU / Part Number *</label>
                    <input className="form-control text-uppercase" placeholder="e.g. OIL-5W30-1L" value={sku} onChange={(e) => setSku(e.target.value)} required />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" placeholder="e.g. Engine Oil Mobil 1" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Brand / Manufacturer</label>
                    <input className="form-control" placeholder="e.g. Toyota, Mobil, Bosch" value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Unit of Measure *</label>
                    <input className="form-control" placeholder="e.g. pcs, litres, set, box" value={unit} onChange={(e) => setUnit(e.target.value)} required />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                      <option value="">-- Choose Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Default Supplier</label>
                    <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      <option value="">-- None --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Purchase Unit Cost</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0.00" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Selling Price</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0.00" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Min Stock Level (Alert threshold)</label>
                    <input type="number" className="form-control" placeholder="5" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Storage Location / Shelf</label>
                    <input className="form-control text-uppercase" placeholder="e.g. SHELF A2" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>

                  {}
                  {!isEdit && (
                    <div className="col-12 col-md-6">
                      <label className="form-label">Initial Quantity in Stock *</label>
                      <input type="number" min="0" className="form-control" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                    </div>
                  )}

                  {}
                  <div className="col-12">
                    <label className="form-label">Product Description</label>
                    <textarea className="form-control" rows={3} placeholder="Technical details, specifications or remarks..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Link href="/dashboard/products" className="btn btn-secondary">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary fw-semibold" disabled={loading}>
                    {loading ? "Saving Product..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
