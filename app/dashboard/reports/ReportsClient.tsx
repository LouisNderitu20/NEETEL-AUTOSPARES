"use client";

import { useState } from "react";
import Link from "next/link";

interface ReportsClientProps {
  invoices: any[];
  payments: any[];
  products: any[];
  jobCards: any[];
  customers: any[];
  stockMovements?: any[];
  currencySymbol: string;
}

type ReportTab = "sales" | "inventory" | "jobs" | "customers";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "M-Pesa",
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  PARTIAL: "Partial",
  DEPOSIT: "Deposit",
  CREDIT: "Credit",
  UNKNOWN: "Unknown",
};

export default function ReportsClient({
  invoices,
  payments,
  products,
  jobCards,
  customers,
  stockMovements = [],
  currencySymbol: sym,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [stockTypeFilter, setStockTypeFilter] = useState("all");
  const [stockSearchQuery, setStockSearchQuery] = useState("");

  
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  
  const filteredInvoices = invoices.filter((inv) => {
    const d = new Date(inv.createdAt);
    return d >= start && d <= end;
  });

  const filteredPayments = payments.filter((pay) => {
    const d = new Date(pay.createdAt);
    return d >= start && d <= end;
  });

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalReceived = filteredPayments.reduce((sum, pay) => sum + pay.amount, 0);
  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  
  const paymentsByMethod: Record<string, number> = {};
  filteredPayments.forEach((p) => {
    const m = p.method || "UNKNOWN";
    paymentsByMethod[m] = (paymentsByMethod[m] || 0) + p.amount;
  });

  
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalCostValue = products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
  const totalRetailValue = products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const potentialProfit = totalRetailValue - totalCostValue;

  
  const filteredStockMovements = stockMovements.filter((m) => {
    const d = new Date(m.createdAt);
    return d >= start && d <= end;
  });

  
  const stockBroughtInUnits = filteredStockMovements
    .filter((m) => m.quantity > 0)
    .reduce((sum, m) => sum + m.quantity, 0);

  const stockUsedOrGoneUnits = filteredStockMovements
    .filter((m) => m.quantity < 0)
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  
  const displayedStockMovements = filteredStockMovements
    .filter((m) => {
      if (stockTypeFilter === "in") return m.quantity > 0;
      if (stockTypeFilter === "out") return m.quantity < 0;
      if (stockTypeFilter !== "all") return m.type === stockTypeFilter;
      return true;
    })
    .filter((m) => {
      if (!stockSearchQuery.trim()) return true;
      const q = stockSearchQuery.toLowerCase();
      return (
        m.product?.name?.toLowerCase().includes(q) ||
        m.product?.sku?.toLowerCase().includes(q) ||
        m.notes?.toLowerCase().includes(q) ||
        m.reference?.toLowerCase().includes(q)
      );
    });

  
  const filteredJobs = jobCards.filter((job) => {
    const d = new Date(job.createdAt);
    return d >= start && d <= end;
  });

  
  const getJobTotal = (j: any): number => {
    const parts = (j.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0);
    const services = (j.services || []).reduce((s: number, svc: any) => s + (svc.totalPrice || 0), 0);
    const labor = j.laborRate || 0;
    return parts + services + labor;
  };

  const totalJobs = filteredJobs.length;
  const completedJobs = filteredJobs.filter((j) => j.status === "COMPLETED" || j.status === "BILLED").length;
  const inProgressJobs = filteredJobs.filter((j) => j.status === "IN_PROGRESS").length;
  const jobRevenue = filteredJobs.reduce((sum, j) => sum + getJobTotal(j), 0);

  
  const mechanicStats: Record<string, { count: number; totalValue: number }> = {};
  filteredJobs.forEach((j) => {
    const name = j.mechanic?.name || "Unassigned";
    if (!mechanicStats[name]) {
      mechanicStats[name] = { count: 0, totalValue: 0 };
    }
    mechanicStats[name].count += 1;
    mechanicStats[name].totalValue += getJobTotal(j);
  });

  
  
  const customerReportData = customers.map((c) => {
    const cInvoices = invoices.filter((i) => i.customerId === c.id);
    const spending = cInvoices.reduce((sum, i) => sum + i.total, 0);
    const debt = cInvoices.reduce((sum, i) => sum + i.balance, 0);
    return {
      name: c.name,
      phone: c.phone,
      company: c.company || "—",
      vehiclesCount: c.vehicles.length,
      spending,
      debt,
    };
  }).sort((a, b) => b.spending - a.spending); 

  
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = "";

    if (activeTab === "sales") {
      filename = `sales_report_${startDate}_to_${endDate}.csv`;
      headers = ["Invoice #", "Customer", "Date", "Invoice Total", "Outstanding Balance"];
      rows = filteredInvoices.map((i) => [
        i.invoiceNumber,
        i.customer.name,
        new Date(i.createdAt).toLocaleDateString(),
        i.total.toFixed(2),
        i.balance.toFixed(2),
      ]);
      
      rows.push([]);
      rows.push(["Total Invoiced", sym + totalInvoiced.toFixed(2)]);
      rows.push(["Total Payments Received", sym + totalReceived.toFixed(2)]);
      rows.push(["Total Outstanding Debt", sym + totalOutstanding.toFixed(2)]);
    } else if (activeTab === "inventory") {
      filename = `stock_movements_report_${startDate}_to_${endDate}.csv`;
      headers = ["Date & Time", "SKU", "Product Name", "Movement Type", "Quantity", "Balance Before", "Balance After", "Reference / Notes", "Logged By"];
      rows = filteredStockMovements.map((m) => [
        new Date(m.createdAt).toLocaleString(),
        m.product?.sku || "—",
        m.product?.name || "—",
        m.type,
        m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
        m.balanceBefore,
        m.balanceAfter,
        (m.notes || m.reference || "—").replace(/,/g, " "),
        m.user?.name || "System",
      ]);
      rows.push([]);
      rows.push(["Summary Statistics for Period", `${startDate} to ${endDate}`]);
      rows.push(["Total Stock Brought In", `+${stockBroughtInUnits} units`]);
      rows.push(["Total Stock Used / Gone", `-${stockUsedOrGoneUnits} units`]);
      rows.push(["Total Current Stock Count", `${totalItems} units`]);
      rows.push(["Total Inventory Cost Valuation", sym + totalCostValue.toFixed(2)]);
    } else if (activeTab === "jobs") {
      filename = `job_cards_report_${startDate}_to_${endDate}.csv`;
      headers = ["Job Card #", "Mechanic", "Status", "Billed Amount", "Date Created"];
      rows = filteredJobs.map((j) => [
        j.jobNumber,
        j.mechanic?.name || "Unassigned",
        j.status,
        getJobTotal(j).toFixed(2),
        new Date(j.createdAt).toLocaleDateString(),
      ]);
      rows.push([]);
      rows.push(["Total Job Cards", totalJobs]);
      rows.push(["Completed Job Cards", completedJobs]);
      rows.push(["Estimated Revenue Billed", sym + jobRevenue.toFixed(2)]);
    } else if (activeTab === "customers") {
      filename = `customer_spending_report_${todayStr}.csv`;
      headers = ["Customer Name", "Phone", "Company", "Cars Registered", "Total Spending", "Outstanding Debt"];
      rows = customerReportData.map((c) => [
        c.name,
        c.phone,
        c.company,
        c.vehiclesCount,
        c.spending.toFixed(2),
        c.debt.toFixed(2),
      ]);
    }

    const csvRows = [
      headers.join(","),
      ...rows.map((row: any[]) =>
        row
          .map((val: any) => {
            const str = String(val ?? "").replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Printable PDF Header */}
      <div className="d-none d-print-block mb-4 pb-3 border-bottom text-dark">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h3 className="fw-bold mb-1" style={{ color: "#17181c" }}>NEETEL AUTOSPARES & GARAGE</h3>
            <p className="small mb-0 text-secondary">Enterprise Road, Industrial Area, Nairobi, Kenya • Tel: +254 700 123 456</p>
            <p className="small mb-0 text-secondary">Email: info@neetelautospares.co.ke • Web: www.neetelautospares.co.ke</p>
          </div>
          <div className="text-end">
            <h5 className="fw-bold text-uppercase mb-1" style={{ color: "#c5a059" }}>
              {activeTab === "sales" && "Financial & Sales Performance Report"}
              {activeTab === "inventory" && "Inventory Valuation & Stock Movement Report"}
              {activeTab === "jobs" && "Mechanic Workload & Productivity Report"}
              {activeTab === "customers" && "Customer Accounts & Debt Statement"}
            </h5>
            <p className="small mb-0 text-muted"><strong>Period:</strong> {startDate} to {endDate}</p>
            <p className="small mb-0 text-muted"><strong>Generated On:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Date Filter & Export Controls Bar */}
      <div className="card mb-4 print-hide">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-3">
          <div className="d-flex align-items-center gap-3">
            <div>
              <label className="form-label small text-muted mb-1">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label small text-muted mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button onClick={handleExportCSV} className="btn btn-sm btn-outline-success fw-semibold">
              <i className="bi bi-file-earmark-excel me-1"></i>Export Excel (.csv)
            </button>
            <button onClick={handlePrint} className="btn btn-sm btn-primary fw-semibold">
              <i className="bi bi-file-earmark-pdf me-1"></i>Export / Print PDF
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="nav nav-tabs border-bottom border-light border-opacity-10 mb-4 print-hide">
        <button
          className={`nav-link fw-semibold px-4 py-2 ${activeTab === "sales" ? "active text-primary" : "text-secondary"}`}
          onClick={() => setActiveTab("sales")}
        >
          Sales & Revenue
        </button>
        <button
          className={`nav-link fw-semibold px-4 py-2 ${activeTab === "inventory" ? "active text-primary" : "text-secondary"}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory Valuation
        </button>
        <button
          className={`nav-link fw-semibold px-4 py-2 ${activeTab === "jobs" ? "active text-primary" : "text-secondary"}`}
          onClick={() => setActiveTab("jobs")}
        >
          Job Cards (Labour)
        </button>
        <button
          className={`nav-link fw-semibold px-4 py-2 ${activeTab === "customers" ? "active text-primary" : "text-secondary"}`}
          onClick={() => setActiveTab("customers")}
        >
          Customer Spending
        </button>
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
              <h3 className="h5 fw-bold mb-1" style={{ color: "#0f1013" }}>NEETEL AUTOSPARES</h3>
              <p className="small text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                Garages, Diagnostics & Premium Auto Spare Parts Specialist
              </p>
              <p className="small text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                Kirinyaga Road, Nairobi, Kenya | Phone: +254 700 000 000
              </p>
            </div>
          </div>
          <div className="text-end">
            <h4 className="fw-bold mb-1" style={{ color: "#c5a059", fontSize: "1.2rem", textTransform: "uppercase" }}>
              {activeTab === "sales" && "Sales & Revenue Report"}
              {activeTab === "inventory" && "Inventory Valuation Report"}
              {activeTab === "jobs" && "Job Cards Performance Report"}
              {activeTab === "customers" && "Customer Leaderboard Report"}
            </h4>
            <div className="small text-muted" style={{ fontSize: "0.75rem" }}>
              {activeTab !== "inventory" && activeTab !== "customers" ? (
                <div><strong>Period:</strong> {startDate} to {endDate}</div>
              ) : (
                <div><strong>Date Generated:</strong> {todayStr}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {}
      {activeTab === "sales" && (
        <div className="row g-4 animate-fade-up">
          {}
          <div className="col-12 col-md-4">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Total Invoiced Amount</span>
                <h4 className="fw-bold mb-0 text-primary-custom">{sym}{totalInvoiced.toFixed(2)}</h4>
              </div>
              <i className="bi bi-file-earmark-text fs-3 text-muted"></i>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Total Received Cash</span>
                <h4 className="fw-bold mb-0 text-success">{sym}{totalReceived.toFixed(2)}</h4>
              </div>
              <i className="bi bi-cash-coin fs-3 text-muted"></i>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Outstanding Debt</span>
                <h4 className="fw-bold mb-0 text-danger">{sym}{totalOutstanding.toFixed(2)}</h4>
              </div>
              <i className="bi bi-exclamation-circle fs-3 text-muted"></i>
            </div>
          </div>

          {}
          <div className="col-12 col-lg-8">
            <div className="card h-100">
              <div className="card-header fw-semibold">Detailed Invoice Ledger</div>
              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link href={`/dashboard/invoices/${inv.id}`} className="text-decoration-none fw-semibold">
                            <code className="text-primary-custom" style={{ cursor: "pointer" }}>{inv.invoiceNumber}</code>
                          </Link>
                        </td>
                        <td>
                          <Link href={`/dashboard/customers/${inv.customerId}`} className="text-decoration-none fw-semibold text-primary-custom">
                            {inv.customer.name}
                          </Link>
                        </td>
                        <td className="text-muted">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td>{sym}{inv.total.toFixed(2)}</td>
                        <td className={inv.balance > 0 ? "text-danger fw-medium" : "text-success fw-medium"}>
                          {sym}{inv.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">No sales invoices found in this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {}
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-semibold">Payments by Method</div>
              <div className="card-body">
                {Object.keys(paymentsByMethod).length === 0 ? (
                  <div className="text-center text-muted py-5">No payments received in this range.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {Object.entries(paymentsByMethod).map(([method, amount]) => (
                      <div key={method} className="p-3 rounded border border-light border-opacity-10 bg-light bg-opacity-5">
                        <span className="text-muted small d-block text-uppercase fw-semibold">
                          {PAYMENT_METHOD_LABELS[method] || method.replace("_", " ")}
                        </span>
                        <strong className="fs-5 text-success">{sym}{amount.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === "inventory" && (
        <div className="row g-4 animate-fade-up">
          {}
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Stock On Hand</span>
                <h4 className="fw-bold mb-0 text-info">{totalItems} units</h4>
              </div>
              <i className="bi bi-box-seam fs-3 text-muted"></i>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Stock Brought In (Selected Period)</span>
                <h4 className="fw-bold mb-0 text-success">+{stockBroughtInUnits} units</h4>
              </div>
              <i className="bi bi-arrow-down-left-circle fs-3 text-success"></i>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Stock Used / Gone (Selected Period)</span>
                <h4 className="fw-bold mb-0 text-danger">-{stockUsedOrGoneUnits} units</h4>
              </div>
              <i className="bi bi-arrow-up-right-circle fs-3 text-danger"></i>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Total Inventory Asset Cost</span>
                <h4 className="fw-bold mb-0 text-primary-custom">{sym}{totalCostValue.toFixed(2)}</h4>
              </div>
              <i className="bi bi-tags fs-3 text-muted"></i>
            </div>
          </div>

          {}
          <div className="col-12">
            <div className="card">
              <div className="card-header py-3">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                  <div>
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-clock-history me-2 text-warning"></i>
                      Stock Movements & Usage Audit Log ({startDate} to {endDate})
                    </h6>
                    <small className="text-muted">Track what stock was brought in, used in job cards, or sold in POS</small>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search product or SKU..."
                      style={{ width: "200px" }}
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                    />
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "210px" }}
                      value={stockTypeFilter}
                      onChange={(e) => setStockTypeFilter(e.target.value)}
                    >
                      <option value="all">All Movement Types</option>
                      <option value="in">📥 Stock Brought In (Restock)</option>
                      <option value="out">📤 Stock Used / Gone</option>
                      <option value="PURCHASE">📦 Purchase Order / Restock</option>
                      <option value="JOB_CARD">🔧 Mechanic Job Card Usage</option>
                      <option value="SALE">🛒 POS Cash Sales</option>
                      <option value="ADJUSTMENT">⚙️ Manual Stock Adjustments</option>
                      <option value="RETURN">🔄 Customer Returns</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Product / Spare Part</th>
                      <th>Movement Event</th>
                      <th className="text-center">Quantity Change</th>
                      <th className="text-center">Stock Balance</th>
                      <th>Reference / Reason</th>
                      <th>Logged By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStockMovements.map((m) => {
                      const isPositive = m.quantity > 0;
                      const typeBadgeConfig: Record<string, { label: string; bg: string; color: string }> = {
                        PURCHASE: { label: "Stock Brought In", bg: "rgba(16,185,129,0.15)", color: "#10b981" },
                        SALE: { label: "POS Cash Sale", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
                        JOB_CARD: { label: "Job Card Used", bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
                        ADJUSTMENT: { label: "Adjustment", bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
                        RETURN: { label: "Customer Return", bg: "rgba(14,165,233,0.15)", color: "#0ea5e9" },
                      };
                      const cfg = typeBadgeConfig[m.type] || { label: m.type, bg: "rgba(100,116,139,0.15)", color: "#64748b" };

                      return (
                        <tr key={m.id}>
                          <td className="text-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                          <td>
                            <div>
                              <span className="fw-semibold d-block">{m.product?.name || "Unknown Product"}</span>
                              <code className="small text-muted">{m.product?.sku}</code>
                            </div>
                          </td>
                          <td>
                            <span className="badge px-2 py-1" style={{ background: cfg.bg, color: cfg.color, fontSize: "0.72rem" }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="text-center fw-bold">
                            <span style={{ color: isPositive ? "#10b981" : "#ef4444" }}>
                              {isPositive ? `+${m.quantity}` : m.quantity} {m.product?.unit || "pcs"}
                            </span>
                          </td>
                          <td className="text-center text-muted small">
                            {m.balanceBefore} ➔ <strong className="text-primary-custom">{m.balanceAfter}</strong>
                          </td>
                          <td>
                            <span className="small text-secondary">{m.notes || m.reference || "—"}</span>
                          </td>
                          <td>
                            <span className="small text-muted">{m.user?.name || "System"}</span>
                          </td>
                        </tr>
                      );
                    })}

                    {displayedStockMovements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No stock movement history found for the selected date range and filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {}
          <div className="col-12">
            <div className="card">
              <div className="card-header fw-semibold">Inventory Current Stock Valuation Ledger</div>
              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Description</th>
                      <th>Category</th>
                      <th className="text-center">Stock</th>
                      <th className="text-end">Unit Cost</th>
                      <th className="text-end">Unit Selling</th>
                      <th className="text-end">Cost Valuation</th>
                      <th className="text-end">Retail Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/dashboard/products?search=${encodeURIComponent(p.sku)}`} className="text-decoration-none">
                            <code className="text-primary-custom" style={{ cursor: "pointer" }}>{p.sku}</code>
                          </Link>
                        </td>
                        <td>
                          <Link href={`/dashboard/products?search=${encodeURIComponent(p.name)}`} className="text-decoration-none fw-semibold text-primary-custom">
                            {p.name}
                          </Link>
                        </td>
                        <td>{p.category.name}</td>
                        <td className="text-center">{p.quantity} {p.unit}</td>
                        <td className="text-end">{sym}{p.purchasePrice.toFixed(2)}</td>
                        <td className="text-end">{sym}{p.sellingPrice.toFixed(2)}</td>
                        <td className="text-end">{sym}{(p.purchasePrice * p.quantity).toFixed(2)}</td>
                        <td className="text-end fw-semibold text-success">{sym}{(p.sellingPrice * p.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-5">No products registered in the database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === "jobs" && (
        <div className="row g-4 animate-fade-up">
          {}
          <div className="col-12 col-md-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Total Jobs Initiated</span>
                <h4 className="fw-bold mb-0 text-primary-custom">{totalJobs}</h4>
              </div>
              <i className="bi bi-wrench-adjustable fs-3 text-muted"></i>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Completed / Billed</span>
                <h4 className="fw-bold mb-0 text-success">{completedJobs}</h4>
              </div>
              <i className="bi bi-check2-circle fs-3 text-muted"></i>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">In Workshop / Active</span>
                <h4 className="fw-bold mb-0 text-warning">{inProgressJobs}</h4>
              </div>
              <i className="bi bi-clock-history fs-3 text-muted"></i>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">Estimated Job Value</span>
                <h4 className="fw-bold mb-0 text-success">{sym}{jobRevenue.toFixed(2)}</h4>
              </div>
              <i className="bi bi-cash-stack fs-3 text-muted"></i>
            </div>
          </div>

          {}
          <div className="col-12 col-lg-8">
            <div className="card h-100">
              <div className="card-header fw-semibold">Job Card Listing</div>
              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Job #</th>
                      <th>Mechanic</th>
                      <th>Status</th>
                      <th>Total Cost</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((j) => (
                      <tr key={j.id}>
                        <td><code style={{ color: "var(--primary-light)" }}>{j.jobNumber}</code></td>
                        <td>{j.mechanic?.name || "Unassigned"}</td>
                        <td>
                          <span className="badge bg-secondary bg-opacity-25" style={{ color: "var(--text-secondary)" }}>
                            {j.status}
                          </span>
                        </td>
                        <td className="fw-semibold">{sym}{getJobTotal(j).toFixed(2)}</td>
                        <td className="text-muted">{new Date(j.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {filteredJobs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">No service jobs created in this date range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {}
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-semibold">Mechanic Productivity</div>
              <div className="card-body">
                {Object.keys(mechanicStats).length === 0 ? (
                  <div className="text-center text-muted py-5">No jobs allocated in this date range.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {Object.entries(mechanicStats).sort((a,b) => b[1].totalValue - a[1].totalValue).map(([name, stats]) => (
                      <div key={name} className="d-flex align-items-center justify-content-between p-2 rounded border border-light border-opacity-10">
                        <div>
                          <strong className="d-block small">{name}</strong>
                          <span className="text-muted small">{stats.count} jobs completed</span>
                        </div>
                        <span className="fw-bold text-primary-custom" style={{ fontSize: "0.9rem" }}>
                          {sym}{stats.totalValue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === "customers" && (
        <div className="row g-4 animate-fade-up">
          <div className="col-12">
            <div className="card">
              <div className="card-header fw-semibold">Customer spending & Debt leaderboard</div>
              <div className="table-responsive">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>Company</th>
                      <th className="text-center">Cars Registered</th>
                      <th className="text-end">Total Spending</th>
                      <th className="text-end">Outstanding Debt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReportData.map((c, index) => (
                      <tr key={index}>
                        <td className="fw-semibold">
                          <span className="text-muted small me-2">#{index + 1}</span>
                          {c.name}
                        </td>
                        <td>{c.phone}</td>
                        <td className="text-muted">{c.company}</td>
                        <td className="text-center">
                          <span className="badge bg-primary bg-opacity-15 text-primary-custom">
                            {c.vehiclesCount} cars
                          </span>
                        </td>
                        <td className="text-end fw-semibold text-success">{sym}{c.spending.toFixed(2)}</td>
                        <td className="text-end fw-semibold text-danger">{sym}{c.debt.toFixed(2)}</td>
                      </tr>
                    ))}
                    {customerReportData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-5">No customer database records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
