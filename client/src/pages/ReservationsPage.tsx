import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { reservationsApi } from "../api/endpoints";
import { useAsync } from "../hooks/useAsync";
import { RESERVATION_STATUS_COLOR, RESERVATION_STATUS_LABEL, RESERVATION_STATUSES } from "../lib/constants";
import { Badge, Button, Card, EmptyState, ErrorBanner, Select, Spinner } from "../components/ui";
import { currency, dateShort, nightsBetween } from "../lib/format";
import { NewReservationModal } from "../components/NewReservationModal";

export function ReservationsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);

  const { data: reservations, loading, error, reload } = useAsync(
    useCallback(() => reservationsApi.list(statusFilter ? { status: statusFilter } : undefined), [statusFilter])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reservations</h1>
          <p className="text-sm text-slate-500">Bookings, check-ins, and check-outs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {RESERVATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {RESERVATION_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Button onClick={() => setOpen(true)}>+ New reservation</Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {reservations && reservations.length === 0 && (
        <EmptyState title="No reservations" subtitle="Create a reservation to see it here." />
      )}

      {reservations && reservations.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
                <th className="px-4 py-3 font-medium">Nights</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/reservations/${r.id}`} className="font-medium text-slate-900 hover:underline">
                      {r.guest.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.room.number} <span className="text-slate-400">· {r.room.roomType.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{dateShort(r.checkIn)}</td>
                  <td className="px-4 py-3 text-slate-600">{dateShort(r.checkOut)}</td>
                  <td className="px-4 py-3 text-slate-600">{nightsBetween(r.checkIn, r.checkOut)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{currency(r.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <Badge className={RESERVATION_STATUS_COLOR[r.status]}>{RESERVATION_STATUS_LABEL[r.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <NewReservationModal open={open} onClose={() => setOpen(false)} onCreated={reload} />
    </div>
  );
}
