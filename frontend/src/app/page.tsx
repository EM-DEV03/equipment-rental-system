'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock3, PackageCheck } from 'lucide-react';
import { api, formatDate, formatMoney } from '@/lib/api';
import type { DashboardSummary, Rental } from '@/lib/types';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [topEquipment, setTopEquipment] = useState<
    Array<{ equipmentId: string; equipmentName: string; quantity: number }>
  >([]);
  const [income, setIncome] = useState<{ totalIncome: number; totalRentals: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, rentalsData, topData, incomeData] = await Promise.all([
          api.dashboard(),
          api.activeRentals(),
          api.topEquipment(),
          api.income(),
        ]);
        setSummary(summaryData);
        setActiveRentals(rentalsData);
        setTopEquipment(topData);
        setIncome({
          totalIncome: incomeData.totalIncome,
          totalRentals: incomeData.totalRentals,
        });
      } catch (error) {
        setErrorMessage((error as Error).message);
      }
    }

    load();
  }, []);

  const metrics = summary?.metrics;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[36px] border border-white/60 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/25">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Operacion diaria</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight">
            Controla alquileres, inventario y devoluciones desde un solo tablero.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Este panel está pensado para uso administrativo rápido: quién alquiló, qué sigue pendiente y cuánto está entrando.
          </p>

          {errorMessage ? (
            <p className="mt-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{errorMessage}</p>
          ) : null}
        </div>

        <div className="rounded-[36px] border border-white/60 bg-white/80 p-8 shadow-xl shadow-stone-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Ingresos</p>
          <p className="mt-2 text-4xl font-black text-slate-900">
            {formatMoney(income?.totalIncome ?? 0)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {income?.totalRentals ?? 0} alquileres registrados en la base local.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Equipos disponibles',
            value: metrics?.totalAvailable ?? 0,
            icon: PackageCheck,
            style: 'bg-white/85 text-slate-900',
          },
          {
            label: 'Equipos alquilados',
            value: metrics?.totalRented ?? 0,
            icon: Activity,
            style: 'bg-amber-50 text-amber-900',
          },
          {
            label: 'Alquileres activos',
            value: metrics?.activeRentals ?? 0,
            icon: Clock3,
            style: 'bg-emerald-50 text-emerald-900',
          },
          {
            label: 'Vencen hoy',
            value: metrics?.rentalsDueToday ?? 0,
            icon: AlertTriangle,
            style: 'bg-rose-50 text-rose-900',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`rounded-[28px] border border-white/60 p-6 shadow-lg shadow-stone-200/40 ${card.style}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{card.label}</p>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-4xl font-black tracking-tight">{card.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Pendientes</p>
              <h2 className="text-2xl font-bold text-slate-900">Alquileres activos</h2>
            </div>
          </div>

          <div className="space-y-4">
            {activeRentals.slice(0, 6).map((rental) => (
              <div key={rental.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{rental.rentalNumber}</p>
                    <p className="text-sm text-slate-500">{rental.customer.fullName}</p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    {rental.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-3">
                  <p>Salida: {formatDate(rental.rentDate)}</p>
                  <p>Dev. estimada: {formatDate(rental.estimatedReturnDate)}</p>
                  <p>Total: {formatMoney(rental.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Más alquilados</p>
            <div className="mt-5 space-y-3">
              {topEquipment.slice(0, 5).map((item, index) => (
                <div key={item.equipmentId} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="font-semibold text-slate-900">{item.equipmentName}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{item.quantity} uds</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-orange-600 p-6 text-white shadow-xl shadow-orange-700/30">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-100">Últimos movimientos</p>
            <div className="mt-5 space-y-3">
              {summary?.recentRentals.map((rental) => (
                <div key={rental.id} className="rounded-2xl bg-white/10 p-4">
                  <p className="font-bold">{rental.rentalNumber}</p>
                  <p className="text-sm text-orange-100">{rental.customer.fullName}</p>
                  <p className="mt-1 text-sm text-orange-50">{formatDate(rental.createdAt)} - {formatMoney(rental.totalAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
