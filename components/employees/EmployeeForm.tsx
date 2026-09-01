"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Link from "next/link";
import { UserRole } from "@prisma/client";

interface EmployeeFormInputs {
  name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
  isActive?: boolean;
}

interface EmployeeFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
  };
  currentUserRole: string;
}

export default function EmployeeForm({ initialData, currentUserRole }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!initialData;
  const isOwner = ["IT_ADMIN", "OWNER"].includes(currentUserRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormInputs>({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "RECEPTIONIST",
      isActive: initialData ? initialData.isActive : true,
    },
  });

  const onSubmit = async (data: EmployeeFormInputs) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/employees/${initialData.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      
      if (isEdit && (!data.password || data.password.trim() === "")) {
        delete data.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.error || `Failed to ${isEdit ? "update" : "create"} employee.`);
      } else {
        toast.success(resData.message || `Employee ${isEdit ? "updated" : "created"} successfully!`);
        router.push("/dashboard/employees");
        router.refresh();
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 animate-fade-up" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h3 className="h5 fw-bold mb-4" style={{ color: "var(--primary)" }}>
        {isEdit ? "Edit Staff Member Details" : "Register New Employee"}
      </h3>

      {}
      <div className="mb-3">
        <label className="form-label fw-semibold small" htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          placeholder="John Doe"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
      </div>

      {}
      <div className="mb-3">
        <label className="form-label fw-semibold small" htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          className={`form-control ${errors.email ? "is-invalid" : ""}`}
          placeholder="name@email.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          })}
        />
        {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
      </div>

      {}
      <div className="mb-3">
        <label className="form-label fw-semibold small" htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="text"
          className="form-control"
          placeholder="+254 700 000 000"
          {...register("phone")}
        />
      </div>

      {}
      <div className="mb-3">
        <label className="form-label fw-semibold small" htmlFor="role">System Role</label>
        <select
          id="role"
          disabled={!isOwner}
          className="form-select"
          {...register("role")}
        >
          <option value="OWNER">Owner (Full System Access)</option>
          <option value="MANAGER">Manager (Operational Admin)</option>
          <option value="RECEPTIONIST">Receptionist (Booking & Jobs)</option>
          <option value="MECHANIC">Mechanic (Inspections & Repairs)</option>
          <option value="CASHIER">Cashier (POS & Billing)</option>
          <option value="INVENTORY_CLERK">Inventory Clerk (Stock & Products)</option>
        </select>
        {!isOwner && (
          <div className="form-text text-warning mt-1" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            Only the Owner can change or allocate roles.
          </div>
        )}
      </div>

      {}
      <div className="mb-3">
        <label className="form-label fw-semibold small" htmlFor="password">
          Password {isEdit && <span className="text-muted">(Leave blank to keep current)</span>}
        </label>
        <input
          id="password"
          type="password"
          disabled={isEdit && currentUserRole !== "IT_ADMIN"}
          className={`form-control ${errors.password ? "is-invalid" : ""}`}
          placeholder={isEdit && currentUserRole !== "IT_ADMIN" ? "Restricted to IT Administrator" : (isEdit ? "••••••••" : "Min 8 chars, Uppercase, Lowercase, Number & Symbol")}
          {...register("password", {
            required: !isEdit ? "Password is required" : false,
            validate: (val) => {
              if (!val && isEdit) return true;
              if (!val) return "Password is required";
              if (val.length < 8) return "Password must be at least 8 characters long";
              if (!/[A-Z]/.test(val)) return "Must include at least 1 uppercase letter (A-Z)";
              if (!/[a-z]/.test(val)) return "Must include at least 1 lowercase letter (a-z)";
              if (!/[0-9]/.test(val)) return "Must include at least 1 number (0-9)";
              if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(val)) return "Must include at least 1 special character (!@#$%)";
              return true;
            },
          })}
        />
        {isEdit && currentUserRole !== "IT_ADMIN" && (
          <div className="form-text text-muted mt-1" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-shield-lock-fill text-warning me-1"></i>
            Security Compliance: Employee password modification is restricted strictly to the IT Administrator.
          </div>
        )}
        {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
      </div>

      {}
      {isEdit && (
        <div className="mb-4 form-check form-switch">
          <input
            id="isActive"
            type="checkbox"
            className="form-check-input"
            role="switch"
            {...register("isActive")}
          />
          <label className="form-check-label fw-semibold small" htmlFor="isActive">
            Active Status (If deactivated, user cannot log in)
          </label>
        </div>
      )}

      {}
      <div className="d-flex gap-2 mt-2 justify-content-end">
        <Link href="/dashboard/employees" className="btn btn-outline-secondary px-4 py-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
          Cancel
        </Link>
        <button type="submit" disabled={loading} className="btn btn-primary px-4 py-2 fw-semibold">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
