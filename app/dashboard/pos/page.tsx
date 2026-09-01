import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import POSTerminal from "./POSTerminal";

export const metadata = { title: "Point of Sale (POS)" };

export default async function POSPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["IT_ADMIN", "OWNER", "MANAGER", "CASHIER"].includes(session.user.role)) {
    redirect("/dashboard/overview");
  }

  
  let [products, customers, categories] = await Promise.all([
    prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  
  let walkInCustomer = customers.find(
    (c) => c.name.toLowerCase() === "walk-in customer" || c.phone === "0000000000"
  );
  if (!walkInCustomer) {
    walkInCustomer = await prisma.customer.create({
      data: {
        name: "Walk-In Customer",
        phone: "0000000000",
        email: "walkin@garage.local",
        address: "Over the Counter",
      },
    });
    customers = [walkInCustomer, ...customers];
  }

  
  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || "KSh";

  return (
    <div className="container py-2">
      <POSTerminal
        products={products}
        customers={customers}
        categories={categories}
        currencySymbol={sym}
        defaultCustomerId={walkInCustomer.id}
      />
    </div>
  );
}
