import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { guestsApi } from "../api/endpoints";
import { useAsync } from "../hooks/useAsync";
import { Badge, Card, CardHeader, ErrorBanner, Spinner } from "../components/ui";
import { RESERVATION_STATUS_COLOR, RESERVATION_STATUS_LABEL } from "../lib/constants";
import { currency, dateShort } from "../lib/format";

export function GuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: guest, loading, error } = useAsync(useCallback(() => guestsApi.get(id!), [id]));

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!guest) return null;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="mb-1 text-xs text-slate-400 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-slate-900">{guest.name}</h1>
      </div>

      <Card>
        <CardHeader title="Contact info" />
        <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-400">Email</dt>
            <dd className="font-medium text-slate-800">{guest.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Phone</dt>
            <dd className="font-medium text-slate-800">{guest.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Address</dt>
            <dd className="font-medium text-slate-800">{guest.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">ID</dt>
            <dd className="font-medium text-slate-800">
              {guest.idType && guest.idNumber ? `${guest.idType} · ${guest.idNumber}` : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Reservation history" />
        {(guest.reservations ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No reservations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {guest.reservations!.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/reservations/${r.id}`} className="font-medium text-slate-900 hover:underline">
                      {r.room.roomType.name} · {r.room.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{dateShort(r.checkIn)}</td>
                  <td className="px-4 py-3 text-slate-600">{dateShort(r.checkOut)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{currency(r.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <Badge className={RESERVATION_STATUS_COLOR[r.status]}>{RESERVATION_STATUS_LABEL[r.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
