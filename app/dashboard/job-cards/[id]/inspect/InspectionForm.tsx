"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useState } from "react";
import Link from "next/link";

interface InspectionInputs {
  odometer: number;
  fuelLevel: string;
  lightsCheck?: string;
  brakesCheck?: string;
  tiresCheck?: string;
  fluidsCheck?: string;
  bodyDents?: string;
  belongings?: string;
  notes?: string;
}

interface InspectionFormProps {
  jobCardId: string;
  jobNumber: string;
  initialData?: any;
}

export default function InspectionForm({ jobCardId, jobNumber, initialData }: InspectionFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectionInputs>({
    defaultValues: {
      odometer: initialData?.odometer || 0,
      fuelLevel: initialData?.fuelLevel || "1/2",
      lightsCheck: initialData?.lightsCheck || "All operational",
      brakesCheck: initialData?.brakesCheck || "Brakes functional",
      tiresCheck: initialData?.tiresCheck || "Tire tread depth ok",
      fluidsCheck: initialData?.fluidsCheck || "Coolant & engine oil level ok",
      bodyDents: initialData?.bodyDents || "No major dents",
      belongings: initialData?.belongings || "Spare tire, jack, toolkit",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: InspectionInputs) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCardId}/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save inspection checklist");
      }

      toast.success("Inspection details saved and approved successfully!");
      router.push(`/dashboard/job-cards/${jobCardId}`);
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
          href={`/dashboard/job-cards/${jobCardId}`}
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Cancel
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">Vehicle Inspection Report</h2>
          <p className="text-muted small mb-0">Record checklist for Job Card {jobNumber}</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-card-checklist me-2" style={{ color: "var(--primary)" }}></i>
              Inspection Checklist
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="odometer">Odometer Mileage (km) *</label>
                    <input
                      id="odometer"
                      type="number"
                      className={`form-control ${errors.odometer ? "is-invalid" : ""}`}
                      placeholder="120000"
                      {...register("odometer", { required: "Odometer is required" })}
                    />
                    {errors.odometer && <div className="invalid-feedback">{errors.odometer.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="fuelLevel">Fuel Level Gauge *</label>
                    <select
                      id="fuelLevel"
                      className="form-select"
                      {...register("fuelLevel", { required: "Fuel level is required" })}
                    >
                      <option value="Empty">Empty</option>
                      <option value="1/4">1/4 Tank</option>
                      <option value="1/2">1/2 Tank</option>
                      <option value="3/4">3/4 Tank</option>
                      <option value="Full">Full Tank</option>
                    </select>
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="belongings">Belongings & Tools Left in Car</label>
                    <input
                      id="belongings"
                      className="form-control"
                      placeholder="Spare wheel, jack, fire extinguisher, toolbox, etc."
                      {...register("belongings")}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="bodyDents">Body Scratches & Dents Log</label>
                    <input
                      id="bodyDents"
                      className="form-control"
                      placeholder="e.g. Scratches on left fender, dent on rear bumper"
                      {...register("bodyDents")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="fluidsCheck">Fluids & Engine Bay Notes</label>
                    <input
                      id="fluidsCheck"
                      className="form-control"
                      placeholder="Coolant level, oil level, leaks..."
                      {...register("fluidsCheck")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="brakesCheck">Brakes Checklist Notes</label>
                    <input
                      id="brakesCheck"
                      className="form-control"
                      placeholder="Brake pad thickness, pedal feel..."
                      {...register("brakesCheck")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="tiresCheck">Tires Checklist Notes</label>
                    <input
                      id="tiresCheck"
                      className="form-control"
                      placeholder="Tire tread condition, inflation..."
                      {...register("tiresCheck")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="lightsCheck">Dashboard Warnings & Electronics</label>
                    <input
                      id="lightsCheck"
                      className="form-control"
                      placeholder="Warning indicators, headlamps, horn..."
                      {...register("lightsCheck")}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="notes">Mechanic Findings & Recommendations</label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Suggest oil replacement, brake pad change needed in 5,000km..."
                      {...register("notes")}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Link href={`/dashboard/job-cards/${jobCardId}`} className="btn btn-outline-secondary px-4" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={loading}>
                    {loading ? "Saving Report..." : "Submit Inspection Report"}
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
