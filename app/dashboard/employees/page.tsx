import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import Link from "next/link";
import RoleSelector from "@/components/employees/RoleSelector";
import DeleteEmployeeButton from "@/components/employees/DeleteEmployeeButton";

export const metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["OWNER", "MANAGER", "IT_ADMIN"].includes(session.user.role)) redirect("/dashboard/overview");

  const employees = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Employees</h2>
          <p className="text-muted small mb-0">{employees.length} staff members</p>
        </div>
        <div className="d-flex gap-2">
          {["IT_ADMIN", "OWNER"].includes(session.user.role) && (
            <Link href="/dashboard/employees/history" className="btn btn-outline-secondary btn-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-clock-history me-1"></i>Login History
            </Link>
          )}
          <Link href="/dashboard/employees/new" className="btn btn-primary btn-sm">
            <i className="bi bi-person-plus-fill me-1"></i>Add Employee
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>Employee</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                        {e.name.charAt(0)}
                      </div>
                      <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{e.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>{e.email}</td>
                  <td style={{ fontSize: "0.82rem" }}>{e.phone || "—"}</td>
                  <td>
                    <RoleSelector
                      employeeId={e.id}
                      currentRole={e.role}
                      isOwner={["IT_ADMIN", "OWNER"].includes(session.user.role)}
                      currentUserEmail={session.user.email}
                      employeeEmail={e.email}
                      currentUserRole={session.user.role}
                    />
                  </td>
                  <td>
                    {e.isActive
                      ? <span className="status-badge status-billed">Active</span>
                      : <span className="status-badge status-cancelled">Inactive</span>}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Link href={`/dashboard/employees/${e.id}/edit`} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                        Edit
                      </Link>
                      <DeleteEmployeeButton
                        employeeId={e.id}
                        employeeName={e.name}
                        employeeRole={e.role}
                        currentUserRole={session.user.role}
                        isOwner={["IT_ADMIN", "OWNER"].includes(session.user.role)}
                        currentUserEmail={session.user.email}
                        employeeEmail={e.email}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-5">No employees yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
