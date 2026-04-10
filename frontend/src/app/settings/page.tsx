'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { BusinessSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.settings()
      .then(setSettings)
      .catch((error) => setErrorMessage((error as Error).message));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const savedSettings = await api.updateSettings(settings);
      setSettings(savedSettings);
      setStatusMessage('Configuración actualizada.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  if (!settings) {
    return <div className="p-8 text-sm text-slate-500">Cargando configuración...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Configuración</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Datos del negocio</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={settings.businessName} onChange={(event) => setSettings((current) => current ? ({ ...current, businessName: event.target.value }) : current)} placeholder="Nombre del negocio" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={settings.taxId} onChange={(event) => setSettings((current) => current ? ({ ...current, taxId: event.target.value }) : current)} placeholder="NIT" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={settings.phone} onChange={(event) => setSettings((current) => current ? ({ ...current, phone: event.target.value }) : current)} placeholder="Teléfono" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={settings.email} onChange={(event) => setSettings((current) => current ? ({ ...current, email: event.target.value }) : current)} placeholder="Correo" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 md:col-span-2" value={settings.address} onChange={(event) => setSettings((current) => current ? ({ ...current, address: event.target.value }) : current)} placeholder="Dirección" />
        <textarea className="min-h-24 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 md:col-span-2" value={settings.invoiceFooter} onChange={(event) => setSettings((current) => current ? ({ ...current, invoiceFooter: event.target.value }) : current)} placeholder="Pie de factura" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" type="number" step="0.01" value={settings.latePenaltyRate} onChange={(event) => setSettings((current) => current ? ({ ...current, latePenaltyRate: Number(event.target.value) }) : current)} placeholder="Penalización mora" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" type="number" step="0.01" value={settings.damageChargeRate} onChange={(event) => setSettings((current) => current ? ({ ...current, damageChargeRate: Number(event.target.value) }) : current)} placeholder="Cargo daño" />
        <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" type="number" step="0.01" value={settings.missingChargeRate} onChange={(event) => setSettings((current) => current ? ({ ...current, missingChargeRate: Number(event.target.value) }) : current)} placeholder="Cargo faltante" />
        <select className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" value={settings.defaultPrinterProfile} onChange={(event) => setSettings((current) => current ? ({ ...current, defaultPrinterProfile: event.target.value as 'pos' | 'standard' }) : current)}>
          <option value="standard">Impresora normal / A4</option>
          <option value="pos">Impresora POS</option>
        </select>
      </div>

      {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

      <button className="mt-6 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white">
        Guardar configuración
      </button>
    </form>
  );
}
