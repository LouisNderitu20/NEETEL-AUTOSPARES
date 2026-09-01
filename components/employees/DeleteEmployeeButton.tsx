"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface DeleteEmployeeButtonProps {
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  currentUserRole?: string;
  isOwner: boolean;
  currentUserEmail: string;
  employeeEmail: string;
}

export default function DeleteEmployeeButton({
  employeeId,
  employeeName,
  employeeRole,
  currentUserRole,
  isOwner,
  currentUserEmail,
  employeeEmail,
}: DeleteEmployeeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!isOwner && currentUserRole !== "IT_ADMIN") return;

    if (employeeRole === "IT_ADMIN" && currentUserRole !== "IT_ADMIN") {
      toast.error("IT Administrator accounts cannot be deleted by Garage Owners.");
      return;
    }

    if (employeeEmail === currentUserEmail) {
      toast.error("You cannot delete your own logged-in account.");
      return;
    }

    const actionWord = "delete";
    const confirmed = confirm(
      `Are you sure you want to delete employee "${employeeName}"?\n\nNote: If they have active job cards or stock history, their account will be deactivated instead of deleted to preserve records.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete employee.");
      } else {
        toast.success(data.message || "Employee deleted successfully.");
        router.refresh();
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  if (
    (!isOwner && currentUserRole !== "IT_ADMIN") ||
    employeeEmail === currentUserEmail ||
    (employeeRole === "IT_ADMIN" && currentUserRole !== "IT_ADMIN")
  ) {
    return null;
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-sm btn-outline-danger ms-2"
      style={{
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        borderRadius: "var(--radius-sm)",
      }}
      title="Delete Employee"
    >
      <i className="bi bi-trash3 me-1"></i>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
