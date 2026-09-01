"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface VehicleEntry {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  vin: string;
  engineType: string;
  fuelType: string;
  transmission: string;
  mileage: string;
  notes: string;
}

const emptyVehicle = (): VehicleEntry => ({
  make: "",
  model: "",
  year: "",
  color: "",
  licensePlate: "",
  vin: "",
  engineType: "",
  fuelType: "",
  transmission: "",
  mileage: "",
  notes: "",
});

export default function NewCustomerPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [notes, setNotes] = useState("");

  
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);

  const addVehicle = () => setVehicles([...vehicles, emptyVehicle()]);

  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const updateVehicle = (index: number, field: keyof VehicleEntry, value: string) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v.make.trim() || !v.model.trim()) {
        toast.error(`Vehicle #${i + 1}: Make and Model are required`);
        return;
      }
      if (!v.licensePlate.trim()) {
        toast.error(`Vehicle #${i + 1}: License plate is required`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        phone2: phone2.trim() || undefined,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        address: address.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      };

      if (vehicles.length > 0) {
        payload.vehicles = vehicles.map((v) => ({
          make: v.make.trim(),
          model: v.model.trim(),
          year: v.year ? parseInt(v.year) : undefined,
          color: v.color.trim() || undefined,
          licensePlate: v.licensePlate.trim(),
          vin: v.vin.trim() || undefined,
          engineType: v.engineType.trim() || undefined,
          fuelType: v.fuelType.trim() || undefined,
          transmission: v.transmission.trim() || undefined,
          mileage: v.mileage ? parseInt(v.mileage) : undefined,
          notes: v.notes.trim() || undefined,
        }));
      }

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create customer");
      }

      const customer = await res.json();
      toast.success(`Customer "${customer.name}" created with ${vehicles.length} vehicle(s)!`);
      router.push(`/dashboard/customers/${customer.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link
          href="/dashboard/customers"
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">Register New Customer</h2>
          <p className="text-muted small mb-0">Add customer details and register their vehicle(s)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          {}
          <div className="col-12 col-lg-7">
            <div className="card">
              <div className="card-header fw-semibold">
                <i className="bi bi-person-plus-fill me-2" style={{ color: "var(--primary-light)" }}></i>
                Customer Information
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="name">Full Name <span className="text-danger">*</span></label>
                    <input id="name" className="form-control" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="phone">Phone Number <span className="text-danger">*</span></label>
                    <input id="phone" className="form-control" placeholder="+254 700 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="phone2">Alternative Phone</label>
                    <input id="phone2" className="form-control" placeholder="Optional second number" value={phone2} onChange={(e) => setPhone2(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input id="email" type="email" className="form-control" placeholder="customer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="company">Company / Organization</label>
                    <input id="company" className="form-control" placeholder="Optional" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="idNumber">ID / Passport Number</label>
                    <input id="idNumber" className="form-control" placeholder="Optional" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="address">Physical Address</label>
                    <input id="address" className="form-control" placeholder="123 Main Street, City" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="creditLimit">Credit Limit</label>
                    <input id="creditLimit" type="number" step="0.01" min="0" className="form-control" placeholder="0.00" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="notes">Notes</label>
                    <textarea id="notes" className="form-control" rows={2} placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-header fw-semibold d-flex align-items-center justify-content-between">
                <span>
                  <i className="bi bi-car-front-fill me-2" style={{ color: "var(--primary-light)" }}></i>
                  Vehicles ({vehicles.length})
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={addVehicle}
                >
                  <i className="bi bi-plus-lg me-1"></i>Add Vehicle
                </button>
              </div>
              <div className="card-body">
                {vehicles.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-car-front" style={{ fontSize: "2.5rem", opacity: 0.3 }}></i>
                    <p className="small mt-2 mb-0">No vehicles added yet.<br />Click "Add Vehicle" to register one.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {vehicles.map((v, i) => (
                      <div key={i} className="p-3 rounded position-relative" style={{ border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
                        {}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <span className="fw-semibold small" style={{ color: "var(--primary-light)" }}>
                            <i className="bi bi-car-front me-1"></i>Vehicle #{i + 1}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-1"
                            onClick={() => removeVehicle(i)}
                            title="Remove vehicle"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>

                        <div className="row g-2">
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Make <span className="text-danger">*</span></label>
                            <input className="form-control form-control-sm" placeholder="Toyota" value={v.make} onChange={(e) => updateVehicle(i, "make", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Model <span className="text-danger">*</span></label>
                            <input className="form-control form-control-sm" placeholder="Corolla" value={v.model} onChange={(e) => updateVehicle(i, "model", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">License Plate <span className="text-danger">*</span></label>
                            <input className="form-control form-control-sm text-uppercase" placeholder="KCB 123X" value={v.licensePlate} onChange={(e) => updateVehicle(i, "licensePlate", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Year</label>
                            <input type="number" className="form-control form-control-sm" placeholder="2020" value={v.year} onChange={(e) => updateVehicle(i, "year", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Color</label>
                            <input className="form-control form-control-sm" placeholder="Silver" value={v.color} onChange={(e) => updateVehicle(i, "color", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">VIN / Chassis</label>
                            <input className="form-control form-control-sm" placeholder="Optional" value={v.vin} onChange={(e) => updateVehicle(i, "vin", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Engine Type</label>
                            <input className="form-control form-control-sm" placeholder="1.8L 4-cyl" value={v.engineType} onChange={(e) => updateVehicle(i, "engineType", e.target.value)} />
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Fuel Type</label>
                            <select className="form-select form-select-sm" value={v.fuelType} onChange={(e) => updateVehicle(i, "fuelType", e.target.value)}>
                              <option value="">Select...</option>
                              <option value="Petrol">Petrol</option>
                              <option value="Diesel">Diesel</option>
                              <option value="Hybrid">Hybrid</option>
                              <option value="Electric">Electric</option>
                              <option value="LPG">LPG</option>
                            </select>
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Transmission</label>
                            <select className="form-select form-select-sm" value={v.transmission} onChange={(e) => updateVehicle(i, "transmission", e.target.value)}>
                              <option value="">Select...</option>
                              <option value="Manual">Manual</option>
                              <option value="Automatic">Automatic</option>
                              <option value="CVT">CVT</option>
                            </select>
                          </div>
                          {}
                          <div className="col-6">
                            <label className="form-label small mb-1">Mileage (km)</label>
                            <input type="number" className="form-control form-control-sm" placeholder="e.g. 85000" value={v.mileage} onChange={(e) => updateVehicle(i, "mileage", e.target.value)} />
                          </div>
                          {}
                          <div className="col-12">
                            <label className="form-label small mb-1">Vehicle Notes</label>
                            <input className="form-control form-control-sm" placeholder="e.g. AC not working" value={v.notes} onChange={(e) => updateVehicle(i, "notes", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="col-12">
            <div className="card p-3">
              <div className="d-flex gap-2 justify-content-end align-items-center">
                <Link href="/dashboard/customers" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  id="save-customer-btn"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                  ) : (
                    <><i className="bi bi-check-circle-fill me-1"></i>Save Customer{vehicles.length > 0 ? ` & ${vehicles.length} Vehicle(s)` : ""}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
