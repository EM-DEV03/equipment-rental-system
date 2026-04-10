'use client';

import { useEffect, useState } from 'react';
import { api, formatDate, formatMoney } from '@/lib/api';
import type { ReturnPreview, UserSummary } from '@/lib/types';

type DraftReturnItem = {
  equipmentId: string;
  quantity: number;
  condition: 'GOOD' | 'DAMAGED' | 'INCOMPLETE';
  notes: string;
};

export default function ReturnsPage() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [preview, setPreview] = useState<ReturnPreview | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [items, setItems] = useState<Record<string, DraftReturnItem>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.users()
      .then((data) => {
        setUsers(data);
        setSelectedUserId(data[0]?.id ?? '');
      })
      .catch((error) => setErrorMessage((error as Error).message));
  }, []);

  async function searchInvoice() {
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const data = await api.returnPreview(invoiceNumber);
      setPreview(data);

      const draftState = data.outstandingItems.reduce<Record<string, DraftReturnItem>>((acc, item) => {
        acc[item.equipmentId] = {
          equipmentId: item.equipmentId,
          quantity: item.quantityPending,
          condition: 'GOOD',
          notes: '',
        };
        return acc;
      }, {});
      setItems(draftState);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setPreview(null);
    }
  }

  async function processReturn() {
    if (!preview) {
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await api.processReturn({
        invoiceNumber: preview.invoice.invoiceNumber,
        userId: selectedUserId,
        returnedItems: Object.values(items),
      });
      setStatusMessage('Devolución procesada correctamente.');
      await searchInvoice();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Devoluciones</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Obligatorio por número de factura</h1>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <input
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            placeholder="Ej. FAC-000001"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
          />
          <select className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
          <button onClick={searchInvoice} className="rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800">
            Buscar
          </button>
        </div>

        {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}
      </section>

      {preview ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Factura</p>
                <h2 className="text-2xl font-bold text-slate-900">{preview.invoice.invoiceNumber}</h2>
                <p className="text-sm text-slate-500">{preview.rental.customer.fullName}</p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                {preview.rental.status}
              </span>
            </div>

            <div className="space-y-4">
              {preview.outstandingItems.map((item) => (
                <div key={item.equipmentId} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.equipmentName}</p>
                      <p className="text-sm text-slate-500">
                        Salió: {item.quantityRented} · Devuelto: {item.quantityReturned} · Pendiente: {item.quantityPending}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-700">{formatMoney(item.unitPrice)}</p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[120px_180px_1fr]">
                    <input
                      type="number"
                      min="0"
                      max={item.quantityPending}
                      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                      value={items[item.equipmentId]?.quantity ?? 0}
                      onChange={(event) =>
                        setItems((current) => ({
                          ...current,
                          [item.equipmentId]: {
                            ...current[item.equipmentId],
                            quantity: Number(event.target.value),
                          },
                        }))
                      }
                    />
                    <select
                      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                      value={items[item.equipmentId]?.condition ?? 'GOOD'}
                      onChange={(event) =>
                        setItems((current) => ({
                          ...current,
                          [item.equipmentId]: {
                            ...current[item.equipmentId],
                            condition: event.target.value as DraftReturnItem['condition'],
                          },
                        }))
                      }
                    >
                      <option value="GOOD">Bueno</option>
                      <option value="DAMAGED">Dañado</option>
                      <option value="INCOMPLETE">Incompleto</option>
                    </select>
                    <input
                      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                      placeholder="Observaciones"
                      value={items[item.equipmentId]?.notes ?? ''}
                      onChange={(event) =>
                        setItems((current) => ({
                          ...current,
                          [item.equipmentId]: {
                            ...current[item.equipmentId],
                            notes: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={processReturn} className="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700">
              Procesar devolución
            </button>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/25">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Resumen del alquiler</p>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p>Salida: {formatDate(preview.rental.rentDate)}</p>
                <p>Devolución estimada: {formatDate(preview.rental.estimatedReturnDate)}</p>
                <p>Total inicial: {formatMoney(preview.invoice.totalAmount)}</p>
                <p>Devoluciones registradas: {preview.returns.length}</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Historial de devoluciones</p>
              <div className="mt-4 space-y-3">
                {preview.returns.length > 0 ? (
                  preview.returns.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-stone-50 p-4">
                      <p className="font-bold text-slate-900">{formatDate(item.returnDate)}</p>
                      <p className="text-sm text-slate-500">
                        Cargos adicionales: {formatMoney(item.totalAdditionalCharges)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aún no hay devoluciones registradas para esta factura.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
