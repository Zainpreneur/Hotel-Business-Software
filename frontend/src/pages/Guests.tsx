import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../api/client";
import { Guest } from "../types";
import Modal from "../components/Modal";

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load(query = "") {
    setLoading(true);
    const res = await api.get("/guests", { params: query ? { q: query } : {} });
    setGuests(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guests</h2>
          <p className="text-slate-500 text-sm">{guests.length} guests</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Guest
        </button>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by name, email or phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">VIP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && guests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No guests found.
                </td>
              </tr>
            )}
            {guests.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3">
                  <Link to={`/guests/${g.id}`} className="font-medium hover:underline">
                    {g.firstName} {g.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{g.email || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{g.phone || "—"}</td>
                <td className="px-4 py-3">{g.vip ? "⭐" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <GuestFormModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load(q);
          }}
        />
      )}
    </div>
  );
}

export function GuestFormModal({
  guest,
  onClose,
  onSaved,
}: {
  guest?: Guest;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(guest?.firstName || "");
  const [lastName, setLastName] = useState(guest?.lastName || "");
  const [email, setEmail] = useState(guest?.email || "");
  const [phone, setPhone] = useState(guest?.phone || "");
  const [address, setAddress] = useState(guest?.address || "");
  const [idType, setIdType] = useState(guest?.idType || "");
  const [idNumber, setIdNumber] = useState(guest?.idNumber || "");
  const [vip, setVip] = useState(guest?.vip || false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const payload = { firstName, lastName, email, phone, address, idType, idNumber, vip };
      if (guest) await api.patch(`/guests/${guest.id}`, payload);
      else await api.post("/guests", payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={guest ? "Edit Guest" : "Add Guest"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First Name</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="label">ID Type</label>
          <input className="input" placeholder="Passport, License…" value={idType} onChange={(e) => setIdType(e.target.value)} />
        </div>
        <div>
          <label className="label">ID Number</label>
          <input className="input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} />
          Mark as VIP guest
        </label>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <div className="flex justify-end gap-2 pt-4">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={saving || !firstName || !lastName} onClick={submit}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
