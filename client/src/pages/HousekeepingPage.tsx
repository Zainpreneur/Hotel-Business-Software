import { useCallback, useState } from "react";
import { housekeepingApi, roomsApi, usersApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { HOUSEKEEPING_STATUS_LABEL, HOUSEKEEPING_STATUSES } from "../lib/constants";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, Modal, Select, Spinner } from "../components/ui";
import { dateTime } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  DONE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  VERIFIED: "bg-slate-200 text-slate-700 border-slate-300",
};

export function HousekeepingPage() {
  const { user } = useAuth();
  const canAssign = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [statusFilter, setStatusFilter] = useState("");
  const { data: tasks, loading, error, reload } = useAsync(
    useCallback(() => housekeepingApi.list(statusFilter || undefined), [statusFilter])
  );
  const { data: rooms } = useAsync(useCallback(() => roomsApi.list(), []));
  const { data: staff } = useAsync(useCallback(() => (canAssign ? usersApi.list() : Promise.resolve([])), [canAssign]));

  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    setFormError(null);
    try {
      await housekeepingApi.create({ roomId, assignedToId: assignedToId || undefined });
      setOpen(false);
      setRoomId("");
      setAssignedToId("");
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(taskId: string, status: string) {
    try {
      await housekeepingApi.update(taskId, { status });
      reload();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Housekeeping</h1>
          <p className="text-sm text-slate-500">Cleaning tasks across the property.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {HOUSEKEEPING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {HOUSEKEEPING_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Button
            onClick={() => {
              setRoomId(rooms?.[0]?.id ?? "");
              setFormError(null);
              setOpen(true);
            }}
          >
            + New task
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {tasks && tasks.length === 0 && <EmptyState title="No housekeeping tasks" subtitle="All caught up!" />}

      {tasks && tasks.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Room {t.room.number}</span>
                <Badge className={STATUS_COLOR[t.status]}>{HOUSEKEEPING_STATUS_LABEL[t.status]}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{t.room.roomType.name}</p>
              {t.notes && <p className="mt-2 text-sm text-slate-600">{t.notes}</p>}
              <p className="mt-2 text-xs text-slate-400">
                {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : "Unassigned"} · Due {dateTime(t.dueDate)}
              </p>
              <Select className="mt-3 text-xs" value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                {HOUSEKEEPING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {HOUSEKEEPING_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New housekeeping task">
        <div className="space-y-3">
          {formError && <ErrorBanner message={formError} />}
          <Field label="Room">
            <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              {rooms?.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.number} · {r.roomType.name}
                </option>
              ))}
            </Select>
          </Field>
          {canAssign && (
            <Field label="Assign to">
              <Select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                <option value="">Unassigned</option>
                {staff?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !roomId}>
              {submitting ? "Saving…" : "Create task"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
