'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123*');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const response = await api.login({ username, password });
      window.localStorage.setItem('equipapp_token', response.token);
      window.localStorage.setItem('equipapp_user', JSON.stringify(response.user));
      router.push('/');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[32px] border border-white/60 bg-white/85 p-8 shadow-2xl shadow-stone-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-700">Acceso</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Ingresar al sistema</h1>
        <p className="mt-2 text-sm text-slate-500">Usa las credenciales demo creadas automáticamente al iniciar el backend.</p>

        <div className="mt-6 grid gap-4">
          <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Usuario" />
          <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" />
        </div>

        {errorMessage ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

        <button className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-slate-800">
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
