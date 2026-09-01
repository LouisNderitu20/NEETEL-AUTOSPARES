"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface VehicleEditClientProps {
  vehicle: any;
}

export default function VehicleEditClient({ vehicle }: VehicleEditClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [make, setMake] = useState(vehicle.make || "");
  const [model, setModel] = useState(vehicle.model || "");
  const [year, setYear] = useState(vehicle.year?.toString() || "");
  const [color, setColor] = useState(vehicle.color || "");
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || "");
  const [vin, setVin] = useState(vehicle.vin || "");
  const [engineType, setEngineType] = useState(vehicle.engineType || "");
  const [fuelType, setFuelType] = useState(vehicle.fuelType || "");
  const [transmission, setTransmission] = useState(vehicle.transmission || "");
  const [mileage, setMileage] = useState(vehicle.mileage?.toString() || "");
  const [notes, setNotes] = useState(vehicle.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!make.trim() || !model.trim()) {
      toast.error("Make and Model are required");
      return;
    }
    if (!licensePlate.trim()) {
      toast.error("License plate is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: make.trim(),
          model: model.trim(),
          year: year ? parseInt(year) : null,
          color: color.trim(),
          licensePlate: licensePlate.trim().toUpperCase(),
          vin: vin.trim(),
          engineType: engineType.trim(),
          fuelType: fuelType.trim(),
          transmission: transmission.trim(),
          mileage: mileage ? parseInt(mileage) : null,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update vehicle");
      }

      toast.success("Vehicle updated successfully!");
      router.push(`/dashboard/customers/${vehicle.customerId}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${make} ${model} (${licensePlate})? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete vehicle");
      }

      toast.success("Vehicle deleted successfully.");
      router.push(`/dashboard/customers/${vehicle.customerId}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link
          href={`/dashboard/customers/${vehicle.customerId}`}
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Customer
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">Edit Vehicle</h2>
          <p className="text-muted small mb-0">
            {vehicle.make} {vehicle.model} — <code style={{ color: "var(--primary-light)" }}>{vehicle.licensePlate}</code>
            {vehicle.customer && <span> · Owner: {vehicle.customer.name}</span>}
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-car-front-fill me-2" style={{ color: "var(--primary-light)" }}></i>
              Vehicle Details
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Make <span className="text-danger">*</span></label>
                    <input className="form-control" placeholder="Toyota" value={make} onChange={(e) => setMake(e.target.value)} required />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Model <span className="text-danger">*</span></label>
                    <input className="form-control" placeholder="Corolla" value={model} onChange={(e) => setModel(e.target.value)} required />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">License Plate <span className="text-danger">*</span></label>
                    <input className="form-control text-uppercase" placeholder="KCB 123X" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} required />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-control" placeholder="2020" value={year} onChange={(e) => setYear(e.target.value)} />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Color</label>
                    <input className="form-control" placeholder="Silver" value={color} onChange={(e) => setColor(e.target.value)} />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">VIN / Chassis Number</label>
                    <input className="form-control" placeholder="Optional" value={vin} onChange={(e) => setVin(e.target.value)} />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Engine Type</label>
                    <input className="form-control" placeholder="1.8L 4-cyl" value={engineType} onChange={(e) => setEngineType(e.target.value)} />
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Fuel Type</label>
                    <select className="form-select" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                      <option value="LPG">LPG</option>
                    </select>
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Transmission</label>
                    <select className="form-select" value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                      <option value="CVT">CVT</option>
                    </select>
                  </div>
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Mileage (km)</label>
                    <input type="number" className="form-control" placeholder="e.g. 85000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                  </div>
                  {}
                  <div className="col-12">
                    <label className="form-label">Vehicle Notes</label>
                    <textarea className="form-control" rows={2} placeholder="Known issues, condition notes..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <><span className="spinner-border spinner-border-sm me-1" />Deleting...</>
                    ) : (
                      <><i className="bi bi-trash me-1"></i>Delete Vehicle</>
                    )}
                  </button>

                  <div className="d-flex gap-2">
                    <Link href={`/dashboard/customers/${vehicle.customerId}`} className="btn btn-secondary">
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                      ) : (
                        <><i className="bi bi-check-circle-fill me-1"></i>Save Changes</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-info-circle me-2"></i>Vehicle Info
            </div>
            <div className="card-body" style={{ fontSize: "0.85rem" }}>
              <div className="d-flex flex-column gap-3">
                <div>
                  <span className="text-muted d-block small">Owner</span>
                  <span className="fw-semibold">{vehicle.customer?.name || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-muted d-block small">Registered On</span>
                  <span className="fw-medium">{new Date(vehicle.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted d-block small">Last Updated</span>
                  <span className="fw-medium">{new Date(vehicle.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
