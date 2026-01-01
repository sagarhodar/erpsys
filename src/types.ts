// Core Types
export type DocStatus = 'draft' | 'submitted' | 'cancelled';
export type TxnType = 'debit' | 'credit';
export type PartyType = 'customer' | 'supplier' | 'both';
export type StockMovement = 'in' | 'out';

// Master Data
export interface Party {
  id?: number;
  code: string;
  name: string;
  type: PartyType;
  gstin?: string;
  contact?: string;
  email?: string;
  balance: number;
  created_at?: Date;
}

export interface Item {
  id?: number;
  code: string;
  name: string;
  unit: string;
  rate: number;
  hsn_code?: string;
  gst_rate: number;
  opening_stock: number;
  current_stock?: number;
  created_at?: Date;
}

export interface Account {
  id?: number;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'income' | 'expense' | 'equity';
  balance: number;
  created_at?: Date;
}

// Document Base
export interface BaseDoc {
  id?: number;
  doc_no: string;
  doc_date: Date;
  status: DocStatus;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Purchase Documents
export interface PurchaseIndent extends BaseDoc {
  requested_by: string;
  remarks?: string;
  items: IndentItem[];
}

export interface IndentItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  required_date: Date;
}

export interface PurchaseOrder extends BaseDoc {
  supplier_id: number;
  supplier_name?: string;
  indent_id?: number;
  delivery_date: Date;
  terms?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  items: POItem[];
}

export interface POItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

export interface GRN extends BaseDoc {
  po_id: number;
  po_no?: string;
  supplier_id: number;
  supplier_name?: string;
  challan_no?: string;
  challan_date?: Date;
  items: GRNItem[];
}

export interface GRNItem {
  po_item_id?: number;
  item_id: number;
  item_code?: string;
  item_name?: string;
  ordered_qty?: number;
  received_qty: number;
  rate: number;
  amount: number;
}

export interface PurchaseInvoice extends BaseDoc {
  supplier_id: number;
  supplier_name?: string;
  grn_id?: number;
  supplier_invoice_no: string;
  supplier_invoice_date: Date;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  items: PurchaseInvoiceItem[];
}

export interface PurchaseInvoiceItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  rate: number;
  amount: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// Sales Documents
export interface SalesQuotation extends BaseDoc {
  customer_id: number;
  customer_name?: string;
  valid_till: Date;
  terms?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  items: QuotationItem[];
}

export interface QuotationItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

export interface SalesOrder extends BaseDoc {
  customer_id: number;
  customer_name?: string;
  quotation_id?: number;
  delivery_date: Date;
  terms?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  items: SOItem[];
}

export interface SOItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

export interface DeliveryNote extends BaseDoc {
  so_id: number;
  so_no?: string;
  customer_id: number;
  customer_name?: string;
  vehicle_no?: string;
  items: DCItem[];
}

export interface DCItem {
  so_item_id?: number;
  item_id: number;
  item_code?: string;
  item_name?: string;
  ordered_qty?: number;
  delivered_qty: number;
}

export interface SalesInvoice extends BaseDoc {
  customer_id: number;
  customer_name?: string;
  dc_id?: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  items: SalesInvoiceItem[];
}

export interface SalesInvoiceItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  rate: number;
  amount: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// Inventory
export interface StockAdjustment extends BaseDoc {
  adjustment_type: 'increase' | 'decrease' | 'damage' | 'transfer';
  remarks?: string;
  items: AdjustmentItem[];
}

export interface AdjustmentItem {
  item_id: number;
  item_code?: string;
  item_name?: string;
  current_qty?: number;
  adjusted_qty: number;
  reason?: string;
}

// Ledger Entry
export interface LedgerEntry {
  id?: number;
  doc_type: string;
  doc_id: number;
  doc_no: string;
  doc_date: Date;
  account_id: number;
  account_name?: string;
  txn_type: TxnType;
  amount: number;
  party_id?: number;
  party_name?: string;
  remarks?: string;
  created_at?: Date;
}

// Stock Ledger
export interface StockLedger {
  id?: number;
  doc_type: string;
  doc_id: number;
  doc_no: string;
  doc_date: Date;
  item_id: number;
  item_code?: string;
  item_name?: string;
  movement: StockMovement;
  qty: number;
  rate: number;
  balance_qty?: number;
  created_at?: Date;
}

// Event System
export interface ERPEvent {
  type: string;
  docType: string;
  docId: number;
  data: any;
  timestamp: Date;
}

export type EventHandler = (event: ERPEvent) => Promise<void> | void;