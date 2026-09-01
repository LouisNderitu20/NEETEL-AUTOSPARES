"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import Link from "next/link";

interface JobCardForm {
  customerId: string;
  vehicleId: string;
  mechanicId: string;
  complaint: string;
  notes?: string;
  scheduledDate?: string;
  laborRate?: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  licensePlate: string;
}

interface MechanicOption {
  id: string;
  name: string;
}

interface JobCardNewFormProps {
  mechanics: MechanicOption[];
}

export default function JobCardNewForm({ mechanics }: JobCardNewFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId") || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobCardForm>({
    defaultValues: {
      customerId: customerIdParam,
      mechanicId: "",
      vehicleId: "",
      laborRate: 1500, 
      scheduledDate: new Date().toISOString().substring(0, 10),
    },
  });

  const selectedCustomerId = watch("customerId");

  
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

  
  useEffect(() => {
    async function loadVehicles() {
      if (!selectedCustomerId) {
        setVehicles([]);
        setValue("vehicleId", "");
        return;
      }
      try {
        const res = await fetch(`/api/vehicles?customerId=${selectedCustomerId}`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data || []);
          setValue("vehicleId", ""); 
        }
      } catch (error) {
        console.error("Failed to load vehicles", error);
      }
    }
    loadVehicles();
  }, [selectedCustomerId, setValue]);

  const onSubmit = async (data: JobCardForm) => {
    setLoading(true);
    try {
      data.laborRate = parseFloat(data.laborRate as any) || 0;

      const res = await fetch("/api/job-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job card");
      }

      const jobCard = await res.json();
      toast.success(`Job Card "${jobCard.jobNumber}" created successfully!`);
      router.push(`/dashboard/job-cards/${jobCard.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create job card");
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
          <h2 className="h5 fw-bold mb-0">Create Job Card</h2>
          <p className="text-muted small mb-0">Initialize a new vehicle diagnostics/repair work order</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-file-earmark-medical-fill me-2" style={{ color: "var(--primary)" }}></i>
              Work Order Details
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="customerId">Select Customer *</label>
                    {customerIdParam ? (
                      <>
                        <input type="hidden" {...register("customerId")} />
                        <input
                          id="customerId"
                          type="text"
                          className="form-control"
                          value={
                            customers.length > 0 
                              ? (customers.find((c) => c.id === customerIdParam) 
                                  ? `${customers.find((c) => c.id === customerIdParam)?.name} (${customers.find((c) => c.id === customerIdParam)?.phone})`
                                  : "Selected customer not found") 
                              : "Loading customer details..."
                          }
                          readOnly
                          disabled
                        />
                      </>
                    ) : (
                      <select
                        id="customerId"
                        className={`form-select ${errors.customerId ? "is-invalid" : ""}`}
                        {...register("customerId", { required: "Customer selection is required" })}
                      >
                        <option value="">-- Select Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.customerId && <div className="invalid-feedback">{errors.customerId.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="vehicleId">Select Vehicle *</label>
                    <select
                      id="vehicleId"
                      className={`form-select ${errors.vehicleId ? "is-invalid" : ""}`}
                      {...register("vehicleId", { required: "Vehicle selection is required" })}
                    >
                      <option value="">
                        {selectedCustomerId 
                          ? vehicles.length === 0 ? "-- No vehicles found (register one first!) --" : "-- Select Vehicle --"
                          : "-- Select Customer First --"}
                      </option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} ({v.licensePlate})
                        </option>
                      ))}
                    </select>
                    {errors.vehicleId && <div className="invalid-feedback">{errors.vehicleId.message}</div>}
                    {selectedCustomerId && vehicles.length === 0 && (
                      <div className="form-text text-danger mt-1 small">
                        This customer has no registered vehicles.{" "}
                        <Link href={`/dashboard/vehicles/new?customerId=${selectedCustomerId}`} className="fw-bold text-decoration-underline text-danger">
                          Register a vehicle now
                        </Link>
                      </div>
                    )}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="mechanicId">Assign Mechanic *</label>
                    <select
                      id="mechanicId"
                      className={`form-select ${errors.mechanicId ? "is-invalid" : ""}`}
                      {...register("mechanicId", { required: "Mechanic assignment is required" })}
                    >
                      <option value="">-- Select Mechanic --</option>
                      {mechanics.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {errors.mechanicId && <div className="invalid-feedback">{errors.mechanicId.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="scheduledDate">Scheduled Date</label>
                    <input
                      id="scheduledDate"
                      type="date"
                      className="form-control"
                      {...register("scheduledDate")}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="laborRate">Base Labor Charge (KSh) *</label>
                    <input
                      id="laborRate"
                      type="number"
                      className="form-control"
                      placeholder="1500"
                      {...register("laborRate", { required: "Labor rate is required" })}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="complaint">Customer Complaints / Instructions *</label>
                    <textarea
                      id="complaint"
                      className={`form-control ${errors.complaint ? "is-invalid" : ""}`}
                      rows={4}
                      placeholder="Describe symptoms, requested repairs, or diagnostics needed (e.g. Engine knock, oil change request, brake replacement...)"
                      {...register("complaint", { required: "Complaints description is required" })}
                    />
                    {errors.complaint && <div className="invalid-feedback">{errors.complaint.message}</div>}
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="notes">Internal Notes (Optional)</label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows={2}
                      placeholder="Special instructions, priority instructions, or other observations..."
                      {...register("notes")}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" onClick={() => router.back()} className="btn btn-outline-secondary px-4" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={loading}>
                    {loading ? "Creating Work Order..." : "Create Job Card"}
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
