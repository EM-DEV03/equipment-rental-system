'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { UserSummary } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      setUsers(await api.users());
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await api.createUser(form);
      setStatusMessage('Usuario creado correctamente.');
      setForm({ fullName: '', username: '', password: '', role: 'EMPLOYEE' });
      await load();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  async function toggleUser(user: UserSummary) {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      await load();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Usuarios</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Acceso y roles</h1>

        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
              <div>
                <p className="font-bold text-slate-900">{user.fullName}</p>
                <p className="text-sm text-slate-500">{user.username} - {user.role}</p>
              </div>
              <button onClick={() => toggleUser(user)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/25">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Nuevo usuario</p>
        <h2 className="mt-2 text-2xl font-bold">Crear acceso</h2>

        <div className="mt-6 grid gap-4">
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre completo" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Usuario" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="password" placeholder="Contraseña" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as 'ADMIN' | 'EMPLOYEE' }))}>
            <option value="EMPLOYEE">Empleado</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{errorMessage}</p> : null}

        <button className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white">
          Guardar usuario
        </button>
      </form>
    </div>
  );
}
