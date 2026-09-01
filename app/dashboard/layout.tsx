import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import BootstrapProvider from "@/components/providers/BootstrapProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import SessionTimeoutProvider from "@/components/providers/SessionTimeoutProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <BootstrapProvider>
      <SessionTimeoutProvider>
        <ToastProvider />
        <div className="dashboard-layout">
          <Sidebar user={session.user} />
          <div className="main-content">
            <TopHeader user={session.user} />
            <main className="page-content">{children}</main>
          </div>
        </div>
      </SessionTimeoutProvider>
    </BootstrapProvider>
  );
}
