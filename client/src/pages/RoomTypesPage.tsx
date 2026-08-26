import { useCallback, useState } from "react";
import { roomTypesApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import type { RoomType } from "../api/types";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Modal, Spinner, Textarea } from "../components/ui";
import { currency } from "../lib/format";

const emptyForm = { name: "", description: "", basePrice: "", capacity: "2", amenities: "" };

export function RoomTypesPage() {
  const { data: types, loading, error, reload } = useAsync(useCallback(() => roomTypesApi.list(), []));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(type: RoomType) {
    setEditing(type);
    setForm({
      name: type.name,
      description: type.description ?? "",
      basePrice: String(type.basePrice),
      capacity: String(type.capacity),
      amenities: type.amenities ?? "",
    });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        basePrice: Number(form.basePrice),
        capacity: Number(form.capacity),
        amenities: form.amenities || undefined,
      };
      if (editing) await roomTypesApi.update(editing.id, payload);
      else await roomTypesApi.create(payload);
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(type: RoomType) {
    if (!confirm(`Delete room type "${type.name}"? This only works if no rooms use it.`)) return;
    try {
      await roomTypesApi.remove(type.id);
      reload();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Room Types</h1>
          <p className="text-sm text-slate-500">Define your rate plans and inventory categories.</p>
        </div>
        <Button onClick={openCreate}>+ New room type</Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}

      {types && types.length === 0 && <EmptyState title="No room types yet" subtitle="Create your first room type to get started." />}

      {types && types.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <Card key={t.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
                <span className="text-sm font-semibold text-slate-900">{currency(t.basePrice)}<span className="text-xs font-normal text-slate-400">/night</span></span>
              </div>
              {t.description && <p className="mt-1 text-sm text-slate-500">{t.description}</p>}
              <p className="mt-2 text-xs text-slate-400">Capacity: {t.capacity} guests · {t._count?.rooms ?? 0} rooms</p>
              {t.amenities && <p className="mt-2 text-xs text-slate-500">{t.amenities}</p>}
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(t)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit room type" : "New room type"}>
        <div className="space-y-3">
          {formError && <ErrorBanner message={formError} />}
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price / night">
              <Input type="number" min="0" step="0.01" required value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </Field>
            <Field label="Capacity (guests)">
              <Input type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
          </div>
          <Field label="Amenities (comma separated)">
            <Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
