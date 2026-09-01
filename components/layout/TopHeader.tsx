"use client";

import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

interface TopHeaderProps {
  user: { name: string; email: string; role: UserRole };
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard/overview": { title: "Overview", subtitle: "Business performance at a glance" },
  "/dashboard/reception": { title: "Reception", subtitle: "Manage walk-ins and job cards" },
  "/dashboard/mechanic": { title: "My Jobs", subtitle: "Jobs assigned to you" },
  "/dashboard/cashier": { title: "Cashier Desk", subtitle: "Process payments and billing" },
  "/dashboard/inventory": { title: "Inventory Dashboard", subtitle: "Stock levels and alerts" },
  "/dashboard/job-cards": { title: "Job Cards", subtitle: "All repair jobs" },
  "/dashboard/customers": { title: "Customers", subtitle: "Customer records and history" },
  "/dashboard/vehicles": { title: "Vehicles", subtitle: "Registered vehicles" },
  "/dashboard/quotations": { title: "Quotations", subtitle: "Estimates and quotes" },
  "/dashboard/pos": { title: "Point of Sale", subtitle: "Process sales and billing" },
  "/dashboard/invoices": { title: "Invoices", subtitle: "All billing records" },
  "/dashboard/payments": { title: "Payments", subtitle: "Payment transactions" },
  "/dashboard/products": { title: "Products & Parts", subtitle: "Spare parts inventory" },
  "/dashboard/categories": { title: "Categories", subtitle: "Product categories" },
  "/dashboard/suppliers": { title: "Suppliers", subtitle: "Supplier directory" },
  "/dashboard/purchase-orders": { title: "Purchase Orders", subtitle: "Stock replenishment" },
  "/dashboard/stock-movements": { title: "Stock Movements", subtitle: "Inventory audit trail" },
  "/dashboard/reports": { title: "Reports & Analytics", subtitle: "Business intelligence" },
  "/dashboard/employees": { title: "Employees", subtitle: "Staff management" },
  "/dashboard/activity-log": { title: "Activity Log", subtitle: "System audit trail" },
  "/dashboard/settings": { title: "Settings", subtitle: "System configuration" },
};

export default function TopHeader({ user }: TopHeaderProps) {
  const pathname = usePathname();

  
  const pageKey = Object.keys(PAGE_TITLES)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];

  const page = PAGE_TITLES[pageKey] || { title: "Dashboard", subtitle: "" };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="top-header" id="top-header">
      {}
      <button
        className="btn btn-sm d-lg-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
        onClick={() => {
          const sidebar = document.getElementById("sidebar");
          sidebar?.classList.toggle("open");
        }}
      >
        <i className="bi bi-list fs-5"></i>
      </button>

      {}
      <div>
        <div className="header-title">{page.title}</div>
        {page.subtitle && (
          <div className="header-subtitle">{page.subtitle}</div>
        )}
      </div>

      {}
      <div className="header-actions">
        {}
        <span className={`badge bg-${ROLE_COLORS[user.role]} bg-opacity-75 d-none d-md-inline-flex`}>
          {ROLE_LABELS[user.role]}
        </span>

        {}
        <ThemeToggle />



        {}
        <div className="dropdown">
          <button
            className="d-flex align-items-center gap-2"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "8px",
              transition: "var(--transition)",
            }}
            data-bs-toggle="dropdown"
            aria-expanded="false"
            id="user-menu-btn"
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="d-none d-md-block text-start">
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                {user.email}
              </div>
            </div>
            <i className="bi bi-chevron-down d-none d-md-block" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}></i>
          </button>

          <ul className="dropdown-menu dropdown-menu-end mt-1" style={{ minWidth: 200 }}>
            <li>
              <div className="dropdown-item" style={{ cursor: "default" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {ROLE_LABELS[user.role]}
                </div>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <a className="dropdown-item" href="/dashboard/settings">
                <i className="bi bi-gear"></i> Settings
              </a>
            </li>
            <li>
              <button
                className="dropdown-item text-danger"
                id="signout-btn"
                onClick={handleSignOut}
              >
                <i className="bi bi-box-arrow-right"></i> Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
