import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { guestsApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Modal, Spinner } from "../components/ui";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export function GuestsPage() {
  const [query, setQuery] = useState("");
  const { data: guests, loading, error, reload } = useAsync(useCallback(() => guestsApi.list(query), [query]));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    try {
      await guestsApi.create({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Guests</h1>
          <p className="text-sm text-slate-500">Your guest directory and stay history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search guests…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormError(null);
              setOpen(true);
            }}
          >
            + New guest
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {guests && guests.length === 0 && <EmptyState title="No guests found" />}

      {guests && guests.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Reservations</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/guests/${g.id}`} className="font-medium text-slate-900 hover:underline">
                      {g.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{g.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{g.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{g._count?.reservations ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New guest">
        <div className="space-y-3">
          {formError && <ErrorBanner message={formError} />}
          <Field label="Full name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
