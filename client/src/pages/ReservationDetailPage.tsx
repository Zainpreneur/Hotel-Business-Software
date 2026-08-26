import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { invoicesApi, paymentsApi, reservationsApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { RESERVATION_STATUS_COLOR, RESERVATION_STATUS_LABEL, PAYMENT_METHODS } from "../lib/constants";
import { Badge, Button, Card, CardHeader, ErrorBanner, Field, Input, Modal, Select, Spinner } from "../components/ui";
import { currency, dateShort, dateTime, nightsBetween } from "../lib/format";

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reservation, loading, error, reload } = useAsync(
    useCallback(() => reservationsApi.get(id!), [id])
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment() {
    if (!reservation) return;
    setBusy(true);
    setActionError(null);
    try {
      await paymentsApi.create({
        reservationId: reservation.id,
        amount: Number(payAmount),
        method: payMethod,
      });
      setPayOpen(false);
      setPayAmount("");
      reload();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function generateInvoice() {
    if (!reservation) return;
    await runAction(() => invoicesApi.create({ reservationId: reservation.id, taxRate: 0.1 }));
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!reservation) return null;

  const paid = (reservation.payments ?? []).filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
  const balance = reservation.totalAmount - paid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="mb-1 text-xs text-slate-400 hover:text-slate-700">
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Reservation for {reservation.guest.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={RESERVATION_STATUS_COLOR[reservation.status]}>
              {RESERVATION_STATUS_LABEL[reservation.status]}
            </Badge>
            <span className="text-sm text-slate-400">
              Room {reservation.room.number} · {reservation.room.roomType.name}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {reservation.status === "BOOKED" && (
            <>
              <Button disabled={busy} onClick={() => runAction(() => reservationsApi.checkIn(reservation.id))}>
                Check in
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => confirm("Cancel this reservation?") && runAction(() => reservationsApi.cancel(reservation.id))}
              >
                Cancel
              </Button>
            </>
          )}
          {reservation.status === "CHECKED_IN" && (
            <>
              <Button disabled={busy} onClick={() => runAction(() => reservationsApi.checkOut(reservation.id))}>
                Check out
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => confirm("Cancel this reservation?") && runAction(() => reservationsApi.cancel(reservation.id))}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Stay details" />
          <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-400">Check-in</dt>
              <dd className="font-medium text-slate-800">{dateShort(reservation.checkIn)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Check-out</dt>
              <dd className="font-medium text-slate-800">{dateShort(reservation.checkOut)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Nights</dt>
              <dd className="font-medium text-slate-800">{nightsBetween(reservation.checkIn, reservation.checkOut)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Guests</dt>
              <dd className="font-medium text-slate-800">
                {reservation.adults} adult{reservation.adults > 1 ? "s" : ""}
                {reservation.children ? `, ${reservation.children} children` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Rate / night</dt>
              <dd className="font-medium text-slate-800">{currency(reservation.ratePerNight)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Total</dt>
              <dd className="font-medium text-slate-800">{currency(reservation.totalAmount)}</dd>
            </div>
            {reservation.actualCheckIn && (
              <div>
                <dt className="text-xs text-slate-400">Actual check-in</dt>
                <dd className="font-medium text-slate-800">{dateTime(reservation.actualCheckIn)}</dd>
              </div>
            )}
            {reservation.actualCheckOut && (
              <div>
                <dt className="text-xs text-slate-400">Actual check-out</dt>
                <dd className="font-medium text-slate-800">{dateTime(reservation.actualCheckOut)}</dd>
              </div>
            )}
            {reservation.notes && (
              <div className="col-span-full">
                <dt className="text-xs text-slate-400">Notes</dt>
                <dd className="text-slate-700">{reservation.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Guest" />
          <div className="space-y-1 px-5 py-4 text-sm">
            <Link to={`/guests/${reservation.guest.id}`} className="font-medium text-slate-900 hover:underline">
              {reservation.guest.name}
            </Link>
            {reservation.guest.email && <p className="text-slate-500">{reservation.guest.email}</p>}
            {reservation.guest.phone && <p className="text-slate-500">{reservation.guest.phone}</p>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Payments"
          subtitle={`Paid ${currency(paid)} of ${currency(reservation.totalAmount)} — balance ${currency(balance)}`}
          action={
            <Button size="sm" onClick={() => setPayOpen(true)}>
              + Record payment
            </Button>
          }
        />
        <div className="px-5 py-4">
          {(reservation.payments ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reservation.payments!.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-600">
                    {dateTime(p.paidAt)} · {p.method.replace("_", " ")}
                  </span>
                  <span className="font-medium text-slate-900">{currency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Invoice"
          action={
            !reservation.invoice ? (
              <Button size="sm" onClick={generateInvoice} disabled={busy}>
                Generate invoice
              </Button>
            ) : undefined
          }
        />
        <div className="px-5 py-4 text-sm">
          {reservation.invoice ? (
            <div className="space-y-1">
              <p className="font-medium text-slate-900">{reservation.invoice.invoiceNumber}</p>
              <p className="text-slate-500">
                Subtotal {currency(reservation.invoice.subtotal)} + tax {currency(reservation.invoice.taxAmount)} ={" "}
                <strong>{currency(reservation.invoice.total)}</strong>
              </p>
              <p className="text-xs text-slate-400">Issued {dateShort(reservation.invoice.issuedAt)}</p>
            </div>
          ) : (
            <p className="text-slate-400">No invoice generated yet.</p>
          )}
        </div>
      </Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <div className="space-y-3">
          {actionError && <ErrorBanner message={actionError} />}
          <Field label="Amount">
            <Input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </Field>
          <Field label="Method">
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={busy || !payAmount}>
              {busy ? "Saving…" : "Record payment"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
