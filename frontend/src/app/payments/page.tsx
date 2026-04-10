'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, formatDate, formatMoney } from '@/lib/api';
import type { Rental, UserSummary } from '@/lib/types';

export default function PaymentsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [receivables, setReceivables] = useState<
    Array<{
      rentalId: string;
      rentalNumber: string;
      customer: string;
      totalAmount: number;
      amountPaid: number;
      balanceDue: number;
      paymentStatus: string;
      estimatedReturnDate: string;
      status: string;
    }>
  >([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [form, setForm] = useState({
    rentalId: '',
    userId: '',
    amount: 0,
    method: 'CASH' as 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED',
    reference: '',
    notes: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      const [rentalsData, usersData, receivablesData, paymentsData] = await Promise.all([
        api.rentals(),
        api.users(),
        api.receivables(),
        api.payments(),
      ]);
      setRentals(rentalsData);
      setUsers(usersData);
      setReceivables(receivablesData);
      setPayments(paymentsData);
      setForm((current) => ({
        ...current,
        rentalId: receivablesData[0]?.rentalId ?? rentalsData[0]?.id ?? '',
        userId: usersData[0]?.id ?? '',
      }));
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await api.createPayment({
        rentalId: form.rentalId,
        userId: form.userId,
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
        notes: form.notes,
      });
      setStatusMessage('Pago registrado correctamente.');
      setForm((current) => ({ ...current, amount: 0, reference: '', notes: '' }));
      await load();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Pagos y cartera</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Control de saldo pendiente</h1>

        <div className="mt-6 grid gap-3">
          {receivables.map((item) => (
            <div key={item.rentalId} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{item.rentalNumber}</p>
                  <p className="text-sm text-slate-500">{item.customer}</p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                  {item.paymentStatus}
                </span>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-3">
                <p>Total: {formatMoney(item.totalAmount)}</p>
                <p>Pagado: {formatMoney(item.amountPaid)}</p>
                <p>Saldo: {formatMoney(item.balanceDue)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6">
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/25">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Nuevo abono</p>
          <h2 className="mt-2 text-2xl font-bold">Registrar pago</h2>

          <div className="mt-6 grid gap-4">
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={form.rentalId} onChange={(event) => setForm((current) => ({ ...current, rentalId: event.target.value }))}>
              {receivables.length > 0
                ? receivables.map((item) => (
                    <option key={item.rentalId} value={item.rentalId}>
                      {item.rentalNumber} - {item.customer} - saldo {formatMoney(item.balanceDue)}
                    </option>
                  ))
                : rentals.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.rentalNumber} - {item.customer.fullName}
                    </option>
                  ))}
            </select>
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
            <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" min="0" placeholder="Valor abonado" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} required />
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value as typeof form.method }))}>
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CARD">Tarjeta</option>
              <option value="MIXED">Mixto</option>
            </select>
            <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Referencia" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} />
            <textarea className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Notas" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>

          {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{statusMessage}</p> : null}
          {errorMessage ? <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{errorMessage}</p> : null}

          <button className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white">
            Guardar abono
          </button>
        </form>

        <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Ultimos pagos</p>
          <div className="mt-4 space-y-3">
            {payments.slice(0, 8).map((payment) => (
              <div key={payment.id} className="rounded-2xl bg-stone-50 p-4">
                <p className="font-bold text-slate-900">{payment.rental.rentalNumber}</p>
                <p className="text-sm text-slate-500">{payment.reference}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatMoney(payment.amount)} - {payment.method} - {formatDate(payment.paymentDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
