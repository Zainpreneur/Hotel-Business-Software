import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { apiErrorMessage } from "../api/client";
import { Invoice } from "../types";
import Badge from "../components/Badge";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<"CASH" | "CARD" | "ONLINE" | "BANK_TRANSFER">("CASH");
  const [busy, setBusy] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    api
      .get(`/invoices/${id}`)
      .then((res) => {
        setInvoice(res.data);
        const paid = res.data.payments.filter((p: any) => p.status === "COMPLETED").reduce((s: number, p: any) => s + p.amount, 0);
        setPayAmount(Math.max(res.data.total - paid, 0));
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function addItem() {
    if (!id || !itemDesc) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/invoices/${id}/items`, { description: itemDesc, quantity: itemQty, unitPrice: itemPrice });
      setItemDesc("");
      setItemQty(1);
      setItemPrice(0);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!id) return;
    setBusy(true);
    try {
      await api.delete(`/invoices/${id}/items/${itemId}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function addPayment() {
    if (!id || payAmount <= 0) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/invoices/${id}/payments`, { amount: payAmount, method: payMethod });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function setDiscount(discount: number) {
    if (!id) return;
    await api.patch(`/invoices/${id}/discount`, { discount });
    load();
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!invoice) return <p className="text-slate-500">Invoice not found.</p>;

  const paid = invoice.payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(invoice.total - paid, 0);

  return (
    <div className="space-y-6">
      <Link to="/billing" className="text-sm text-brand-600 hover:underline">
        ← Back to billing
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
            <p className="text-slate-500 text-sm">
              {invoice.reservation?.guest.firstName} {invoice.reservation?.guest.lastName} · Room{" "}
              {invoice.reservation?.room.number}
            </p>
          </div>
          <Badge value={invoice.status} />
        </div>

        <table className="w-full text-sm mb-4">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="py-2 text-right">${item.amount.toFixed(2)}</td>
                <td className="py-2 text-right">
                  {invoice.status !== "VOID" && (
                    <button className="text-red-600 text-xs hover:underline" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoice.status !== "VOID" && (
          <div className="flex gap-2 items-end mb-4 flex-wrap">
            <div>
              <label className="label">Item</label>
              <input className="input" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Minibar, Spa, Laundry…" />
            </div>
            <div className="w-20">
              <label className="label">Qty</label>
              <input type="number" className="input" value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))} />
            </div>
            <div className="w-28">
              <label className="label">Unit Price</label>
              <input type="number" className="input" value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))} />
            </div>
            <button className="btn-secondary" disabled={busy || !itemDesc} onClick={addItem}>
              Add Item
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Discount</span>
              <input
                type="number"
                className="input w-24 text-right py-1"
                defaultValue={invoice.discount}
                disabled={invoice.status === "VOID"}
                onBlur={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span>${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-1">
              <span>Total</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Paid</span>
              <span>${paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Balance</span>
              <span>${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-3">Payments</h3>
        <table className="w-full text-sm mb-4">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Method</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.payments.map((p) => (
              <tr key={p.id}>
                <td className="py-2">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="py-2">{p.method.replace(/_/g, " ")}</td>
                <td className="py-2 text-right">${p.amount.toFixed(2)}</td>
                <td className="py-2">{p.status}</td>
              </tr>
            ))}
            {invoice.payments.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {balance > 0 && invoice.status !== "VOID" && (
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <label className="label">Amount</label>
              <input type="number" className="input w-32" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="ONLINE">Online</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <button className="btn-primary" disabled={busy || payAmount <= 0} onClick={addPayment}>
              Record Payment
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
