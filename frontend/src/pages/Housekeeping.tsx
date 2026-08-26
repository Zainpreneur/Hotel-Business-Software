import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "../api/client";
import { HousekeepingTask, HousekeepingStatus, Room, User } from "../types";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

const COLUMNS: HousekeepingStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "VERIFIED"];

export default function Housekeeping() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [t, r] = await Promise.all([api.get("/housekeeping"), api.get("/rooms")]);
    setTasks(t.data);
    setRooms(r.data);
    api
      .get("/users")
      .then((res) => setStaff(res.data))
      .catch(() => setStaff([]));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(task: HousekeepingTask, status: HousekeepingStatus) {
    try {
      await api.patch(`/housekeeping/${task.id}`, { status });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Housekeeping</h2>
          <p className="text-slate-500 text-sm">Track room cleaning and maintenance tasks</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Task
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col} className="card p-3 min-h-[200px]">
              <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                {col.replace(/_/g, " ")}
                <span className="text-xs text-slate-400">{tasks.filter((t) => t.status === col).length}</span>
              </h3>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status === col)
                  .map((t) => (
                    <div key={t.id} className="border rounded-md p-2 text-xs space-y-1 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Room {t.room.number}</span>
                        <Badge value={t.type} />
                      </div>
                      {t.notes && <p className="text-slate-500">{t.notes}</p>}
                      <p className="text-slate-400">{t.assignedTo ? `Assigned: ${t.assignedTo.name}` : "Unassigned"}</p>
                      <select
                        className="input text-xs py-1"
                        value={t.status}
                        onChange={(e) => updateStatus(t, e.target.value as HousekeepingStatus)}
                      >
                        {COLUMNS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                {tasks.filter((t) => t.status === col).length === 0 && (
                  <p className="text-xs text-slate-400">No tasks.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewTaskModal
          rooms={rooms}
          staff={staff}
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

function NewTaskModal({
  rooms,
  staff,
  onClose,
  onCreated,
}: {
  rooms: Room[];
  staff: User[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id || "");
  const [type, setType] = useState<"CLEANING" | "MAINTENANCE" | "INSPECTION" | "DEEP_CLEAN">("CLEANING");
  const [assignedToId, setAssignedToId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await api.post("/housekeeping", { roomId, type, assignedToId: assignedToId || undefined, notes });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Housekeeping Task" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Room</label>
          <select className="input" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.number}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="CLEANING">Cleaning</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INSPECTION">Inspection</option>
            <option value="DEEP_CLEAN">Deep Clean</option>
          </select>
        </div>
        <div>
          <label className="label">Assign To</label>
          <select className="input" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={saving || !roomId} onClick={submit}>
            {saving ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
