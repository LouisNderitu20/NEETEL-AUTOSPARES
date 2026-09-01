import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const icons = [
    "bi-gear", "bi-circle", "bi-battery-full", "bi-disc",
    "bi-funnel", "bi-droplet", "bi-lightning", "bi-arrow-up-down",
    "bi-car-front", "bi-stars",
  ];

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold mb-0">Product Categories</h2>
          <p className="text-muted small mb-0">{categories.length} categories</p>
        </div>
      </div>
      <div className="row g-3">
        {categories.map((c, i) => (
          <div key={c.id} className={`col-6 col-md-4 col-lg-3 animate-fade-up delay-${(i % 4) + 1}`}>
            <div className="card text-center p-3">
              <i className={`bi ${icons[i % icons.length]} fs-2 mb-2`} style={{ color: "var(--primary-light)" }}></i>
              <div className="fw-semibold">{c.name}</div>
              <div className="text-muted" style={{ fontSize: "0.78rem" }}>{c._count.products} products</div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-12 text-center text-muted py-5">No categories yet.</div>
        )}
      </div>
    </div>
  );
}
