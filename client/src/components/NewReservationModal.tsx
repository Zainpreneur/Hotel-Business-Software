import { useEffect, useState } from "react";
import { guestsApi, reservationsApi, roomTypesApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import type { Guest, Room } from "../api/types";
import { Button, ErrorBanner, Field, Input, Modal, Select } from "./ui";
import { currency, toDateInputValue } from "../lib/format";
import { useAsync } from "../hooks/useAsync";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};
const dayAfter = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d;
};

export function NewReservationModal({ open, onClose, onCreated }: Props) {
  const { data: roomTypes } = useAsync(() => roomTypesApi.list(), [open]);

  const [checkIn, setCheckIn] = useState(toDateInputValue(tomorrow()));
  const [checkOut, setCheckOut] = useState(toDateInputValue(dayAfter()));
  const [roomTypeId, setRoomTypeId] = useState("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [guestQuery, setGuestQuery] = useState("");
  const [guestResults, setGuestResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");

  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCheckIn(toDateInputValue(tomorrow()));
      setCheckOut(toDateInputValue(dayAfter()));
      setRoomTypeId("");
      setAvailableRooms([]);
      setRoomId("");
      setSearched(false);
      setGuestQuery("");
      setGuestResults([]);
      setSelectedGuest(null);
      setNewGuestName("");
      setNewGuestEmail("");
      setNewGuestPhone("");
      setAdults("1");
      setChildren("0");
      setNotes("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!guestQuery.trim()) {
      setGuestResults([]);
      return;
    }
    const handle = setTimeout(() => {
      guestsApi.list(guestQuery).then(setGuestResults).catch(() => setGuestResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [guestQuery]);

  async function searchAvailability() {
    setSearching(true);
    setError(null);
    setRoomId("");
    try {
      const rooms = await reservationsApi.availability(checkIn, checkOut, roomTypeId || undefined);
      setAvailableRooms(rooms);
      setSearched(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    let guestId = selectedGuest?.id;
    setSubmitting(true);
    try {
      if (!guestId) {
        if (!newGuestName.trim()) {
          setError("Select an existing guest or enter a name for a new guest");
          setSubmitting(false);
          return;
        }
        const guest = await guestsApi.create({
          name: newGuestName,
          email: newGuestEmail || undefined,
          phone: newGuestPhone || undefined,
        });
        guestId = guest.id;
      }
      if (!roomId) {
        setError("Select a room");
        setSubmitting(false);
        return;
      }
      await reservationsApi.create({
        guestId,
        roomId,
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        notes: notes || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedRoom = availableRooms.find((r) => r.id === roomId);
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  return (
    <Modal open={open} onClose={onClose} title="New reservation" wide>
      <div className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">1. Dates & room</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Check-in">
              <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </Field>
            <Field label="Check-out">
              <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </Field>
            <Field label="Room type">
              <Select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
                <option value="">Any</option>
                {roomTypes?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button variant="secondary" className="w-full" onClick={searchAvailability} disabled={searching}>
                {searching ? "Searching…" : "Check availability"}
              </Button>
            </div>
          </div>

          {searched && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
              {availableRooms.length === 0 ? (
                <p className="p-3 text-sm text-slate-400">No rooms available for these dates.</p>
              ) : (
                availableRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setRoomId(room.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      roomId === room.id ? "bg-slate-100" : ""
                    }`}
                  >
                    <span>
                      Room {room.number} · {room.roomType.name}
                    </span>
                    <span className="text-slate-500">{currency(room.roomType.basePrice)}/night</span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">2. Guest</h4>
          {selectedGuest ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span>
                {selectedGuest.name} {selectedGuest.email && <span className="text-slate-400">· {selectedGuest.email}</span>}
              </span>
              <button className="text-xs text-slate-500 hover:text-slate-800" onClick={() => setSelectedGuest(null)}>
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Search existing guests by name, email, or phone…"
                value={guestQuery}
                onChange={(e) => setGuestQuery(e.target.value)}
              />
              {guestResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200">
                  {guestResults.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGuest(g);
                        setGuestQuery("");
                        setGuestResults([]);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>{g.name}</span>
                      <span className="text-xs text-slate-400">{g.email || g.phone || ""}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400">or create a new guest:</p>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Full name" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} />
                <Input placeholder="Email" value={newGuestEmail} onChange={(e) => setNewGuestEmail(e.target.value)} />
                <Input placeholder="Phone" value={newGuestPhone} onChange={(e) => setNewGuestPhone(e.target.value)} />
              </div>
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">3. Details</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Adults">
              <Input type="number" min="1" value={adults} onChange={(e) => setAdults(e.target.value)} />
            </Field>
            <Field label="Children">
              <Input type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)} />
            </Field>
            <Field label="Notes">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </section>

        {selectedRoom && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {nights} night{nights > 1 ? "s" : ""} × {currency(selectedRoom.roomType.basePrice)} ={" "}
            <strong>{currency(nights * selectedRoom.roomType.basePrice)}</strong>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create reservation"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
