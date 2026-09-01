import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/permissions";

export const metadata = { title: "Employee Login History" };

export default async function LoginHistoryPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER"].includes(session.user.role)) redirect("/dashboard/overview");

  
  const logs = await prisma.sessionLog.findMany({
    orderBy: { loginAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    take: 100, 
  });

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link href="/dashboard/employees" className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-arrow-left"></i>
            </Link>
            <h2 className="h5 fw-bold mb-0">Staff Login History</h2>
          </div>
          <p className="text-muted small mb-0">Showing latest employee access and session times</p>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const loginDate = new Date(log.loginAt);
                let logoutDate = log.logoutAt ? new Date(log.logoutAt) : null;

                
                const timeoutMinutes = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || "15", 10);
                const isExpired = !logoutDate && (Date.now() - loginDate.getTime() > timeoutMinutes * 60 * 1000);
                
                
                const isSuperceded = !logoutDate && logs.some((other, oIdx) => oIdx < index && other.user?.email === log.user?.email);

                const isActiveOnline = !logoutDate && !isExpired && !isSuperceded;

                let durationStr = isActiveOnline ? "Active Session" : "Expired / Closed";
                if (logoutDate) {
                  const diffMs = logoutDate.getTime() - loginDate.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const hrs = Math.floor(diffMins / 60);
                  const mins = diffMins % 60;
                  durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                }

                return (
                  <tr key={log.id}>
                    <td>
                      <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{log.user.name}</div>
                      <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{log.user.email}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-50" style={{ fontSize: "0.72rem" }}>
                        {ROLE_LABELS[log.user.role]}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {loginDate.toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {logoutDate ? (
                        logoutDate.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      ) : isActiveOnline ? (
                        <span className="badge bg-success" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", borderRadius: "10px" }}>
                          <span className="spinner-grow spinner-grow-sm me-1" role="status" style={{ width: "8px", height: "8px", verticalAlign: "middle" }} />
                          Online
                        </span>
                      ) : (
                        <span className="text-muted small" style={{ fontSize: "0.75rem" }}>Session Expired</span>
                      )}
                    </td>
                    <td className="fw-medium" style={{ fontSize: "0.82rem", color: isActiveOnline ? "var(--success)" : "var(--text-secondary)" }}>
                      {durationStr}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    No login logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
