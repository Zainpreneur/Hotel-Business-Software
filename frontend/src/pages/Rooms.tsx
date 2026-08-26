import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "../api/client";
import { Room, RoomType, RoomStatus } from "../types";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

const STATUSES: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [r, rt] = await Promise.all([api.get("/rooms"), api.get("/room-types")]);
    setRooms(r.data);
    setRoomTypes(rt.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(room: Room, status: RoomStatus) {
    await api.patch(`/rooms/${room.id}/status`, { status });
    load();
  }

  const filtered = filter ? rooms.filter((r) => r.status === filter) : rooms;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rooms</h2>
          <p className="text-slate-500 text-sm">{rooms.length} rooms across your property</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowTypeModal(true)}>
            Manage Room Types
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingRoom(null);
              setShowRoomModal(true);
            }}
          >
            + Add Room
          </button>
        </div>
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

      {loading ? (
        <p className="text-slate-500">Loading rooms…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((room) => (
            <div key={room.id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{room.number}</span>
                <Badge value={room.status} />
              </div>
              <p className="text-xs text-slate-500">{room.roomType.name}</p>
              <p className="text-xs text-slate-400">Floor {room.floor} · ${room.roomType.basePrice}/night</p>
              <select
                className="input text-xs mt-1"
                value={room.status}
                onChange={(e) => updateStatus(room, e.target.value as RoomStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                className="text-xs text-brand-600 hover:underline text-left"
                onClick={() => {
                  setEditingRoom(room);
                  setShowRoomModal(true);
                }}
              >
                Edit details
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-400 col-span-full">No rooms match this filter.</p>}
        </div>
      )}

      {showRoomModal && (
        <RoomFormModal
          room={editingRoom}
          roomTypes={roomTypes}
          onClose={() => setShowRoomModal(false)}
          onSaved={() => {
            setShowRoomModal(false);
            load();
          }}
        />
      )}

      {showTypeModal && (
        <RoomTypesModal roomTypes={roomTypes} onClose={() => setShowTypeModal(false)} onChanged={load} />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function RoomFormModal({
  room,
  roomTypes,
  onClose,
  onSaved,
}: {
  room: Room | null;
  roomTypes: RoomType[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [number, setNumber] = useState(room?.number || "");
  const [floor, setFloor] = useState(room?.floor || 1);
  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId || roomTypes[0]?.id || "");
  const [notes, setNotes] = useState(room?.notes || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const payload = { number, floor: Number(floor), roomTypeId, notes };
      if (room) await api.patch(`/rooms/${room.id}`, payload);
      else await api.post("/rooms", payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={room ? "Edit Room" : "Add Room"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Room Number</label>
          <input className="input" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div>
          <label className="label">Floor</label>
          <input type="number" className="input" value={floor} onChange={(e) => setFloor(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Room Type</label>
          <select className="input" value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} (${rt.basePrice}/night)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={saving || !number || !roomTypeId} onClick={submit}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RoomTypesModal({
  roomTypes,
  onClose,
  onChanged,
}: {
  roomTypes: RoomType[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState(100);
  const [capacity, setCapacity] = useState(2);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function addType() {
    setError("");
    try {
      await api.post("/room-types", { name, basePrice: Number(basePrice), capacity: Number(capacity), description });
      setName("");
      setBasePrice(100);
      setCapacity(2);
      setDescription("");
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function removeType(id: string) {
    try {
      await api.delete(`/room-types/${id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Modal title="Room Types" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="border rounded-md divide-y">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{rt.name}</p>
                <p className="text-xs text-slate-400">
                  ${rt.basePrice}/night · sleeps {rt.capacity} · {rt._count?.rooms ?? 0} room(s)
                </p>
              </div>
              <button className="text-red-600 text-xs hover:underline" onClick={() => removeType(rt.id)}>
                Delete
              </button>
            </div>
          ))}
          {roomTypes.length === 0 && <p className="text-sm text-slate-400 px-3 py-2">No room types yet.</p>}
        </div>

        <div className="border-t pt-4">
          <p className="font-medium text-sm mb-2">Add a new room type</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Base Price / night</label>
              <input type="number" className="input" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" className="input" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex justify-end mt-3">
            <button className="btn-primary" disabled={!name} onClick={addType}>
              Add Room Type
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
