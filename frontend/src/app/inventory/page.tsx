'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
import type { Equipment } from '@/lib/types';

const initialForm = {
  name: '',
  type: '',
  totalQuantity: 1,
  dailyRate: 0,
  location: '',
};

export default function InventoryPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

  async function loadEquipment() {
    try {
      const data = await api.equipment(search);
      setEquipment(data);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  useEffect(() => {
    loadEquipment();
  }, [search]);

  const totals = useMemo(
    () => ({
      total: equipment.reduce((sum, item) => sum + item.totalQuantity, 0),
      available: equipment.reduce((sum, item) => sum + item.availableQuantity, 0),
      maintenance: equipment.reduce((sum, item) => sum + item.maintenanceQuantity, 0),
    }),
    [equipment],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (editingId) {
        await api.updateEquipment(editingId, {
          ...form,
          totalQuantity: Number(form.totalQuantity),
          dailyRate: Number(form.dailyRate),
        });
        setStatusMessage('Equipo actualizado correctamente.');
        setEditingId(null);
      } else {
        await api.createEquipment({
          ...form,
          totalQuantity: Number(form.totalQuantity),
          dailyRate: Number(form.dailyRate),
        });
        setStatusMessage('Equipo agregado correctamente.');
      }
      setForm(initialForm);
      await loadEquipment();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  function handleEdit(item: Equipment) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      totalQuantity: item.totalQuantity,
      dailyRate: item.dailyRate,
      location: item.location || '',
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      return;
    }

    setLoadingDelete(id);
    setErrorMessage(null);

    try {
      await api.deleteEquipment(id);
      setStatusMessage('Equipo eliminado correctamente.');
      await loadEquipment();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoadingDelete(null);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(initialForm);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-stone-200/60">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Inventario</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Control en tiempo real</h1>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar equipo o tipo"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm md:min-w-72"
          />
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm text-slate-500">Unidades totales</p>
            <p className="mt-1 text-3xl font-black">{totals.total}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Disponibles</p>
            <p className="mt-1 text-3xl font-black text-emerald-900">{totals.available}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Mantenimiento</p>
            <p className="mt-1 text-3xl font-black text-amber-900">{totals.maintenance}</p>
          </div>
        </div>

        <div className="space-y-3">
          {equipment.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-slate-500">No hay equipos registrados</p>
            </div>
          ) : (
            equipment.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.type} · {item.location || 'Sin ubicación'}</p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <p><span className="font-semibold">Total en bodega:</span> {item.totalQuantity}</p>
                  <p><span className="font-semibold">Disponibles:</span> {item.availableQuantity}</p>
                  <p><span className="font-semibold">En taller:</span> {item.maintenanceQuantity}</p>
                  <p><span className="font-semibold">Tarifa/día:</span> {formatMoney(item.dailyRate)}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    disabled={editingId === item.id}
                    className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={loadingDelete === item.id}
                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white enabled:hover:bg-red-600 disabled:opacity-50"
                  >
                    {loadingDelete === item.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/25">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">{editingId ? 'EDITAR' : 'NUEVO'} EQUIPO</p>
        <h2 className="mt-2 text-2xl font-bold">{editingId ? 'Actualizar equipo' : 'Carga inventario sin planillas'}</h2>

        <div className="mt-6 grid gap-4">
          {statusMessage ? <p className="rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{statusMessage}</p> : null}
          {errorMessage ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{errorMessage}</p> : null}
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del equipo *</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" 
              placeholder="Ej: Andamio tubular estándar" 
              value={form.name} 
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo o categoría *</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" 
              placeholder="Ej: Andamios, Herramientas, Maquinaria" 
              value={form.type} 
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cantidad total en bodega *</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" 
              type="number" 
              min="1" 
              placeholder="Ej: 10" 
              value={form.totalQuantity} 
              onChange={(event) => setForm((current) => ({ ...current, totalQuantity: Number(event.target.value) }))} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tarifa por día ($) *</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" 
              type="number" 
              min="0" 
              placeholder="Ej: 50000" 
              value={form.dailyRate} 
              onChange={(event) => setForm((current) => ({ ...current, dailyRate: Number(event.target.value) }))} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ubicación (opcional)</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" 
              placeholder="Ej: Bodega A, Zona 3" 
              value={form.location} 
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} 
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            type="submit"
            className="flex-1 rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white transition hover:bg-orange-600"
          >
            {editingId ? 'Actualizar equipo' : 'Registrar equipo'}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={handleCancel}
              className="rounded-2xl border border-white/20 px-5 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
