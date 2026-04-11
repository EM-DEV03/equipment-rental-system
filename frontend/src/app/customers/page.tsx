'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, formatDate, formatMoney } from '@/lib/api';
import type { Customer, Rental } from '@/lib/types';

const emptyCustomer = {
  fullName: '',
  documentId: '',
  phone: '',
  address: '',
  notes: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Rental[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyCustomer);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadCustomers() {
    try {
      const data = await api.customers(search);
      setCustomers(data);
      if (!selectedCustomer && data.length > 0) {
        setSelectedCustomer(data[0]);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  async function loadHistory(customerId: string) {
    try {
      const data = await api.customerHistory(customerId);
      setHistory(data.rentals);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [search]);

  useEffect(() => {
    if (selectedCustomer) {
      loadHistory(selectedCustomer.id);
      setForm({
        fullName: selectedCustomer.fullName,
        documentId: selectedCustomer.documentId,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
        notes: selectedCustomer.notes ?? '',
      });
      setIsEditing(false);
    }
  }, [selectedCustomer]);

  const activeRentals = useMemo(
    () => history.filter((rental) => rental.status !== 'COMPLETED').length,
    [history],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (isEditing && selectedCustomer) {
        // Actualizar cliente existente
        const customer = await api.updateCustomer(selectedCustomer.id, form);
        setStatusMessage(`Cliente ${customer.fullName} actualizado correctamente.`);
        setSelectedCustomer(customer);
        setIsEditing(false);
        await loadCustomers();
      } else {
        // Crear nuevo cliente
        const customer = await api.createCustomer(form);
        setForm(emptyCustomer);
        setStatusMessage(`Cliente ${customer.fullName} registrado correctamente.`);
        await loadCustomers();
        setSelectedCustomer(customer);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  function handleEditClick() {
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    if (selectedCustomer) {
      setForm({
        fullName: selectedCustomer.fullName,
        documentId: selectedCustomer.documentId,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
        notes: selectedCustomer.notes ?? '',
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60 backdrop-blur">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">Clientes</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Registro y consulta rápida</h1>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, cédula o teléfono"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm md:max-w-sm"
          />
        </div>

        <div className="grid gap-3">
          {customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setSelectedCustomer(customer)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedCustomer?.id === customer.id
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-stone-200 bg-white hover:border-orange-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{customer.fullName}</p>
                  <p className="text-sm text-slate-600">{customer.documentId}</p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                  {customer.phone}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{customer.address}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Historial</p>
          <h2 className="mt-2 text-2xl font-bold">{selectedCustomer?.fullName ?? 'Selecciona un cliente'}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Alquileres totales</p>
              <p className="mt-1 text-3xl font-extrabold">{history.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Activos</p>
              <p className="mt-1 text-3xl font-extrabold">{activeRentals}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {history.slice(0, 5).map((rental) => (
              <div key={rental.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{rental.rentalNumber}</p>
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-200">
                    {rental.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{formatDate(rental.rentDate)} - {formatMoney(rental.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {isEditing ? 'Editar' : 'Nuevo'} cliente
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {isEditing
                  ? `Actualizar datos de ${selectedCustomer?.fullName || ''}`
                  : 'Crear cliente sin salir del sistema'}
              </h2>
            </div>
            {selectedCustomer && !isEditing && (
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 whitespace-nowrap"
              >
                Editar datos
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            {statusMessage ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</p> : null}
            {errorMessage ? <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Nombre completo"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
              disabled={selectedCustomer && !isEditing}
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Cédula o NIT"
              value={form.documentId}
              onChange={(event) => setForm((current) => ({ ...current, documentId: event.target.value }))}
              required
              disabled={selectedCustomer && !isEditing}
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Teléfono"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              required
              disabled={selectedCustomer && !isEditing}
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Dirección"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              required
              disabled={selectedCustomer && !isEditing}
            />
            <textarea
              className="min-h-24 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Notas opcionales"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              disabled={selectedCustomer && !isEditing}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-700 px-5 py-4 font-bold text-white transition hover:bg-emerald-800"
            >
              {isEditing ? 'Actualizar cliente' : 'Guardar cliente'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-2xl border border-stone-200 px-5 py-4 font-bold text-slate-700 transition hover:border-red-400 hover:bg-red-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

