export type UserSummary = {
  id: string;
  fullName: string;
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive?: boolean;
};

export type Customer = {
  id: string;
  fullName: string;
  documentId: string;
  phone: string;
  address: string;
  notes?: string | null;
  createdAt?: string;
};

export type Equipment = {
  id: string;
  name: string;
  type: string;
  totalQuantity: number;
  availableQuantity: number;
  maintenanceQuantity: number;
  damagedQuantity: number;
  dailyRate: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MAINTENANCE';
  location?: string | null;
};

export type RentalItem = {
  id?: string;
  quantity: number;
  unitPrice: number;
  estimatedDays: number;
  lineTotal: number;
  equipment: Equipment;
};

export type Rental = {
  id: string;
  rentalNumber: string;
  customer: Customer;
  user: UserSummary;
  rentDate: string;
  estimatedReturnDate: string;
  actualReturnDate?: string | null;
  status: 'ACTIVE' | 'PARTIAL_RETURNED' | 'COMPLETED' | 'OVERDUE';
  subtotal: number;
  latePenalty: number;
  damageCharges: number;
  totalAmount: number;
  notes?: string | null;
  items: RentalItem[];
  createdAt?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  documentType: 'FACTURA' | 'RECIBO';
  totalAmount: number;
  pdfUrl?: string | null;
  issueDate?: string;
  rental: Rental;
};

export type ReturnPreviewItem = {
  equipmentId: string;
  equipmentName: string;
  quantityRented: number;
  quantityReturned: number;
  quantityPending: number;
  unitPrice: number;
};

export type ReturnPreview = {
  invoice: Invoice;
  rental: Rental;
  returns: Array<{
    id: string;
    returnDate: string;
    totalAdditionalCharges: number;
  }>;
  outstandingItems: ReturnPreviewItem[];
};

export type DashboardSummary = {
  metrics: {
    totalAvailable: number;
    totalRented: number;
    activeRentals: number;
    returnsToday: number;
    rentalsDueToday: number;
    pendingBalance: number;
  };
  recentRentals: Rental[];
};

export type Payment = {
  id: string;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';
  reference: string;
  notes?: string | null;
  paymentDate: string;
  rental: Rental;
  user?: UserSummary | null;
};

export type BusinessSettings = {
  id: string;
  businessName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  invoiceFooter: string;
  latePenaltyRate: number;
  damageChargeRate: number;
  missingChargeRate: number;
  defaultPrinterProfile: 'pos' | 'standard';
  currencyCode: string;
};
