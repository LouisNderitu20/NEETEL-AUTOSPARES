"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/permissions";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard/overview", icon: "bi-speedometer2", label: "Overview", roles: ["IT_ADMIN", "OWNER", "MANAGER"] as UserRole[] },
      { href: "/dashboard/reception", icon: "bi-person-workspace", label: "Reception Desk", roles: ["RECEPTIONIST"] as UserRole[] },
      { href: "/dashboard/mechanic", icon: "bi-tools", label: "Mechanic Bay", roles: ["MECHANIC"] as UserRole[] },
      { href: "/dashboard/cashier", icon: "bi-cash-register", label: "Cashier Desk", roles: ["CASHIER"] as UserRole[] },
      { href: "/dashboard/inventory", icon: "bi-boxes", label: "Inventory Dashboard", roles: ["INVENTORY_CLERK"] as UserRole[] },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/dashboard/job-cards",
        icon: "bi-card-checklist",
        label: "Job Cards",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "MECHANIC", "CASHIER"] as UserRole[],
      },
      {
        href: "/dashboard/customers",
        icon: "bi-people-fill",
        label: "Customers",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "CASHIER"] as UserRole[],
      },
      {
        href: "/dashboard/vehicles",
        icon: "bi-car-front",
        label: "Vehicles",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"] as UserRole[],
      },
      {
        href: "/dashboard/quotations",
        icon: "bi-file-earmark-text",
        label: "Quotations",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "CASHIER"] as UserRole[],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        href: "/dashboard/pos",
        icon: "bi-bag-fill",
        label: "Point of Sale",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "CASHIER"] as UserRole[],
      },
      {
        href: "/dashboard/invoices",
        icon: "bi-receipt",
        label: "Invoices",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "CASHIER"] as UserRole[],
      },
      {
        href: "/dashboard/payments",
        icon: "bi-credit-card",
        label: "Payments",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "CASHIER"] as UserRole[],
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        href: "/dashboard/products",
        icon: "bi-box-seam",
        label: "Products",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK", "MECHANIC", "CASHIER"] as UserRole[],
      },
      {
        href: "/dashboard/categories",
        icon: "bi-tags-fill",
        label: "Categories",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"] as UserRole[],
      },
      {
        href: "/dashboard/suppliers",
        icon: "bi-truck",
        label: "Suppliers",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"] as UserRole[],
      },
      {
        href: "/dashboard/purchase-orders",
        icon: "bi-bag-plus",
        label: "Purchase Orders",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"] as UserRole[],
      },
      {
        href: "/dashboard/stock-movements",
        icon: "bi-arrow-left-right",
        label: "Stock Movements",
        roles: ["IT_ADMIN", "OWNER", "MANAGER", "INVENTORY_CLERK"] as UserRole[],
      },
    ],
  },
  {
    title: "Reports & Admin",
    items: [
      {
        href: "/dashboard/reports",
        icon: "bi-graph-up-arrow",
        label: "Reports",
        roles: ["IT_ADMIN", "OWNER", "MANAGER"] as UserRole[],
      },
      {
        href: "/dashboard/employees",
        icon: "bi-person-badge-fill",
        label: "Employees",
        roles: ["IT_ADMIN", "OWNER", "MANAGER"] as UserRole[],
      },
      {
        href: "/dashboard/employees/history",
        icon: "bi-clock-history",
        label: "Login History",
        roles: ["IT_ADMIN", "OWNER"] as UserRole[],
      },
      {
        href: "/dashboard/activity-log",
        icon: "bi-journal-text",
        label: "Activity Log",
        roles: ["IT_ADMIN", "OWNER", "MANAGER"] as UserRole[],
      },
      {
        href: "/dashboard/settings",
        icon: "bi-gear-fill",
        label: "System Settings",
        roles: ["IT_ADMIN", "OWNER", "MANAGER"] as UserRole[],
      },
    ],
  },
];

interface SidebarProps {
  user: { name: string; email: string; role: UserRole; avatar?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(user.role)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="sidebar" id="sidebar">
      {}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ overflow: "hidden", background: "none" }}>
          <img src="/logo.jpg" alt="NEETEL Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div className="sidebar-logo-text" style={{ letterSpacing: "1px", fontWeight: 800 }}>NEETEL</div>
          <div className="sidebar-logo-sub" style={{ letterSpacing: "1.5px", fontSize: "0.62rem", color: "var(--primary-light)" }}>AUTOSPARES</div>
        </div>
      </div>

      {}
      <nav className="sidebar-nav">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <div className="sidebar-section">{section.title}</div>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard/overview" &&
                  item.href !== "/dashboard/reception" &&
                  item.href !== "/dashboard/mechanic" &&
                  item.href !== "/dashboard/cashier" &&
                  item.href !== "/dashboard/inventory" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`sidebar-badge badge bg-${item.badgeColor || "primary"}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#f8fafc",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
              {ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
