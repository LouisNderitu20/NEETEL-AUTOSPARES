import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) redirect("/dashboard/overview");

  const settings = await prisma.garageSettings.findFirst();

  return (
    <div className="animate-fade-up">
      <h2 className="h5 fw-bold mb-4">System Settings</h2>
      <SettingsForm initialSettings={settings ? JSON.parse(JSON.stringify(settings)) : null} />
    </div>
  );
}
