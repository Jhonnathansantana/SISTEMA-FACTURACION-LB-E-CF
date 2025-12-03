export enum NCFType {
  CREDITO_FISCAL = '31', // Factura de Crédito Fiscal (Type 01)
  CONSUMO = '32', // Factura de Consumo (Type 02)
  NOTA_DE_CREDITO = '34', // Nota de Crédito (Type 04)
  COMPRAS = '41', // Registro de Proveedores Informales (Type 11)
  GASTOS_MENORES = '43', // Gastos Menores (Type 13)
  REGIMEN_ESPECIAL = '44', // Regímenes Especiales (Type 14)
  GUBERNAMENTAL = '45', // Comprobantes Gubernamentales (Type 15)
  EXPORTACIONES = '46', // Comprobante para Exportaciones (Type 16)
  PAGOS_EXTERIOR = '47' // Pagos al Exterior (Type 17)
}

export enum TaxRate {
  EXEMPT = 0,
  REDUCED = 0.16,
  STANDARD = 0.18
}

export enum CustomerType {
  PERSONA_FISICA = 'F', // Persona Física
  PERSONA_JURIDICA = 'J', // Persona Jurídica
  GOBIERNO = 'G', // Gobierno
  ESPECIAL = 'E' // Regímenes Especiales
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Product {
  id?: number; // Auto-increment in Dexie
  code: string;
  name: string;
  price: number; // Unit price before tax
  taxRate: TaxRate;
  stock: number;
  category?: string;
  isService?: boolean; // If true, stock is ignored
}

export interface Customer {
  id?: number;
  rnc: string; // RNC or Cédula
  name: string;
  type: CustomerType;
  address?: string;
  email?: string;
  phone?: string;
}

export interface InvoiceItem {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number; // Snapshot of price at time of sale
  taxRate: number; // Snapshot of tax rate
  taxAmount: number; // Calculated tax amount for this line
  subtotal: number; // quantity * unitPrice
  total: number; // subtotal + taxAmount
}

export interface Invoice {
  id?: number;
  uuid: string; // Unique identifier for sync
  ncf: string; // The generated NCF string (e.g., E310000000001)
  ncfType: NCFType;
  customerId: number;
  customerRnc: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number; // Sum of items subtotal
  totalTax: number; // Sum of items taxAmount
  totalAmount: number; // Final amount to pay
  createdAt: Date;
  syncStatus: SyncStatus;
  syncError?: string; // Optional error message if sync failed
}

export interface NCFSequence {
  id?: number;
  type: NCFType;
  serie: string; // Usually 'E'
  currentSequence: number; // The last used sequence number
  limit: number; // The maximum sequence number allowed before requesting more
  validUntil: Date;
}
