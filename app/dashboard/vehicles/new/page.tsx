import { auth } from "@/auth";
import { redirect } from "next/navigation";
import VehicleNewForm from "./VehicleNewForm";

export const metadata = { title: "Register Vehicle" };

export default async function RegisterVehiclePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  return (
    <div className="container py-2">
      <VehicleNewForm />
    </div>
  );
}
