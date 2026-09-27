"use client";

import { useState } from "react";
import { CirclePlus, Pencil, Trash, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { BackendUser, Role, Status } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery } from "../api";
import { formatShortDate } from "../format";
import {
  EmptyState,
  ErrorBox,
  FieldError,
  Modal,
  PageHeader,
  Pager,
  PrimaryButton,
  SearchBox,
  Spinner,
  StatusPill,
  Toggle,
  inputClass,
  labelClass,
  selectClass,
  useConfirm,
  useDebounced,
} from "../ui";

export default function UsersPage() {
  const { user: me, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BackendUser | null>(null);
  const q = useDebounced(search);

  const users = useApiQuery<BackendUser[]>(`/users${qs({ page, limit: 20, search: q, role, status })}`);
  const roles = useApiQuery<Role[]>(hasPermission("roles.view") || hasPermission("users.changeRole") || hasPermission("users.create") ? "/roles?status=ACTIVE" : null);

  const canChangeRole = hasPermission("users.changeRole");
  const canUpdate = hasPermission("users.update");
  const canDelete = hasPermission("users.delete");

  const replace = (u: BackendUser) => users.setData((list) => list?.map((x) => (x._id === u._id ? u : x)) ?? list);

  const changeRole = async (u: BackendUser, roleId: string) => {
    const res = await action<BackendUser>(`/users/${u._id}/role`, { method: "PATCH", json: { roleId } });
    if (res) replace(res.data);
  };

  const changeStatus = async (u: BackendUser, next: Status) => {
    const res = await action<BackendUser>(`/users/${u._id}/status`, { method: "PATCH", json: { status: next } });
    if (res) replace(res.data);
  };

  const remove = async (u: BackendUser) => {
    const ok = await confirm({ title: "Delete user?", text: `${u.fullName} (${u.email}) will be removed permanently.`, confirmText: "Yes, Delete" });
    if (ok && (await action(`/users/${u._id}`, { method: "DELETE" }))) users.reload();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Users" subtitle="Customers and staff accounts, their roles and status">
        {hasPermission("users.create") && (
          <PrimaryButton onClick={() => setCreating(true)}>
            <CirclePlus className="mr-2 h-4 w-4" /> Add User
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Search by name or email..." />
        <select className={selectClass} value={role} onChange={(e) => (setRole(e.target.value), setPage(1))}>
          <option value="">All roles</option>
          {roles.data?.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
        <select className={selectClass} value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {users.loading && !users.data ? (
          <Spinner label="Loading users..." />
        ) : users.error ? (
          <ErrorBox message={users.error} onRetry={users.reload} />
        ) : !users.data?.length ? (
          <EmptyState title="No users found" text="Try a different search or filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.data.map((u) => {
                  const self = u._id === me?.id;
                  return (
                    <tr key={u._id} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-600">
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserRound className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-bold text-slate-900">
                              {u.fullName} {self && <span className="text-[10px] font-semibold text-slate-400">(you)</span>}
                            </span>
                            <span className="truncate text-slate-500">{u.email}</span>
                            {u.phone && <span className="truncate text-slate-400">{u.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {canChangeRole && !self && roles.data ? (
                          <select className={selectClass} value={u.role?._id ?? ""} onChange={(e) => changeRole(u, e.target.value)}>
                            {!roles.data.some((r) => r._id === u.role?._id) && <option value={u.role?._id ?? ""}>{u.role?.name ?? "—"}</option>}
                            {roles.data.map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{u.role?.name ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {canUpdate && !self && <Toggle checked={u.status === "ACTIVE"} onChange={(v) => changeStatus(u, v ? "ACTIVE" : "INACTIVE")} />}
                          <StatusPill value={u.status} />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-500">{formatShortDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Own account is edited from the profile page (PUT /auth/me). */}
                          {canUpdate && !self && (
                            <button onClick={() => setEditing(u)} title="Edit user" className="cursor-pointer p-1.5 text-slate-400 transition hover:text-amber-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && !self && (
                            <button onClick={() => remove(u)} title="Delete user" className="cursor-pointer p-1.5 text-slate-400 transition hover:text-rose-600">
                              <Trash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={users.pagination} onPage={setPage} />
      </div>

      <CreateUserModal open={creating} roles={roles.data ?? []} onClose={() => setCreating(false)} onCreated={users.reload} />
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={replace} />}
    </div>
  );
}

function CreateUserModal({ open, roles, onClose, onCreated }: { open: boolean; roles: Role[]; onClose: () => void; onCreated: () => void }) {
  const action = useApiAction();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", roleId: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setError("");
    setSaving(true);
    const res = await action("/users", { method: "POST", json: { ...form, roleId: form.roleId || undefined } });
    setSaving(false);
    if (res) {
      setForm({ fullName: "", email: "", password: "", roleId: "" });
      onCreated();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Add User</h2>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Full name</span>
          <input className={inputClass} value={form.fullName} onChange={set("fullName")} maxLength={100} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Email</span>
          <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Password</span>
          <input type="password" className={inputClass} value={form.password} onChange={set("password")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Role</span>
          <select className={inputClass} value={form.roleId} onChange={set("roleId")}>
            <option value="">Customer (default)</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <FieldError message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving}>
            Create User
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** PUT /users/{id}: name, email and phone of another user. Passwords are never set here. */
function EditUserModal({ user, onClose, onSaved }: { user: BackendUser; onClose: () => void; onSaved: (u: BackendUser) => void }) {
  const action = useApiAction();
  const [form, setForm] = useState({ fullName: user.fullName, email: user.email, phone: user.phone ?? "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.replace(/[\s-]/g, "");
    if (!form.fullName.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (phone && !BD_PHONE.test(phone)) return setError("Enter a valid Bangladeshi mobile number (e.g. 01712345678).");
    // Send only what changed.
    const changes: Record<string, string> = {};
    if (form.fullName.trim() !== user.fullName) changes.fullName = form.fullName.trim();
    if (form.email.trim().toLowerCase() !== user.email.toLowerCase()) changes.email = form.email.trim();
    if (phone !== (user.phone ?? "")) changes.phone = phone;
    if (!Object.keys(changes).length) return onClose();
    setError("");
    setSaving(true);
    const res = await action<BackendUser>(`/users/${user._id}`, { method: "PUT", json: changes });
    setSaving(false);
    if (res) {
      onSaved(res.data);
      onClose();
    }
  };

  return (
    <Modal open onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Edit User</h2>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Full name</span>
          <input className={inputClass} value={form.fullName} onChange={set("fullName")} maxLength={100} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Email</span>
          <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Mobile number</span>
          <input className={inputClass} value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="01XXXXXXXXX (optional)" />
        </label>
        <p className="text-[11px] text-slate-400">Role and status are changed from the list. Passwords cannot be set here.</p>
        <FieldError message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving}>
            Save Changes
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
