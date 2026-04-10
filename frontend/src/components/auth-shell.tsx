'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isLoginRoute = pathname === '/login';
    const token = window.localStorage.getItem('equipapp_token');

    if (!token && !isLoginRoute) {
      router.replace('/login');
      return;
    }

    if (token && isLoginRoute) {
      router.replace('/');
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>;
  }

  return <>{children}</>;
}
