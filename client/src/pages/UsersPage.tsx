import { useCallback, useState } from "react";
import { usersApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { ROLES, ROLE_LABEL } from "../lib/constants";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, Input, Modal, Select, Spinner } from "../components/ui";

const emptyForm = { name: "", email: "", password: "", role: "FRONT_DESK" };

export function UsersPage() {
  const { data: users, loading, error, reload } = useAsync(useCallback(() => usersApi.list(), []));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    setFormError(null);
    try {
      await usersApi.create(form);
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await usersApi.update(id, { active });
      reload();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500">Manage user accounts and roles.</p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setFormError(null);
            setOpen(true);
          }}
        >
          + New staff member
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {users && users.length === 0 && <EmptyState title="No staff yet" />}

      {users && users.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3">
                    <Badge className={u.active ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-slate-300 bg-slate-200 text-slate-700"}>
                      {u.active ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(u.id, !u.active)}>
                      {u.active ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New staff member">
        <div className="space-y-3">
          {formError && <ErrorBanner message={formError} />}
          <Field label="Full name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Temporary password">
            <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Saving…" : "Create account"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
