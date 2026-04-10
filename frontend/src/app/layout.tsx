import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Equipos Construccion MVP',
  description: 'Sistema simple y confiable para alquiler de equipos de construccion',
};

const navigation = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/inventory', label: 'Inventario', icon: Package },
  { href: '/rental', label: 'Alquilar', icon: ClipboardList },
  { href: '/returns', label: 'Devolver', icon: ArrowLeftRight },
  { href: '/payments', label: 'Pagos', icon: Receipt },
  { href: '/users', label: 'Usuarios', icon: Users },
  { href: '/settings', label: 'Ajustes', icon: SlidersHorizontal },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="text-slate-800">
        <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
          <aside className="border-b border-white/50 bg-slate-950 px-5 py-6 text-white md:min-h-screen md:border-b-0 md:border-r md:border-r-white/10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 shadow-lg shadow-orange-900/40">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">Arley Rental</p>
                <p className="text-sm text-slate-400">Operacion diaria sin friccion</p>
              </div>
            </div>

            <nav className="grid gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-white"
                  >
                    <Icon className="h-5 w-5 text-amber-400" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-10 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Acceso Demo</span>
              </div>
              <p className="text-sm text-slate-200">Usuario: <strong>admin</strong></p>
              <p className="text-sm text-slate-200">Clave: <strong>Admin123*</strong></p>
            </div>
          </aside>

          <main className="min-h-screen p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              <AuthShell>{children}</AuthShell>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
