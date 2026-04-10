'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, formatDate, formatMoney } from '@/lib/api';
import { readPrinterProfile, savePrinterProfile, type PrinterProfile } from '@/lib/print';
import type { Customer, Equipment, UserSummary } from '@/lib/types';

type DraftItem = {
  equipmentId: string;
  quantity: number;
};

export default function RentalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [documentType, setDocumentType] = useState<'FACTURA' | 'RECIBO'>('FACTURA');
  const [estimatedReturnDate, setEstimatedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [draftItem, setDraftItem] = useState<DraftItem>({ equipmentId: '', quantity: 1 });
  const [items, setItems] = useState<DraftItem[]>([]);
  const [printerProfile, setPrinterProfile] = useState<PrinterProfile>('standard');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<string | null>(null);
  const [createdPdfUrl, setCreatedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [customersData, equipmentData, usersData] = await Promise.all([
          api.customers(),
          api.equipment(),
          api.users(),
        ]);
        setCustomers(customersData);
        setEquipment(equipmentData);
        setUsers(usersData);
        setSelectedCustomerId(customersData[0]?.id ?? '');
        setSelectedUserId(usersData[0]?.id ?? '');
        setDraftItem({
          equipmentId: equipmentData[0]?.id ?? '',
          quantity: 1,
        });
      } catch (error) {
        setErrorMessage((error as Error).message);
      }
    }

    load();
    setPrinterProfile(readPrinterProfile());
  }, []);

  const estimatedTotal = useMemo(() => {
    if (!estimatedReturnDate) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const returnDate = new Date(estimatedReturnDate);
    const diffDays = Math.max(
      1,
      Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return items.reduce((sum, item) => {
      const currentEquipment = equipment.find((entry) => entry.id === item.equipmentId);
      if (!currentEquipment) {
        return sum;
      }
      return sum + currentEquipment.dailyRate * item.quantity * diffDays;
    }, 0);
  }, [equipment, estimatedReturnDate, items]);

  function addItem() {
    if (!draftItem.equipmentId || draftItem.quantity <= 0) {
      return;
    }

    setItems((current) => {
      const existingItem = current.find((item) => item.equipmentId === draftItem.equipmentId);
      if (existingItem) {
        return current.map((item) =>
          item.equipmentId === draftItem.equipmentId
            ? { ...item, quantity: item.quantity + draftItem.quantity }
            : item,
        );
      }

      return [...current, draftItem];
    });

    setDraftItem((current) => ({ ...current, quantity: 1 }));
  }

  function handlePrinterProfileChange(profile: PrinterProfile) {
    setPrinterProfile(profile);
    savePrinterProfile(profile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setCreatedInvoice(null);
    setCreatedPdfUrl(null);

    try {
      const response = await api.createRental({
        customerId: selectedCustomerId,
        userId: selectedUserId,
        documentType,
        estimatedReturnDate,
        notes,
        items,
      });

      setStatusMessage('Alquiler registrado correctamente.');
      setCreatedInvoice(response.invoice.invoiceNumber);
      setCreatedPdfUrl(response.invoice.pdfUrl ?? null);
      setItems([]);
      setNotes('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
          Nuevo alquiler
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Salida de equipos en 4 pasos
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={selectedCustomerId}
            onChange={(event) => setSelectedCustomerId(event.target.value)}
            required
          >
            <option value="">Selecciona cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName} - {customer.documentId}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            required
          >
            <option value="">Responsable</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value as 'FACTURA' | 'RECIBO')
            }
          >
            <option value="FACTURA">Factura</option>
            <option value="RECIBO">Recibo</option>
          </select>

          <input
            type="date"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={estimatedReturnDate}
            onChange={(event) => setEstimatedReturnDate(event.target.value)}
            required
          />
        </div>

        <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-4 text-sm text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold">Perfil de impresora</p>
              <p className="text-slate-300">
                POS imprime ticket de 80mm. Normal imprime factura o recibo en
                formato carta.
              </p>
            </div>
            <select
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              value={printerProfile}
              onChange={(event) =>
                handlePrinterProfileChange(event.target.value as PrinterProfile)
              }
            >
              <option value="standard">Impresora normal / A4</option>
              <option value="pos">Impresora POS 80mm</option>
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-stone-200 bg-stone-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Equipos</h2>
            <Link href="/customers" className="text-sm font-bold text-emerald-700">
              Crear cliente
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
            <select
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
              value={draftItem.equipmentId}
              onChange={(event) =>
                setDraftItem((current) => ({
                  ...current,
                  equipmentId: event.target.value,
                }))
              }
            >
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - stock {item.availableQuantity}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
              value={draftItem.quantity}
              onChange={(event) =>
                setDraftItem((current) => ({
                  ...current,
                  quantity: Number(event.target.value),
                }))
              }
            />
            <button
              type="button"
              onClick={addItem}
              className="rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Anadir
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const currentEquipment = equipment.find(
                (entry) => entry.id === item.equipmentId,
              );
              if (!currentEquipment) {
                return null;
              }

              return (
                <div
                  key={item.equipmentId}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {currentEquipment.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} unidad(es) -{' '}
                      {formatMoney(currentEquipment.dailyRate)} / dia
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) =>
                        current.filter(
                          (entry) => entry.equipmentId !== item.equipmentId,
                        ),
                      )
                    }
                    className="text-sm font-bold text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <textarea
          className="mt-6 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
          placeholder="Observaciones del alquiler"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {statusMessage ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {statusMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <button className="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700">
          Generar documento
        </button>
      </form>

      <section className="grid gap-6">
        <div className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/25">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Resumen
          </p>
          <p className="mt-2 text-3xl font-black">{formatMoney(estimatedTotal)}</p>
          <p className="mt-2 text-sm text-slate-300">
            Total estimado segun la fecha de devolucion escogida.
          </p>

          <div className="mt-6 space-y-3">
            {items.map((item) => {
              const currentEquipment = equipment.find(
                (entry) => entry.id === item.equipmentId,
              );
              if (!currentEquipment) {
                return null;
              }

              return (
                <div key={item.equipmentId} className="rounded-2xl bg-white/10 p-4">
                  <p className="font-bold">{currentEquipment.name}</p>
                  <p className="text-sm text-slate-300">
                    Cantidad: {item.quantity} - Stock restante:{' '}
                    {currentEquipment.availableQuantity}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Documento generado
          </p>
          {createdInvoice ? (
            <div className="mt-4 space-y-3">
              <p className="text-2xl font-black text-slate-900">{createdInvoice}</p>
              <p className="text-sm text-slate-500">
                Devuelve los equipos usando obligatoriamente este numero de factura.
              </p>
              {createdPdfUrl ? (
                <a
                  href={`http://localhost:3001${createdPdfUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white"
                >
                  Abrir PDF
                </a>
              ) : null}
              <Link
                href={`/ticket?invoice=${createdInvoice}&profile=${printerProfile}`}
                className="inline-flex rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-900"
              >
                {printerProfile === 'pos'
                  ? 'Imprimir ticket POS'
                  : 'Imprimir recibo normal'}
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Aqui aparecera la factura o recibo una vez se registre el alquiler.
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm text-slate-600">
            <p>
              Fecha estimada:{' '}
              {estimatedReturnDate ? formatDate(estimatedReturnDate) : '-'}
            </p>
            <p>Total equipos: {items.reduce((sum, item) => sum + item.quantity, 0)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
