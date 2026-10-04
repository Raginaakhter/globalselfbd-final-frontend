"use client";

import React, { useRef, useState } from "react";
import { Calendar, Camera, Loader2, Mail, Pencil, Phone, Save, User as UserIcon, X } from "lucide-react";
import { useAuth, type ProfileChanges } from "@/context/AuthContext";

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";
const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1";

/** Round profile picture with an upload button (POST /api/uploads/avatar saves it right away). */
export function AvatarPicker() {
  const { user, uploadAvatar, hasPermission } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const canEdit = hasPermission("profile.update");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) return void alert("Please choose an image smaller than 5MB.");
    setBusy(true);
    await uploadAvatar(file);
    setBusy(false);
  };

  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[3px] shadow-xl shadow-cyan-500/20">
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl font-black text-cyan-600 overflow-hidden">
          {busy ? (
            <Loader2 className="w-7 h-7 animate-spin text-cyan-600" />
          ) : user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            (user?.name?.charAt(0).toUpperCase() ?? "U")
          )}
        </div>
      </div>
      {canEdit && (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            aria-label="Change profile picture"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-cyan-700 cursor-pointer disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFile} />
        </>
      )}
    </div>
  );
}

/** Account tab: shows the profile and edits it with PUT /api/auth/me. */
export default function AccountPanel() {
  const { user, updateProfile, hasPermission } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", email: "", currentPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const canEdit = hasPermission("profile.update");
  if (!user) return null;

  const emailChanged = form.email.trim().toLowerCase() !== user.email.toLowerCase();
  const phoneChanged = form.phoneNumber.replace(/[\s-]/g, "") !== user.phoneNumber;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const startEditing = () => {
    setForm({ fullName: user.name, phoneNumber: user.phoneNumber, email: user.email, currentPassword: "" });
    setErrors({});
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    const phoneNumber = form.phoneNumber.replace(/[\s-]/g, "");
    if (!form.fullName.trim()) found.fullName = "Name cannot be empty.";
    if (phoneNumber && !BD_PHONE.test(phoneNumber)) found.phoneNumber = "Enter a valid Bangladeshi mobile number (e.g. 01712345678).";
    if (form.email.trim() && !EMAIL.test(form.email.trim())) found.email = "Enter a valid email address.";
    // Backend requires currentPassword to change phone or email.
    if ((phoneChanged || emailChanged) && !form.currentPassword) {
      found.currentPassword = "Enter your current password to change contact details.";
    }
    setErrors(found);
    if (Object.keys(found).length) return;

    // Send only what changed.
    const changes: ProfileChanges = {};
    if (form.fullName.trim() !== user.name) changes.fullName = form.fullName.trim();
    if (phoneChanged) changes.phoneNumber = phoneNumber;
    if (emailChanged) changes.email = form.email.trim();
    if (phoneChanged || emailChanged) changes.currentPassword = form.currentPassword;
    if (!Object.keys(changes).length) return setEditing(false);

    setSaving(true);
    const ok = await updateProfile(changes);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <div className="auth-card rounded-3xl p-8 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-cyan-600" />
          <span>Personal Information</span>
        </h2>
        {canEdit && !editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className={labelClass}>Full Name</span>
              <input value={form.fullName} onChange={set("fullName")} maxLength={100} autoComplete="name" className={inputClass} />
              {errors.fullName && <span className="text-xs font-semibold text-rose-600">{errors.fullName}</span>}
            </label>
            <label className="block">
              <span className={labelClass}>Mobile Number</span>
              <input value={form.phoneNumber} onChange={set("phoneNumber")} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={inputClass} />
              {errors.phoneNumber && <span className="text-xs font-semibold text-rose-600">{errors.phoneNumber}</span>}
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Email Address (optional)</span>
              <input type="email" value={form.email} onChange={set("email")} autoComplete="email" className={inputClass} />
              {errors.email && <span className="text-xs font-semibold text-rose-600">{errors.email}</span>}
            </label>
            {(emailChanged || phoneChanged) && (
              <label className="block sm:col-span-2">
                <span className={labelClass}>Current Password (needed to change phone or email)</span>
                <input type="password" value={form.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" className={inputClass} />
                {errors.currentPassword && <span className="text-xs font-semibold text-rose-600">{errors.currentPassword}</span>}
              </label>
            )}
          </div>
          <p className="text-xs text-slate-500">To change your password, use &quot;Forgot password&quot; on the sign-in page.</p>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className={labelClass}>Full Name</span>
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
          </div>
          <div>
            <span className={labelClass}>Mobile Number</span>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> {user.phoneNumber || <span className="text-slate-400 font-medium">Not added</span>}
            </p>
          </div>
          <div>
            <span className={labelClass}>Email Address</span>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> {user.email || <span className="text-slate-400 font-medium">Not added</span>}
            </p>
          </div>
          <div>
            <span className={labelClass}>Account Role</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{user.roleName}</span>
          </div>
          <div>
            <span className={labelClass}>Member Since</span>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
