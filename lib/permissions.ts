import { UserRole } from "@prisma/client";


export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  IT_ADMIN: ["*"], 
  OWNER: ["*"], 
  MANAGER: [
    "dashboard", "customers", "vehicles", "jobs", "inventory", "pos",
    "reports", "employees", "settings", "suppliers", "purchase-orders",
    "activity-log", "quotations",
  ],
  RECEPTIONIST: [
    "dashboard", "customers", "vehicles", "jobs:create", "jobs:view",
    "quotations",
  ],
  MECHANIC: [
    "dashboard:mechanic", "jobs:view", "jobs:update", "inspection",
    "inventory:view",
  ],
  CASHIER: [
    "dashboard:cashier", "pos", "invoices", "payments", "customers:view",
    "inventory:view", "quotations", "jobs:view",
  ],
  INVENTORY_CLERK: [
    "dashboard:inventory", "inventory", "suppliers", "purchase-orders",
    "stock-movements",
  ],
};


export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  IT_ADMIN: "/dashboard/overview",
  OWNER: "/dashboard/overview",
  MANAGER: "/dashboard/overview",
  RECEPTIONIST: "/dashboard/reception",
  MECHANIC: "/dashboard/mechanic",
  CASHIER: "/dashboard/cashier",
  INVENTORY_CLERK: "/dashboard/inventory",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  IT_ADMIN: "IT Administrator",
  OWNER: "Owner",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  MECHANIC: "Mechanic",
  CASHIER: "Cashier",
  INVENTORY_CLERK: "Inventory Clerk",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  IT_ADMIN: "danger",
  OWNER: "primary",
  MANAGER: "info",
  RECEPTIONIST: "warning",
  MECHANIC: "warning",
  CASHIER: "success",
  INVENTORY_CLERK: "secondary",
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes("*")) return true;
  return perms.some((p) => p === permission || p.startsWith(permission + ":"));
}
