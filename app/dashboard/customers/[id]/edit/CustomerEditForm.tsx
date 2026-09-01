"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useState } from "react";
import Link from "next/link";

interface CustomerForm {
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  company?: string;
  idNumber?: string;
  notes?: string;
  creditLimit: number;
}

interface CustomerEditFormProps {
  initialData: {
    id: string;
    name: string;
    phone: string;
    phone2: string | null;
    email: string | null;
    address: string | null;
    company: string | null;
    idNumber: string | null;
    notes: string | null;
    creditLimit: number;
    vehicles: any[];
  };
}

export default function CustomerEditForm({ initialData }: CustomerEditFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerForm>({
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone,
      phone2: initialData.phone2 || "",
      email: initialData.email || "",
      address: initialData.address || "",
      company: initialData.company || "",
      idNumber: initialData.idNumber || "",
      notes: initialData.notes || "",
      creditLimit: initialData.creditLimit,
    },
  });

  const onSubmit = async (data: CustomerForm) => {
    setLoading(true);
    try {
      
      data.creditLimit = parseFloat(data.creditLimit as any) || 0;

      const res = await fetch(`/api/customers/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update customer");
      }

      toast.success("Customer profile updated successfully!");
      router.push(`/dashboard/customers/${initialData.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link
          href={`/dashboard/customers/${initialData.id}`}
          className="btn btn-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Cancel
        </Link>
        <div>
          <h2 className="h5 fw-bold mb-0">Edit Customer Profile</h2>
          <p className="text-muted small mb-0">Modify information for {initialData.name}</p>
        </div>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-pencil-square me-2" style={{ color: "var(--primary)" }}></i>
              Customer Details
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="name">Full Name *</label>
                    <input
                      id="name"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      placeholder="John Smith"
                      {...register("name", { required: "Full name is required" })}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                      placeholder="+254 700 000 000"
                      {...register("phone", { required: "Phone number is required" })}
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="phone2">Alternative Phone</label>
                    <input
                      id="phone2"
                      className="form-control"
                      placeholder="Optional second number"
                      {...register("phone2")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      placeholder="john.smith@email.com"
                      {...register("email", {
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email address",
                        },
                      })}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="idNumber">ID / Passport Number</label>
                    <input
                      id="idNumber"
                      className="form-control"
                      placeholder="ID Number"
                      {...register("idNumber")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="company">Company / Organization</label>
                    <input
                      id="company"
                      className="form-control"
                      placeholder="Company Name"
                      {...register("company")}
                    />
                  </div>

                  {}
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="creditLimit">Credit Limit</label>
                    <input
                      id="creditLimit"
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      {...register("creditLimit")}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="address">Physical Address</label>
                    <input
                      id="address"
                      className="form-control"
                      placeholder="123 Oak Street, City"
                      {...register("address")}
                    />
                  </div>

                  {}
                  <div className="col-12">
                    <label className="form-label" htmlFor="notes">Notes / Observations</label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows={3}
                      placeholder="Customer preferences, vehicle details or other remarks..."
                      {...register("notes")}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Link href={`/dashboard/customers/${initialData.id}`} className="btn btn-outline-secondary px-4" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={loading}>
                    {loading ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-header fw-semibold d-flex align-items-center justify-content-between">
              <span>
                <i className="bi bi-car-front-fill me-2" style={{ color: "var(--primary-light)" }}></i>
                Registered Vehicles ({initialData.vehicles.length})
              </span>
              <Link
                href={`/dashboard/vehicles/new?customerId=${initialData.id}`}
                className="btn btn-sm btn-primary"
              >
                <i className="bi bi-plus-lg me-1"></i>Add Vehicle
              </Link>
            </div>
            <div className="card-body">
              {initialData.vehicles.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-car-front" style={{ fontSize: "2.5rem", opacity: 0.3 }}></i>
                  <p className="small mt-2 mb-0">No vehicles registered for this customer.<br />Click "Add Vehicle" above to register one.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {initialData.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded d-flex align-items-center justify-content-between"
                      style={{ border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div>
                        <code style={{ color: "var(--primary-light)", fontSize: "0.85rem" }}>{v.licensePlate}</code>
                        <div className="fw-semibold mt-1" style={{ fontSize: "0.9rem" }}>{v.make} {v.model}</div>
                        {v.year && <span className="text-muted small">{v.year} · </span>}
                        {v.color && <span className="text-muted small">{v.color}</span>}
                      </div>
                      <Link
                        href={`/dashboard/vehicles/${v.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="bi bi-pencil-square me-1"></i>Edit Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
