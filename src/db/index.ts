import Dexie, { Table } from 'dexie';
import { Product, Customer, Invoice, NCFSequence } from '../types';

class InvoiceDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  invoices!: Table<Invoice>;
  ncfSequences!: Table<NCFSequence>;

  constructor() {
    super('SistemaFacturacionLBECF');

    // Define schema
    this.version(1).stores({
      products: '++id, code, name', // Index by id, code, and name
      customers: '++id, rnc, name', // Index by id, rnc, and name
      invoices: '++id, uuid, ncf, customerId, syncStatus, createdAt', // Index by various fields
      ncfSequences: '++id, type, serie' // Index by type
    });
  }
}

export const db = new InvoiceDatabase();

// Helper to initialize some default data if empty (for prototype purposes)
export const initDB = async () => {
  const productCount = await db.products.count();
  if (productCount === 0) {
    await db.products.bulkAdd([
      { code: 'P001', name: 'Arroz 5LB', price: 200, taxRate: 0, stock: 100 },
      { code: 'P002', name: 'Cerveza Presidente', price: 150, taxRate: 0.18, stock: 50 },
      { code: 'P003', name: 'Servicio Mantenimiento', price: 1000, taxRate: 0.18, stock: 0, isService: true },
    ]);
  }

  const seqCount = await db.ncfSequences.count();
  if (seqCount === 0) {
    // Initialize sequences for prototype
    await db.ncfSequences.bulkAdd([
      { type: '31' as any, serie: 'E', currentSequence: 0, limit: 1000, validUntil: new Date('2025-12-31') },
      { type: '32' as any, serie: 'E', currentSequence: 0, limit: 1000, validUntil: new Date('2025-12-31') },
      { type: '34' as any, serie: 'E', currentSequence: 0, limit: 1000, validUntil: new Date('2025-12-31') },
    ]);
  }
};
