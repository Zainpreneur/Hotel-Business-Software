import { useCallback } from "react";
import { Link } from "react-router-dom";
import { invoicesApi } from "../api/endpoints";
import { useAsync } from "../hooks/useAsync";
import { Card, EmptyState, ErrorBanner, Spinner } from "../components/ui";
import { currency, dateShort } from "../lib/format";

export function BillingPage() {
  const { data: invoices, loading, error } = useAsync(useCallback(() => invoicesApi.list(), []));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500">Invoices generated from checked-out reservations.</p>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {invoices && invoices.length === 0 && (
        <EmptyState title="No invoices yet" subtitle="Generate an invoice from a reservation's detail page." />
      )}

      {invoices && invoices.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Subtotal</th>
                <th className="px-4 py-3 font-medium">Tax</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <Link to={`/reservations/${inv.reservationId}`} className="text-slate-700 hover:underline">
                      {inv.reservation?.guest.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.reservation?.room.number}</td>
                  <td className="px-4 py-3 text-slate-600">{dateShort(inv.issuedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{currency(inv.subtotal)}</td>
                  <td className="px-4 py-3 text-slate-600">{currency(inv.taxAmount)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{currency(inv.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
