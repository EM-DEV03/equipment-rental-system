'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    window.localStorage.removeItem('equipapp_token');
    window.localStorage.removeItem('equipapp_user');
    router.push('/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-4 w-full rounded-2xl border border-rose-500 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/15"
    >
      Cerrar sesión
    </button>
  );
}
