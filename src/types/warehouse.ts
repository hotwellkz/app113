import { User } from './user';

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  averagePurchasePrice: number;
  totalPurchasePrice: number;
  unit: string;
  image?: string | null;
  createdAt: any;
  updatedAt: any;
  folderId?: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
  date: any;
  addedBy: User;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface WarehouseStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  categories: number;
}

export interface ProductHistory {
  id: string;
  productId: string;
  type: 'add' | 'remove' | 'update';
  quantity: number;
  price?: number;
  date: any;
  user: User;
  description?: string;
}

export interface ProductFolder {
  id: string;
  name: string;
  color: string;
  image?: string | null;
  warehouses: string[];
  barcode: string;
  createdAt: any;
  parentId?: string | null;
}