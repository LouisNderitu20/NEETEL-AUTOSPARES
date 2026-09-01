"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface JobCardDetailClientProps {
  jobCard: any;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  currencySymbol: string;
}

export default function JobCardDetailClient({
  jobCard,
  currentUser,
  currencySymbol: sym,
}: JobCardDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isMechanic = currentUser.role === "MECHANIC";
  const isOwnerOrManager = ["IT_ADMIN", "OWNER", "MANAGER"].includes(currentUser.role);
  const isReceptionist = currentUser.role === "RECEPTIONIST";

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${jobCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }

      toast.success(`Job Card status updated to ${newStatus}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async () => {
    setLoading(true);
    try {
      
      const invoiceItems: any[] = [];
      
      
      jobCard.items.forEach((item: any) => {
        invoiceItems.push({
          productId: item.productId,
          description: `Part: ${item.product.name} (${item.product.sku})`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      });

      
      jobCard.services.forEach((s: any) => {
        invoiceItems.push({
          serviceId: s.serviceId,
          description: `Labor: ${s.service.name}`,
          quantity: s.hours || 1,
          unitPrice: s.rate || 0,
        });
      });

      
      if (jobCard.laborRate > 0) {
        invoiceItems.push({
          description: "General Diagnostics & Labor",
          quantity: 1,
          unitPrice: jobCard.laborRate,
        });
      }

      if (invoiceItems.length === 0) {
        throw new Error("Cannot generate invoice. Add parts or services first.");
      }

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobCardId: jobCard.id,
          customerId: jobCard.customerId,
          items: invoiceItems,
          discountAmount: 0,
          taxRate: 16, 
          notes: `Billed from Job Card ${jobCard.jobNumber}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate invoice");
      }

      const invoice = await res.json();
      toast.success(`Invoice ${invoice.invoiceNumber} created! Redirecting to POS checkout...`);
      router.push(`/dashboard/invoices/${invoice.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const createQuotation = async () => {
    setLoading(true);
    try {
      
      const quotationItems: any[] = [];

      jobCard.items.forEach((item: any) => {
        quotationItems.push({
          productId: item.productId,
          description: `Part: ${item.product.name}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      });

      jobCard.services.forEach((s: any) => {
        quotationItems.push({
          serviceId: s.serviceId,
          description: `Labor: ${s.service.name}`,
          quantity: s.hours || 1,
          unitPrice: s.rate || 0,
        });
      });

      if (jobCard.laborRate > 0) {
        quotationItems.push({
          description: "General Diagnostics & Labor",
          quantity: 1,
          unitPrice: jobCard.laborRate,
        });
      }

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobCardId: jobCard.id,
          customerId: jobCard.customerId,
          items: quotationItems,
          taxRate: 16,
          notes: `Quotation generated from Job Card ${jobCard.jobNumber}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate quotation");
      }

      const quote = await res.json();
      toast.success(`Quotation ${quote.quoteNumber} created successfully!`);
      router.push(`/dashboard/quotations/${quote.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const printJobCard = () => {
    window.print();
  };

  
  const partsCost = jobCard.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  const servicesCost = jobCard.services.reduce((sum: number, s: any) => sum + (s.totalPrice || 0), 0);
  const grandTotal = partsCost + servicesCost + jobCard.laborRate;

  return (
    <div className="animate-fade-up print-container">
      {}
      <div className="card mb-4 print-hide">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-3">
          <div className="d-flex align-items-center gap-2">
            <Link href="/dashboard/job-cards" className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0">{jobCard.jobNumber}</h4>
                <span className={`badge bg-primary bg-opacity-10 text-primary-custom`} style={{ fontSize: "0.75rem" }}>
                  {jobCard.status}
                </span>
              </div>
              <span className="text-muted small">Created on {new Date(jobCard.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {}
            <button onClick={printJobCard} className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-printer me-1"></i>Print Job Card
            </button>

            {}
            {jobCard.status === "PENDING" && (isOwnerOrManager || isReceptionist || isMechanic) && (
              <button onClick={() => updateStatus("APPROVED")} disabled={loading} className="btn btn-sm btn-outline-info">
                <i className="bi bi-check-lg me-1"></i>Approve Job Card
              </button>
            )}

            {(jobCard.status === "APPROVED" || (jobCard.status === "PENDING" && isMechanic)) && (
              <button onClick={() => updateStatus("IN_PROGRESS")} disabled={loading} className="btn btn-sm btn-outline-primary">
                <i className="bi bi-play-fill me-1"></i>Start Work
              </button>
            )}

            {["APPROVED", "IN_PROGRESS"].includes(jobCard.status) && (
              <Link href={`/dashboard/job-cards/${jobCard.id}/inspect`} className="btn btn-sm btn-outline-warning">
                <i className="bi bi-card-checklist me-1"></i>
                {jobCard.inspection ? "Edit Inspection" : "Perform Inspection"}
              </Link>
            )}

            {["APPROVED", "IN_PROGRESS"].includes(jobCard.status) && (
              <Link href={`/dashboard/job-cards/${jobCard.id}/edit`} className="btn btn-sm btn-primary">
                <i className="bi bi-plus-lg me-1"></i>Add Parts & Labor
              </Link>
            )}

            {jobCard.status === "IN_PROGRESS" && (isMechanic || isOwnerOrManager) && (
              <button onClick={() => updateStatus("COMPLETED")} disabled={loading} className="btn btn-sm btn-success text-white">
                <i className="bi bi-check-circle me-1"></i>Complete Repairs
              </button>
            )}

            {jobCard.status === "COMPLETED" && (isOwnerOrManager || isReceptionist || currentUser.role === "CASHIER") && (
              <>
                <button onClick={createQuotation} disabled={loading} className="btn btn-sm btn-outline-gold">
                  <i className="bi bi-file-earmark-spreadsheet me-1"></i>Generate Quote
                </button>
                <button onClick={createInvoice} disabled={loading} className="btn btn-sm btn-gold">
                  <i className="bi bi-credit-card me-1"></i>Generate Invoice (POS)
                </button>
              </>
            )}

            {jobCard.status === "BILLED" && jobCard.invoice && (
              <Link href={`/dashboard/invoices/${jobCard.invoice.id}`} className="btn btn-sm btn-gold">
                <i className="bi bi-receipt me-1"></i>View Invoice
              </Link>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="d-none d-print-block mb-4">
        <div className="d-flex align-items-center justify-content-between pb-3" style={{ borderBottom: "3px solid #c5a059" }}>
          <div className="d-flex align-items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="NEETEL AUTOSPARES Logo" 
              style={{ height: "65px", width: "65px", objectFit: "cover", borderRadius: "8px", border: "1px solid #c5a059" }} 
            />
            <div>
              <h3 className="h5 fw-bold mb-1" style={{ color: "#0f1013", letterSpacing: "0.5px" }}>NEETEL AUTOSPARES</h3>
              <p className="small text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                Garages, Diagnostics & Premium Auto Spare Parts Specialist
              </p>
              <p className="small text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                Kirinyaga Road, Nairobi, Kenya | Phone: +254 700 000 000 | PIN: P051682736C
              </p>
            </div>
          </div>
          <div className="text-end">
            <h4 className="fw-bold mb-1" style={{ color: "#c5a059", fontSize: "1.2rem" }}>WORK ORDER / JOB CARD</h4>
            <div className="small text-muted" style={{ fontSize: "0.78rem" }}>
              <div><strong>No:</strong> {jobCard.jobNumber}</div>
              <div><strong>Date:</strong> {new Date(jobCard.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {}
        <div className="col-12 col-lg-4">
          <div className="d-flex flex-column gap-4">
            {}
            <div className="card">
              <div className="card-header fw-bold">Customer Profile</div>
              <div className="card-body" style={{ fontSize: "0.85rem" }}>
                <h6 className="fw-bold mb-1">{jobCard.customer.name}</h6>
                {jobCard.customer.company && <p className="text-muted small mb-2">{jobCard.customer.company}</p>}
                <div className="d-flex flex-column gap-2 mt-3">
                  <div>
                    <span className="text-muted d-block small">Phone</span>
                    <span>{jobCard.customer.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted d-block small">Email Address</span>
                    <span>{jobCard.customer.email || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="card">
              <div className="card-header fw-bold">Vehicle Details</div>
              <div className="card-body" style={{ fontSize: "0.85rem" }}>
                <h6 className="fw-bold mb-1" style={{ color: "var(--primary-light)" }}>
                  {jobCard.vehicle.licensePlate}
                </h6>
                <div className="fw-semibold mb-3">{jobCard.vehicle.make} {jobCard.vehicle.model}</div>
                <div className="d-flex flex-column gap-2">
                  <div>
                    <span className="text-muted d-block small">Year / Color</span>
                    <span>{jobCard.vehicle.year} — {jobCard.vehicle.color || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted d-block small">Transmission / Fuel</span>
                    <span>{jobCard.vehicle.transmission} — {jobCard.vehicle.fuelType}</span>
                  </div>
                  {jobCard.vehicle.vin && (
                    <div>
                      <span className="text-muted d-block small">VIN Chassis</span>
                      <span>{jobCard.vehicle.vin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="card">
              <div className="card-header fw-bold">Staff Assignment</div>
              <div className="card-body" style={{ fontSize: "0.85rem" }}>
                <div className="d-flex flex-column gap-2">
                  <div>
                    <span className="text-muted d-block small">Assigned Mechanic</span>
                    <span className="fw-semibold">{jobCard.mechanic?.name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-muted d-block small">Booked By</span>
                    <span>{jobCard.createdBy.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="col-12 col-lg-8 d-flex flex-column gap-4">
          {}
          <div className="card">
            <div className="card-header fw-bold">Work Instructions & Complaints</div>
            <div className="card-body">
              <p className="mb-0" style={{ whiteSpace: "pre-line", fontSize: "0.9rem" }}>{jobCard.complaint}</p>
              {jobCard.notes && (
                <>
                  <hr className="my-3 border-light border-opacity-10" />
                  <span className="text-muted small d-block mb-1">Receptionist Notes:</span>
                  <p className="text-secondary mb-0 small" style={{ whiteSpace: "pre-line" }}>{jobCard.notes}</p>
                </>
              )}
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center fw-bold">
              <span>Vehicle Inspection Checklist</span>
              {jobCard.inspection && (
                <span className="small text-muted">
                  Odometer: <strong style={{ color: "var(--text-primary)" }}>{jobCard.inspection.odometer} km</strong>
                </span>
              )}
            </div>
            <div className="card-body p-0">
              {jobCard.inspection ? (
                <div className="table-responsive">
                  <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                    <tbody>
                      <tr>
                        <td className="fw-semibold" style={{ width: "30%" }}>Fuel Level</td>
                        <td>
                          <span className="badge bg-secondary">{jobCard.inspection.fuelLevel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Belongings / Items in Car</td>
                        <td className="text-secondary">{jobCard.inspection.belongings || "None declared"}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Body Scratch & Dent Log</td>
                        <td className="text-secondary">{jobCard.inspection.bodyDents || "No dents recorded"}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Fluids & Engine Bay</td>
                        <td className="text-secondary">{jobCard.inspection.fluidsCheck || "Ok"}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Brakes & Mechanicals</td>
                        <td className="text-secondary">{jobCard.inspection.brakesCheck || "Ok"}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Tires & Suspension</td>
                        <td className="text-secondary">{jobCard.inspection.tiresCheck || "Ok"}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Dashboard Lights / Electronics</td>
                        <td className="text-secondary">{jobCard.inspection.lightsCheck || "Ok"}</td>
                      </tr>
                      {jobCard.inspection.notes && (
                        <tr>
                          <td className="fw-semibold">Mechanic Recommendations</td>
                          <td className="text-warning fw-medium">{jobCard.inspection.notes}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-exclamation-circle fs-3 text-warning d-block mb-1"></i>
                  <span className="small">No inspection checklist recorded by the mechanic yet.</span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header fw-bold">Allocated Parts & Services</div>
            <div className="table-responsive">
              <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Type</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {}
                  {jobCard.items.map((item: any) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.product.name}</div>
                        <div className="text-muted small" style={{ fontSize: "0.72rem" }}>SKU: {item.product.sku}</div>
                      </td>
                      <td><span className="badge bg-secondary bg-opacity-25" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Spare Part</span></td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{sym}{item.unitPrice.toFixed(2)}</td>
                      <td className="text-end fw-semibold">{sym}{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}

                  {}
                  {jobCard.services.map((s: any) => (
                    <tr key={s.id}>
                      <td className="fw-semibold">{s.service.name}</td>
                      <td><span className="badge bg-primary bg-opacity-25 text-primary-custom" style={{ fontSize: "0.7rem" }}>Labor / Service</span></td>
                      <td className="text-center">{s.hours}</td>
                      <td className="text-end">{sym}{(s.rate || 0).toFixed(2)}</td>
                      <td className="text-end fw-semibold">{sym}{(s.totalPrice || 0).toFixed(2)}</td>
                    </tr>
                  ))}

                  {}
                  {jobCard.laborRate > 0 && (
                    <tr>
                      <td className="fw-semibold text-secondary">General Diagnostics & Labor</td>
                      <td><span className="badge bg-info bg-opacity-25 text-info" style={{ fontSize: "0.7rem" }}>Diagnostics</span></td>
                      <td className="text-center">1</td>
                      <td className="text-end">{sym}{jobCard.laborRate.toFixed(2)}</td>
                      <td className="text-end fw-semibold">{sym}{jobCard.laborRate.toFixed(2)}</td>
                    </tr>
                  )}

                  {}
                  {jobCard.items.length === 0 && jobCard.services.length === 0 && jobCard.laborRate === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No parts or services added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {}
            <div className="card-footer p-3 text-end">
              <span className="text-muted small me-2">Estimated Grand Total:</span>
              <span className="h5 fw-bold mb-0 text-success">{sym}{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
