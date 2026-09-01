"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/permissions";

interface RoleSelectorProps {
  employeeId: string;
  currentRole: UserRole;
  isOwner: boolean;
  currentUserEmail: string;
  employeeEmail: string;
  currentUserRole?: string;
}

export default function RoleSelector({
  employeeId,
  currentRole,
  isOwner,
  currentUserEmail,
  employeeEmail,
  currentUserRole,
}: RoleSelectorProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newRole: string) => {
    if (!isOwner && currentUserRole !== "IT_ADMIN") return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update role");
        setRole(currentRole);
      } else {
        toast.success(`Role updated to ${ROLE_LABELS[newRole as UserRole]}!`);
        setRole(newRole as UserRole);
      }
    } catch {
      toast.error("Failed to update role due to a network error.");
    } finally {
      setUpdating(false);
    }
  };

  
  if (
    (!isOwner && currentUserRole !== "IT_ADMIN") ||
    employeeEmail === currentUserEmail ||
    (currentRole === "IT_ADMIN" && currentUserRole !== "IT_ADMIN")
  ) {
    const roleColors: Record<string, string> = {
      IT_ADMIN: "danger",
      OWNER: "primary",
      MANAGER: "info",
      RECEPTIONIST: "success",
      MECHANIC: "warning",
      CASHIER: "secondary",
      INVENTORY_CLERK: "dark",
    };
    return (
      <span className={`badge bg-${roleColors[role] || "secondary"} bg-opacity-75`} style={{ fontSize: "0.72rem" }}>
        {ROLE_LABELS[role]}
      </span>
    );
  }

  return (
    <select
      value={role}
      disabled={updating}
      onChange={(e) => handleChange(e.target.value)}
      className="form-select form-select-sm"
      style={{
        width: "155px",
        fontSize: "0.75rem",
        padding: "0.2rem 0.4rem",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--bg-input)",
        borderColor: "var(--border-color)",
        color: "var(--text-primary)",
        cursor: "pointer",
      }}
    >
      {currentUserRole === "IT_ADMIN" && <option value="IT_ADMIN">IT Administrator</option>}
      <option value="OWNER">Owner</option>
      <option value="MANAGER">Manager</option>
      <option value="RECEPTIONIST">Receptionist</option>
      <option value="MECHANIC">Mechanic</option>
      <option value="CASHIER">Cashier</option>
      <option value="INVENTORY_CLERK">Inventory Clerk</option>
    </select>
  );
}
