import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Activity Log" };

export default async function ActivityLogPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) redirect("/dashboard/overview");

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, role: true } } },
  });

  const actionColors: Record<string, { bg: string; text: string }> = {
    CREATE:       { bg: "#d1fae5", text: "#065f46" },
    UPDATE:       { bg: "#dbeafe", text: "#1e40af" },
    DELETE:       { bg: "#fee2e2", text: "#991b1b" },
    LOGIN:        { bg: "#ede9fe", text: "#4c1d95" },
    LOGOUT:       { bg: "#f1f5f9", text: "#475569" },
    PAYMENT:      { bg: "#fef3c7", text: "#92400e" },
    STOCK_OUT:    { bg: "#ffedd5", text: "#9a3412" },
    STOCK_IN:     { bg: "#d1fae5", text: "#065f46" },
    APPROVE:      { bg: "#ede9fe", text: "#4c1d95" },
    JOB_STARTED:  { bg: "#dbeafe", text: "#1e40af" },
    JOB_COMPLETED:{ bg: "#d1fae5", text: "#065f46" },
    JOB_BILLED:   { bg: "#ede9fe", text: "#4c1d95" },
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <h2 className="h5 fw-bold mb-0">Activity Log</h2>
        <p className="text-muted small mb-0">Complete system audit trail — last 200 entries</p>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Description</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{l.user.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{l.user.role}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: (actionColors[l.action] || { bg: "#f1f5f9" }).bg, color: (actionColors[l.action] || { text: "#475569" }).text, fontSize: "0.68rem" }}>
                      {l.action.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                      {l.module}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", maxWidth: 400 }}>{l.description}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-5">No activity recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
