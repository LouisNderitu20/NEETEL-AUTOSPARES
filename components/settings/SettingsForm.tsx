"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface GarageSettingsData {
  id?: string;
  garageName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  currency?: string | null;
  currencySymbol?: string | null;
  taxName?: string | null;
  taxRate?: number | null;
  receiptFooter?: string | null;
}

interface SettingsFormProps {
  initialSettings: GarageSettingsData | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    garageName: initialSettings?.garageName || "NEETEL AUTOSPARES",
    address: initialSettings?.address || "",
    phone: initialSettings?.phone || "",
    email: initialSettings?.email || "",
    website: initialSettings?.website || "",
    currency: initialSettings?.currency || "USD",
    currencySymbol: initialSettings?.currencySymbol || "$",
    taxName: initialSettings?.taxName || "Tax",
    taxRate: initialSettings?.taxRate ?? 0,
    receiptFooter: initialSettings?.receiptFooter || "",
  });

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingFinancial, setSavingFinancial] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value,
    }));
  };

  const saveSettings = async (section: "info" | "financial", payload: Partial<typeof formData>) => {
    if (section === "info") setSavingInfo(true);
    if (section === "financial") setSavingFinancial(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving settings.");
    } finally {
      if (section === "info") setSavingInfo(false);
      if (section === "financial") setSavingFinancial(false);
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings("info", {
      garageName: formData.garageName,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
    });
  };

  const handleFinancialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings("financial", {
      currency: formData.currency,
      currencySymbol: formData.currencySymbol,
      taxName: formData.taxName,
      taxRate: Number(formData.taxRate) || 0,
      receiptFooter: formData.receiptFooter,
    });
  };

  return (
    <div className="row g-4">
      {}
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm border-0">
          <div className="card-header fw-semibold py-3 border-bottom-0">
            <i className="bi bi-building me-2"></i>Garage Information
          </div>
          <div className="card-body">
            <form onSubmit={handleInfoSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label font-medium">Garage Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="garageName"
                  value={formData.garageName}
                  onChange={handleChange}
                  placeholder="Garage Name"
                  required
                />
              </div>

              <div>
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street Address, City"
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@garage.com"
                />
              </div>

              <div>
                <label className="form-label">Website</label>
                <input
                  type="url"
                  className="form-control"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.garage.com"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="btn btn-primary" disabled={savingInfo}>
                  {savingInfo ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Information"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {}
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm border-0">
          <div className="card-header fw-semibold py-3 border-bottom-0">
            <i className="bi bi-currency-exchange me-2"></i>Financial & Invoice Settings
          </div>
          <div className="card-body">
            <form onSubmit={handleFinancialSubmit} className="d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label">Currency Symbol</label>
                  <input
                    type="text"
                    className="form-control"
                    name="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={handleChange}
                    placeholder="e.g. $"
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Currency Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    placeholder="e.g. USD"
                    required
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label">Tax Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="taxName"
                    value={formData.taxName}
                    onChange={handleChange}
                    placeholder="e.g. VAT / Tax"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Receipt / Invoice Footer Note</label>
                <textarea
                  className="form-control"
                  rows={3}
                  name="receiptFooter"
                  value={formData.receiptFooter}
                  onChange={handleChange}
                  placeholder="Thank you for your business!"
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn btn-primary" disabled={savingFinancial}>
                  {savingFinancial ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Financial Settings"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
