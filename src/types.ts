export type Role = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  branchId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  alternateMobile?: string;
  address?: string;
  aadhaar?: string;
  pan?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  commission: number;
  tax: number;
  turnaroundTime: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface BillService {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  tax: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  services: BillService[];
  totalAmount: number;
  discount: number;
  taxAmount: number;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: string;
  branchId: string;
  staffId: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  branchId: string;
  staffId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  branchId: string;
}
