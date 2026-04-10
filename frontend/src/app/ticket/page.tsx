'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, formatDate, formatMoney } from '@/lib/api';
import type { ReturnPreview } from '@/lib/types';

function TicketContent() {
  const params = useSearchParams();
  const invoice = params.get('invoice') ?? '';
  const profile = params.get('profile') === 'pos' ? 'pos' : 'standard';
  const [preview, setPreview] = useState<ReturnPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!invoice) {
      return;
    }

    api.rentalByInvoice(invoice)
      .then(setPreview)
      .catch((error) => setErrorMessage((error as Error).message));
  }, [invoice]);

  return (
    <div
      className={`flex min-h-screen justify-center py-10 text-black ${
        profile === 'pos'
          ? 'bg-stone-200 font-mono text-sm'
          : 'bg-stone-100 text-[15px]'
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #ticket-pos, #ticket-pos * { visibility: visible; }
              #ticket-pos { position: absolute; left: 0; top: 0; width: ${
                profile === 'pos' ? '80mm' : '210mm'
              }; margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
          `,
        }}
      />

      <div className="flex flex-col items-center">
        <button
          className="no-print mb-6 rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white"
          onClick={() => window.print()}
        >
          {profile === 'pos' ? 'Imprimir ticket POS' : 'Imprimir documento normal'}
        </button>

        <div
          id="ticket-pos"
          className={`bg-white ${
            profile === 'pos'
              ? 'p-4'
              : 'w-[210mm] rounded-2xl border border-stone-300 p-10 shadow-xl'
          }`}
          style={{ width: profile === 'pos' ? '80mm' : '210mm' }}
        >
          {preview ? (
            profile === 'pos' ? (
              <>
                <div className="mb-4 text-center">
                  <h1 className="text-xl font-bold uppercase">RentalOps</h1>
                  <p>Control de alquiler de equipos</p>
                  <p>========================</p>
                  <p className="text-lg font-bold">
                    {preview.invoice.documentType} {preview.invoice.invoiceNumber}
                  </p>
                  <p>Fecha: {formatDate(preview.invoice.issueDate)}</p>
                </div>

                <div className="mb-4">
                  <p>
                    <strong>Cliente:</strong> {preview.rental.customer.fullName}
                  </p>
                  <p>
                    <strong>C.C/NIT:</strong> {preview.rental.customer.documentId}
                  </p>
                </div>

                <p>========================</p>
                <div className="mb-4 text-xs font-bold">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-14 text-left">CANT</th>
                        <th className="text-left">DESCRIP</th>
                        <th className="text-right">SUBT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rental.items.map((item) => (
                        <tr key={item.equipment.id}>
                          <td className="py-1 align-top text-center">
                            {item.quantity}
                          </td>
                          <td className="py-1 align-top break-words">
                            {item.equipment.name}
                          </td>
                          <td className="py-1 align-top text-right">
                            {formatMoney(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>========================</p>

                <div className="mb-4 text-right text-lg font-bold">
                  <p>TOTAL: {formatMoney(preview.invoice.totalAmount)}</p>
                </div>

                <div className="text-center text-xs">
                  <p>Devuelve exclusivamente con esta factura.</p>
                  <p>
                    Fecha estimada:{' '}
                    {formatDate(preview.rental.estimatedReturnDate)}
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-8">
                <div className="flex items-start justify-between border-b border-stone-300 pb-6">
                  <div>
                    <h1 className="text-3xl font-black uppercase text-slate-900">
                      RentalOps
                    </h1>
                    <p className="mt-2 text-slate-600">
                      Sistema de alquiler de equipos de construccion
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold uppercase text-slate-500">
                      {preview.invoice.documentType}
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {preview.invoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-slate-500">
                      Fecha: {formatDate(preview.invoice.issueDate)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Cliente
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {preview.rental.customer.fullName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {preview.rental.customer.documentId}
                    </p>
                    <p className="text-sm text-slate-600">
                      {preview.rental.customer.phone}
                    </p>
                    <p className="text-sm text-slate-600">
                      {preview.rental.customer.address}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Alquiler
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Salida: {formatDate(preview.rental.rentDate)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Devolucion estimada:{' '}
                      {formatDate(preview.rental.estimatedReturnDate)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Responsable: {preview.rental.user.fullName}
                    </p>
                  </div>
                </div>

                <table className="w-full overflow-hidden rounded-2xl border border-stone-300">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Equipo</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-right">Valor dia</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rental.items.map((item) => (
                      <tr key={item.equipment.id} className="border-t border-stone-200">
                        <td className="px-4 py-3">{item.equipment.name}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-full max-w-xs rounded-2xl bg-stone-50 p-4">
                    <div className="flex items-center justify-between text-lg font-black text-slate-900">
                      <span>Total</span>
                      <span>{formatMoney(preview.invoice.totalAmount)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      La devolucion de estos equipos debe hacerse con este
                      documento.
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <p>{errorMessage || 'Busca una factura desde el flujo de alquiler para imprimir.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketPOSPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-600">
          Cargando ticket...
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  );
}
