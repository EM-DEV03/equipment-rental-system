export type RentalRequestItem = {
  equipmentId: string;
  quantity: number;
};

export type ReturnRequestItem = {
  equipmentId: string;
  quantityReturned: number;
  condition: 'GOOD' | 'DAMAGED' | 'INCOMPLETE';
  notes?: string;
};
