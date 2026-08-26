import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../api/client";
import { Reservation, Room, Guest, ReservationStatus } from "../types";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

const STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"];

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await api.get("/reservations", { params: filter ? { status: filter } : {} });
    setReservations(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function doAction(id: string, action: "check-in" | "check-out" | "cancel") {
    setBusyId(id);
    setError("");
    try {
      await api.post(`/reservations/${id}/${action}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reservations</h2>
          <p className="text-slate-500 text-sm">{reservations.length} reservations</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Reservation
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className={`btn text-xs ${filter === "" ? "bg-brand-600 text-white" : "bg-white border border-slate-300"}`}
          onClick={() => setFilter("")}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`btn text-xs ${filter === s ? "bg-brand-600 text-white" : "bg-white border border-slate-300"}`}
            onClick={() => setFilter(s)}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Guest</th>
              <th className="text-left px-4 py-3">Room</th>
              <th className="text-left px-4 py-3">Check-in</th>
              <th className="text-left px-4 py-3">Check-out</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && reservations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No reservations found.
                </td>
              </tr>
            )}
            {reservations.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link to={`/guests/${r.guestId}`} className="font-medium hover:underline">
                    {r.guest.firstName} {r.guest.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.room.number} <span className="text-slate-400 text-xs">({r.room.roomType.name})</span>
                </td>
                <td className="px-4 py-3">{new Date(r.checkIn).toLocaleDateString()}</td>
                <td className="px-4 py-3">{new Date(r.checkOut).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Badge value={r.status} />
                </td>
                <td className="px-4 py-3 text-right">${r.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {["PENDING", "CONFIRMED"].includes(r.status) && (
                    <button
                      className="text-brand-600 hover:underline text-xs"
                      disabled={busyId === r.id}
                      onClick={() => doAction(r.id, "check-in")}
                    >
                      Check in
                    </button>
                  )}
                  {r.status === "CHECKED_IN" && (
                    <button
                      className="text-brand-600 hover:underline text-xs"
                      disabled={busyId === r.id}
                      onClick={() => doAction(r.id, "check-out")}
                    >
                      Check out
                    </button>
                  )}
                  {["PENDING", "CONFIRMED"].includes(r.status) && (
                    <button
                      className="text-red-600 hover:underline text-xs"
                      disabled={busyId === r.id}
                      onClick={() => doAction(r.id, "cancel")}
                    >
                      Cancel
                    </button>
                  )}
                  {r.status === "CHECKED_OUT" && !r.invoice && (
                    <Link to={`/billing`} className="text-brand-600 hover:underline text-xs">
                      Bill
                    </Link>
                  )}
                  {r.invoice && (
                    <Link to={`/billing/${r.invoice.id}`} className="text-brand-600 hover:underline text-xs">
                      Invoice
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <NewReservationModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function NewReservationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestId, setGuestId] = useState("");
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [source, setSource] = useState("Walk-in");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/guests").then((res) => setGuests(res.data));
  }, []);

  async function searchAvailability() {
    setSearching(true);
    setError("");
    setRoomId("");
    try {
      const res = await api.get("/reservations/available-rooms", { params: { checkIn, checkOut } });
      setAvailableRooms(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await api.post("/reservations", {
        guestId,
        roomId,
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        source,
      });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Reservation" onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <label className="label">Guest</label>
          <select className="input" value={guestId} onChange={(e) => setGuestId(e.target.value)}>
            <option value="">Select a guest…</option>
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.firstName} {g.lastName} {g.email ? `(${g.email})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Don't see the guest?{" "}
            <Link to="/guests" className="text-brand-600 hover:underline">
              Add them first
            </Link>
            .
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Check-in</label>
            <input type="date" className="input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input type="date" className="input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <div>
            <label className="label">Adults</label>
            <input type="number" min={1} className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Children</label>
            <input type="number" min={0} className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <label className="label">Source</label>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option>Walk-in</option>
              <option>Website</option>
              <option>Phone</option>
              <option>OTA</option>
            </select>
          </div>
        </div>

        <button className="btn-secondary w-full" onClick={searchAvailability} disabled={searching}>
          {searching ? "Searching…" : "Search Available Rooms"}
        </button>

        {availableRooms.length > 0 && (
          <div>
            <label className="label">Available Rooms</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableRooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoomId(r.id)}
                  className={`text-left border rounded-md p-2 text-xs ${
                    roomId === r.id ? "border-brand-600 bg-brand-50" : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold">Room {r.number}</p>
                  <p className="text-slate-500">
                    {r.roomType.name} · ${r.roomType.basePrice}/night
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={saving || !guestId || !roomId} onClick={submit}>
            {saving ? "Creating…" : "Create Reservation"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
