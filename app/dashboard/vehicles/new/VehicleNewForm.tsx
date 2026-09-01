"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import Link from "next/link";

interface VehicleForm {
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  notes?: string;
}

interface CustomerListOption {
  id: string;
  name: string;
  phone: string;
}

export default function VehicleNewForm() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerListOption[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleForm>({
    defaultValues: {
      customerId: customerIdParam,
      fuelType: "Petrol",
      transmission: "Automatic",
    },
  });

  
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch (error) {
        console.error("Failed to load customers", error);
      }
    }
    loadCustomers();
  }, []);

  const onSubmit = async (data: VehicleForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to register vehicle");
      }

      const vehicle = await res.json();
      toast.success(`Vehicle "${vehicle.licensePlate}" registered successfully!`);
      
      
      router.push(`/dashboard/customers/${data.customerId}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to register vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back
        </button>
        <div>
          <h2 className="h5 fw-bold mb-0">Register Vehicle</h2>
          <p className="text-muted small mb-0">Link a new vehicle to a customer profile</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-car-front-fill me-2" style={{ color: "var(--primary)" }}></i>
              Vehicle Specifications
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="customerId">Linked Customer *</label>
                    <select
                      id="customerId"
                      disabled={!!customerIdParam}
                      className={`form-select ${errors.customerId ? "is-invalid" : ""}`}
                      {...register("customerId", { required: "Customer link is required" })}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                    {errors.customerId && <div className="invalid-feedback">{errors.customerId.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="licensePlate">License Plate *</label>
                    <input
                      id="licensePlate"
                      className={`form-control ${errors.licensePlate ? "is-invalid" : ""}`}
                      placeholder="KAA 123A (Kenyan Format)"
                      style={{ textTransform: "uppercase" }}
                      {...register("licensePlate", { required: "License plate is required" })}
                    />
                    {errors.licensePlate && <div className="invalid-feedback">{errors.licensePlate.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="make">Make (Brand) *</label>
                    <input
                      id="make"
                      className={`form-control ${errors.make ? "is-invalid" : ""}`}
                      placeholder="Toyota / Nissan / Subaru"
                      {...register("make", { required: "Make is required" })}
                    />
                    {errors.make && <div className="invalid-feedback">{errors.make.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="model">Model *</label>
                    <input
                      id="model"
                      className={`form-control ${errors.model ? "is-invalid" : ""}`}
                      placeholder="Fielder / X-Trail / Forester"
                      {...register("model", { required: "Model is required" })}
                    />
                    {errors.model && <div className="invalid-feedback">{errors.model.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="year">Manufacturing Year *</label>
                    <input
                      id="year"
                      type="number"
                      className={`form-control ${errors.year ? "is-invalid" : ""}`}
                      placeholder="2018"
                      {...register("year", {
                        required: "Year is required",
                        min: { value: 1900, message: "Invalid year" },
                        max: { value: new Date().getFullYear() + 2, message: "Invalid year" },
                      })}
                    />
                    {errors.year && <div className="invalid-feedback">{errors.year.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="color">Vehicle Color</label>
                    <input
                      id="color"
                      className="form-control"
                      placeholder="Silver / White / Blue"
                      {...register("color")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="mileage">Current Mileage (km)</label>
                    <input
                      id="mileage"
                      type="number"
                      className="form-control"
                      placeholder="150000"
                      {...register("mileage")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="fuelType">Fuel Type</label>
                    <select id="fuelType" className="form-select" {...register("fuelType")}>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="transmission">Transmission</label>
                    <select id="transmission" className="form-select" {...register("transmission")}>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="vin">Chassis / VIN Number</label>
                    <input
                      id="vin"
                      className="form-control"
                      placeholder="Chassis Number"
                      {...register("vin")}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="notes">Vehicle Notes / History</label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows={3}
                      placeholder="Previous repair history or other observations..."
                      {...register("notes")}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" onClick={() => router.back()} className="btn btn-outline-secondary px-4" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={loading}>
                    {loading ? "Registering..." : "Register Vehicle"}
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
