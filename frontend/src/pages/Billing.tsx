import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../api/client";
import { Invoice, Reservation } from "../types";
import Badge from "../components/Badge";

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [uninvoiced, setUninvoiced] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [inv, res] = await Promise.all([api.get("/invoices"), api.get("/reservations", { params: { status: "CHECKED_OUT" } })]);
    setInvoices(inv.data);
    setUninvoiced(res.data.filter((r: Reservation) => !r.invoice));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function generate(reservationId: string) {
    setGenerating(reservationId);
    setError("");
    try {
      await api.post(`/invoices/generate/${reservationId}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Billing</h2>
        <p className="text-slate-500 text-sm">Invoices and payments</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uninvoiced.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-2">Checked-out reservations awaiting an invoice</h3>
          <div className="space-y-2">
            {uninvoiced.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <span>
                  {r.guest.firstName} {r.guest.lastName} · Room {r.room.number} · ${r.totalAmount.toFixed(2)}
                </span>
                <button className="btn-primary text-xs" disabled={generating === r.id} onClick={() => generate(r.id)}>
                  {generating === r.id ? "Generating…" : "Generate Invoice"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Invoice #</th>
              <th className="text-left px-4 py-3">Guest</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-right px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No invoices yet.
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const paid = inv.payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
              return (
                <tr key={inv.id}>
                  <td className="px-4 py-3">
                    <Link to={`/billing/${inv.id}`} className="font-medium hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {inv.reservation?.guest.firstName} {inv.reservation?.guest.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${paid.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
