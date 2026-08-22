import { useCallback, useMemo, useState } from "react";
import { roomsApi, roomTypesApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import type { Room } from "../api/types";
import { ROOM_STATUS_COLOR, ROOM_STATUS_LABEL, ROOM_STATUSES } from "../lib/constants";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, Input, Modal, Select, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const emptyForm = { number: "", floor: "1", roomTypeId: "", notes: "" };

export function RoomsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: rooms, loading, error, reload } = useAsync(
    useCallback(() => roomsApi.list(statusFilter ? { status: statusFilter } : undefined), [statusFilter])
  );
  const { data: roomTypes } = useAsync(useCallback(() => roomTypesApi.list(), []));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    if (!rooms) return {};
    return rooms.reduce<Record<number, Room[]>>((acc, room) => {
      acc[room.floor] = acc[room.floor] ?? [];
      acc[room.floor].push(room);
      return acc;
    }, {});
  }, [rooms]);

  function openCreate() {
    setForm({ ...emptyForm, roomTypeId: roomTypes?.[0]?.id ?? "" });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    try {
      await roomsApi.create({
        number: form.number,
        floor: Number(form.floor),
        roomTypeId: form.roomTypeId,
        notes: form.notes || undefined,
      });
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(room: Room, status: string) {
    try {
      await roomsApi.update(room.id, { status });
      reload();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Rooms</h1>
          <p className="text-sm text-slate-500">Live status of every room in the property.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ROOM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ROOM_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          {canManage && <Button onClick={openCreate}>+ New room</Button>}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {rooms && rooms.length === 0 && <EmptyState title="No rooms found" subtitle="Add a room to start tracking inventory." />}

      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([floor, floorRooms]) => (
          <div key={floor}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Floor {floor}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {floorRooms.map((room) => (
                <Card key={room.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900">{room.number}</span>
                    <Badge className={ROOM_STATUS_COLOR[room.status]}>{ROOM_STATUS_LABEL[room.status]}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{room.roomType.name}</p>
                  <Select
                    className="mt-3 text-xs"
                    value={room.status}
                    onChange={(e) => updateStatus(room, e.target.value)}
                  >
                    {ROOM_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ROOM_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </Card>
              ))}
            </div>
          </div>
        ))}

      <Modal open={open} onClose={() => setOpen(false)} title="New room">
        <div className="space-y-3">
          {formError && <ErrorBanner message={formError} />}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room number">
              <Input required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </Field>
            <Field label="Floor">
              <Input type="number" min="0" required value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            </Field>
          </div>
          <Field label="Room type">
            <Select value={form.roomTypeId} onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}>
              {roomTypes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.roomTypeId}>
              {submitting ? "Saving…" : "Create room"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
