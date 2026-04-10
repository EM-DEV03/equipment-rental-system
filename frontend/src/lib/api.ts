import type {
  BusinessSettings,
  Customer,
  DashboardSummary,
  Equipment,
  Invoice,
  Payment,
  Rental,
  ReturnPreview,
  UserSummary,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');

  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('equipapp_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'No se pudo completar la solicitud';

    try {
      const error = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(error.message)) {
        message = error.message.join(', ');
      } else if (error.message) {
        message = error.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    apiFetch<{ token: string; user: UserSummary }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  users: () => apiFetch<UserSummary[]>('/auth/users'),
  createUser: (payload: {
    fullName: string;
    username: string;
    password: string;
    role: 'ADMIN' | 'EMPLOYEE';
  }) =>
    apiFetch<UserSummary>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (
    id: string,
    payload: Partial<{
      fullName: string;
      username: string;
      password: string;
      role: 'ADMIN' | 'EMPLOYEE';
      isActive: boolean;
    }>,
  ) =>
    apiFetch<UserSummary>(`/auth/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  customers: (search?: string) =>
    apiFetch<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createCustomer: (payload: {
    fullName: string;
    documentId: string;
    phone: string;
    address: string;
    notes?: string;
  }) =>
    apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  customerHistory: (id: string) =>
    apiFetch<{ customer: Customer; rentals: Rental[] }>(`/customers/${id}/history`),
  equipment: (search?: string) =>
    apiFetch<Equipment[]>(`/equipment${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createEquipment: (payload: {
    name: string;
    type: string;
    totalQuantity: number;
    dailyRate: number;
    location?: string;
  }) =>
    apiFetch<Equipment>('/equipment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEquipment: (
    id: string,
    payload: Partial<{
      name: string;
      type: string;
      totalQuantity: number;
      availableQuantity: number;
      maintenanceQuantity: number;
      damagedQuantity: number;
      dailyRate: number;
      location: string;
    }>,
  ) =>
    apiFetch<Equipment>(`/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteEquipment: (id: string) =>
    apiFetch<{ message: string }>(`/equipment/${id}`, {
      method: 'DELETE',
    }),
  dashboard: () => apiFetch<DashboardSummary>('/dashboard/summary'),
  activeRentals: () => apiFetch<Rental[]>('/reports/active-rentals'),
  topEquipment: () =>
    apiFetch<Array<{ equipmentId: string; equipmentName: string; quantity: number }>>(
      '/reports/top-equipment',
    ),
  income: () =>
    apiFetch<{
      totalIncome: number;
      totalRentals: number;
      items: Array<{
        rentalNumber: string;
        customer: string;
        amount: number;
        rentDate: string;
        status: string;
      }>;
    }>('/reports/income'),
  rentals: () => apiFetch<Rental[]>('/rentals'),
  createRental: (payload: {
    customerId: string;
    userId: string;
    documentType?: 'FACTURA' | 'RECIBO';
    rentDate?: string;
    estimatedReturnDate: string;
    notes?: string;
    items: Array<{ equipmentId: string; quantity: number }>;
  }) =>
    apiFetch<{ rental: Rental; invoice: Invoice }>('/rentals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  rentalByInvoice: (invoiceNumber: string) =>
    apiFetch<ReturnPreview>(`/rentals/invoice/${encodeURIComponent(invoiceNumber)}`),
  returnPreview: (invoiceNumber: string) =>
    apiFetch<ReturnPreview>(`/returns/invoice/${encodeURIComponent(invoiceNumber)}`),
  processReturn: (payload: {
    invoiceNumber: string;
    userId: string;
    notes?: string;
    returnedItems: Array<{
      equipmentId: string;
      quantity: number;
      condition: 'GOOD' | 'DAMAGED' | 'INCOMPLETE';
      notes?: string;
    }>;
  }) =>
    apiFetch('/returns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  payments: () => apiFetch<Payment[]>('/payments'),
  createPayment: (payload: {
    rentalId: string;
    userId?: string;
    amount: number;
    method: 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';
    reference?: string;
    notes?: string;
    paymentDate?: string;
  }) =>
    apiFetch<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  receivables: () =>
    apiFetch<
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
    >('/reports/receivables'),
  settings: () => apiFetch<BusinessSettings>('/settings'),
  updateSettings: (payload: Partial<BusinessSettings>) =>
    apiFetch<BusinessSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
