import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { Guest } from "../types";
import Badge from "../components/Badge";
import { GuestFormModal } from "./Guests";

export default function GuestProfile() {
  const { id } = useParams();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    api
      .get(`/guests/${id}`)
      .then((res) => setGuest(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!guest) return <p className="text-slate-500">Guest not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/guests" className="text-sm text-brand-600 hover:underline">
        ← Back to guests
      </Link>

      <div className="card p-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {guest.firstName} {guest.lastName} {guest.vip && <span title="VIP">⭐</span>}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{guest.email || "No email on file"}</p>
          <p className="text-slate-500 text-sm">{guest.phone || "No phone on file"}</p>
          {guest.address && <p className="text-slate-500 text-sm">{guest.address}</p>}
          {guest.idType && (
            <p className="text-slate-400 text-xs mt-1">
              {guest.idType}: {guest.idNumber}
            </p>
          )}
        </div>
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-3">Reservation History</h3>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left py-2">Room</th>
              <th className="text-left py-2">Check-in</th>
              <th className="text-left py-2">Check-out</th>
              <th className="text-left py-2">Status</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(guest.reservations || []).map((r) => (
              <tr key={r.id}>
                <td className="py-2">
                  {r.room.number} ({r.room.roomType.name})
                </td>
                <td className="py-2">{new Date(r.checkIn).toLocaleDateString()}</td>
                <td className="py-2">{new Date(r.checkOut).toLocaleDateString()}</td>
                <td className="py-2">
                  <Badge value={r.status} />
                </td>
                <td className="py-2 text-right">${r.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
            {(!guest.reservations || guest.reservations.length === 0) && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No reservations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <GuestFormModal
          guest={guest}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}
