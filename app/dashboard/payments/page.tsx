import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const payments = await prisma.payment.findMany({
    orderBy: { processedAt: 'desc' },
    take: 100,
    include: {
      invoice: {
        include: {
          customer: { select: { name: true } },
          jobCard: { select: { jobNumber: true } },
        },
      },
    },
  });

  const settings = await prisma.garageSettings.findFirst();
  const sym = settings?.currencySymbol || '$';

  const methodInfo: Record<string, { icon: string; label: string; color: string }> = {
    MOBILE_MONEY:  { icon: 'bi-phone',         label: 'M-Pesa',         color: '#43a047' },
    CASH:          { icon: 'bi-cash-stack',    label: 'Cash',           color: '#ef6c00' },
    CARD:          { icon: 'bi-credit-card',   label: 'Card',           color: '#1565c0' },
    BANK_TRANSFER: { icon: 'bi-bank',          label: 'Bank Transfer',  color: '#6a1b9a' },
    PARTIAL:       { icon: 'bi-pie-chart',     label: 'Partial',        color: '#f9a825' },
    DEPOSIT:       { icon: 'bi-safe',          label: 'Deposit',        color: '#00838f' },
    CREDIT:        { icon: 'bi-clock-history', label: 'Credit',         color: '#c62828' },
  };

  const getMethodInfo = (m: string) =>
    methodInfo[m] || { icon: 'bi-wallet2', label: m.replace('_', ' '), color: '#757575' };

  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <h2 className="h5 fw-bold mb-0">Payment Transactions</h2>
        <p className="text-muted small mb-0">Last 100 transactions — click any row to view receipt</p>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Job Card</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Reference</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const m = getMethodInfo(p.method);
                return (
                  <tr key={p.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(p.processedAt).toLocaleString()}
                    </td>
                    <td className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                      {p.invoice?.customer?.name || '—'}
                    </td>
                    <td>
                      {p.invoice ? (
                        <Link href={`/dashboard/invoices/${p.invoice.id}`} className="text-decoration-none">
                          <code style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>
                            {p.invoice.invoiceNumber}
                          </code>
                        </Link>
                      ) : '—'}
                    </td>
                    <td>
                      {p.invoice?.jobCard ? (
                        <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {p.invoice.jobCard.jobNumber}
                        </code>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge d-inline-flex align-items-center gap-1"
                        style={{ backgroundColor: m.color, color: '#fff', fontSize: '0.72rem' }}
                      >
                        <i className={`bi ${m.icon}`}></i>
                        {m.label}
                      </span>
                    </td>
                    <td className="fw-bold" style={{ color: '#10b981' }}>
                      {sym}{p.amount.toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.reference || '—'}
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/payments/${p.id}`}
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <i className="bi bi-receipt me-1"></i>Receipt
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5">
                    No payments yet.
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
