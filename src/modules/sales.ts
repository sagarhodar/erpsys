import {
  SalesQuotation,
  SalesOrder,
  DeliveryNote,
  SalesInvoice,
  QuotationItem,
  SOItem,
  DCItem,
  SalesInvoiceItem,
} from '../types.js';
import { query, transaction, getNextDocNo } from '../core/db.js';
import { ledger } from '../core/ledger.js';
import { eventBus } from '../core/event.js';
import { masterService } from './master.js';

export class SalesService {
  // SALES QUOTATION
  async createQuotation(quot: SalesQuotation): Promise<SalesQuotation> {
    return transaction(async (client) => {
      quot.doc_no = await getNextDocNo('SQ', client);
      quot.doc_date = new Date();
      quot.status = 'draft';

      quot.subtotal = quot.items.reduce((sum, item) => sum + item.amount, 0);
      quot.tax_amount = quot.items.reduce((sum, item) => sum + item.gst_amount, 0);
      quot.total = quot.subtotal + quot.tax_amount;

      const result = await client.query(
        `INSERT INTO sales_quotations 
         (doc_no, doc_date, status, customer_id, valid_till, terms, subtotal, tax_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [quot.doc_no, quot.doc_date, quot.status, quot.customer_id, quot.valid_till, quot.terms, quot.subtotal, quot.tax_amount, quot.total]
      );

      const doc = result.rows[0];

      for (const item of quot.items) {
        item.amount = item.qty * item.rate;
        item.gst_amount = (item.amount * item.gst_rate) / 100;

        await client.query(
          `INSERT INTO sales_quotation_items 
           (quotation_id, item_id, qty, rate, amount, gst_rate, gst_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [doc.id, item.item_id, item.qty, item.rate, item.amount, item.gst_rate, item.gst_amount]
        );
      }

      return this.getQuotation(doc.id);
    });
  }

  async submitQuotation(id: number): Promise<SalesQuotation> {
    await query(`UPDATE sales_quotations SET status = 'submitted' WHERE id = $1`, [id]);
    await eventBus.emit({
      type: 'quotation.submitted',
      docType: 'sales_quotation',
      docId: id,
      data: {},
      timestamp: new Date(),
    });
    return this.getQuotation(id);
  }

  async getQuotation(id: number): Promise<SalesQuotation> {
    const doc = await query(
      `SELECT sq.*, p.name as customer_name FROM sales_quotations sq
       JOIN parties p ON p.id = sq.customer_id WHERE sq.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT sqi.*, i.code as item_code, i.name as item_name 
       FROM sales_quotation_items sqi
       JOIN items i ON i.id = sqi.item_id
       WHERE sqi.quotation_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllQuotations(): Promise<SalesQuotation[]> {
    const result = await query(
      `SELECT sq.*, p.name as customer_name FROM sales_quotations sq
       JOIN parties p ON p.id = sq.customer_id ORDER BY sq.doc_date DESC`
    );
    return result.rows;
  }

  // SALES ORDER
  async createSO(so: SalesOrder): Promise<SalesOrder> {
    return transaction(async (client) => {
      so.doc_no = await getNextDocNo('SO', client);
      so.doc_date = new Date();
      so.status = 'draft';

      so.subtotal = so.items.reduce((sum, item) => sum + item.amount, 0);
      so.tax_amount = so.items.reduce((sum, item) => sum + item.gst_amount, 0);
      so.total = so.subtotal + so.tax_amount;

      const result = await client.query(
        `INSERT INTO sales_orders 
         (doc_no, doc_date, status, customer_id, quotation_id, delivery_date, terms, subtotal, tax_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [so.doc_no, so.doc_date, so.status, so.customer_id, so.quotation_id, so.delivery_date, so.terms, so.subtotal, so.tax_amount, so.total]
      );

      const doc = result.rows[0];

      for (const item of so.items) {
        item.amount = item.qty * item.rate;
        item.gst_amount = (item.amount * item.gst_rate) / 100;

        await client.query(
          `INSERT INTO sales_order_items 
           (so_id, item_id, qty, rate, amount, gst_rate, gst_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [doc.id, item.item_id, item.qty, item.rate, item.amount, item.gst_rate, item.gst_amount]
        );
      }

      return this.getSO(doc.id);
    });
  }

  async submitSO(id: number): Promise<SalesOrder> {
    return transaction(async (client) => {
      await client.query(`UPDATE sales_orders SET status = 'submitted' WHERE id = $1`, [id]);

      const so = await this.getSO(id);

      // Check stock availability
      for (const item of so.items) {
        const stock = await ledger.getItemStock(item.item_id);
        if (stock < item.qty) {
          throw new Error(`Insufficient stock for item ${item.item_name}. Available: ${stock}, Required: ${item.qty}`);
        }
      }

      await eventBus.emit({
        type: 'so.submitted',
        docType: 'sales_order',
        docId: id,
        data: so,
        timestamp: new Date(),
      });

      return so;
    });
  }

  async getSO(id: number): Promise<SalesOrder> {
    const doc = await query(
      `SELECT so.*, p.name as customer_name FROM sales_orders so
       JOIN parties p ON p.id = so.customer_id WHERE so.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT soi.*, i.code as item_code, i.name as item_name 
       FROM sales_order_items soi
       JOIN items i ON i.id = soi.item_id
       WHERE soi.so_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllSOs(): Promise<SalesOrder[]> {
    const result = await query(
      `SELECT so.*, p.name as customer_name FROM sales_orders so
       JOIN parties p ON p.id = so.customer_id ORDER BY so.doc_date DESC`
    );
    return result.rows;
  }

  // DELIVERY NOTE
  async createDC(dc: DeliveryNote): Promise<DeliveryNote> {
    return transaction(async (client) => {
      dc.doc_no = await getNextDocNo('DC', client);
      dc.doc_date = new Date();
      dc.status = 'draft';

      const result = await client.query(
        `INSERT INTO delivery_notes 
         (doc_no, doc_date, status, so_id, customer_id, vehicle_no)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [dc.doc_no, dc.doc_date, dc.status, dc.so_id, dc.customer_id, dc.vehicle_no]
      );

      const doc = result.rows[0];

      for (const item of dc.items) {
        await client.query(
          `INSERT INTO delivery_note_items (dc_id, item_id, delivered_qty)
           VALUES ($1, $2, $3)`,
          [doc.id, item.item_id, item.delivered_qty]
        );
      }

      return this.getDC(doc.id);
    });
  }

  async submitDC(id: number): Promise<DeliveryNote> {
    return transaction(async (client) => {
      await client.query(`UPDATE delivery_notes SET status = 'submitted' WHERE id = $1`, [id]);

      const dc = await this.getDC(id);

      // Post stock entries
      for (const item of dc.items) {
        const itemData = await masterService.getItem(item.item_id);
        await ledger.postStock(
          {
            doc_type: 'DC',
            doc_id: id,
            doc_no: dc.doc_no,
            doc_date: dc.doc_date,
            item_id: item.item_id,
            movement: 'out',
            qty: item.delivered_qty,
            rate: itemData?.rate || 0,
          },
          client
        );
      }

      await eventBus.emit({
        type: 'dc.submitted',
        docType: 'delivery_note',
        docId: id,
        data: dc,
        timestamp: new Date(),
      });

      return dc;
    });
  }

  async getDC(id: number): Promise<DeliveryNote> {
    const doc = await query(
      `SELECT dc.*, p.name as customer_name, so.doc_no as so_no 
       FROM delivery_notes dc
       JOIN parties p ON p.id = dc.customer_id
       LEFT JOIN sales_orders so ON so.id = dc.so_id
       WHERE dc.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT dci.*, i.code as item_code, i.name as item_name 
       FROM delivery_note_items dci
       JOIN items i ON i.id = dci.item_id
       WHERE dci.dc_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllDCs(): Promise<DeliveryNote[]> {
    const result = await query(
      `SELECT dc.*, p.name as customer_name FROM delivery_notes dc
       JOIN parties p ON p.id = dc.customer_id ORDER BY dc.doc_date DESC`
    );
    return result.rows;
  }

  // SALES INVOICE
  async createSalesInvoice(invoice: SalesInvoice): Promise<SalesInvoice> {
    return transaction(async (client) => {
      invoice.doc_no = await getNextDocNo('SINV', client);
      invoice.doc_date = new Date();
      invoice.status = 'draft';

      invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
      invoice.cgst = invoice.items.reduce((sum, item) => sum + item.cgst, 0);
      invoice.sgst = invoice.items.reduce((sum, item) => sum + item.sgst, 0);
      invoice.igst = invoice.items.reduce((sum, item) => sum + item.igst, 0);
      invoice.total = invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst;

      const result = await client.query(
        `INSERT INTO sales_invoices 
         (doc_no, doc_date, status, customer_id, dc_id, subtotal, cgst, sgst, igst, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [invoice.doc_no, invoice.doc_date, invoice.status, invoice.customer_id, invoice.dc_id, invoice.subtotal, invoice.cgst, invoice.sgst, invoice.igst, invoice.total]
      );

      const doc = result.rows[0];

      for (const item of invoice.items) {
        item.amount = item.qty * item.rate;
        const taxAmount = (item.amount * item.gst_rate) / 100;
        item.cgst = taxAmount / 2;
        item.sgst = taxAmount / 2;
        item.igst = 0;

        await client.query(
          `INSERT INTO sales_invoice_items 
           (invoice_id, item_id, qty, rate, amount, gst_rate, cgst, sgst, igst)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [doc.id, item.item_id, item.qty, item.rate, item.amount, item.gst_rate, item.cgst, item.sgst, item.igst]
        );
      }

      return this.getSalesInvoice(doc.id);
    });
  }

  async submitSalesInvoice(id: number): Promise<SalesInvoice> {
    return transaction(async (client) => {
      await client.query(`UPDATE sales_invoices SET status = 'submitted' WHERE id = $1`, [id]);

      const invoice = await this.getSalesInvoice(id);

      // Get account IDs
      const debtorAcc = await masterService.getAccountByCode('DEBTORS');
      const salesAcc = await masterService.getAccountByCode('SALES');
      const gstOutputAcc = await masterService.getAccountByCode('GST_OUTPUT');

      if (!debtorAcc || !salesAcc || !gstOutputAcc) {
        throw new Error('Required accounts not found');
      }

      // Post ledger entries
      // DR Debtor (Customer)
      await ledger.postEntry(
        {
          doc_type: 'SINV',
          doc_id: id,
          doc_no: invoice.doc_no,
          doc_date: invoice.doc_date,
          account_id: debtorAcc.id!,
          txn_type: 'debit',
          amount: invoice.total,
          party_id: invoice.customer_id,
        },
        client
      );

      // CR Sales
      await ledger.postEntry(
        {
          doc_type: 'SINV',
          doc_id: id,
          doc_no: invoice.doc_no,
          doc_date: invoice.doc_date,
          account_id: salesAcc.id!,
          txn_type: 'credit',
          amount: invoice.subtotal,
          party_id: invoice.customer_id,
        },
        client
      );

      // CR GST Output
      await ledger.postEntry(
        {
          doc_type: 'SINV',
          doc_id: id,
          doc_no: invoice.doc_no,
          doc_date: invoice.doc_date,
          account_id: gstOutputAcc.id!,
          txn_type: 'credit',
          amount: invoice.cgst + invoice.sgst + invoice.igst,
        },
        client
      );

      await eventBus.emit({
        type: 'sales_invoice.submitted',
        docType: 'sales_invoice',
        docId: id,
        data: invoice,
        timestamp: new Date(),
      });

      return invoice;
    });
  }

  async getSalesInvoice(id: number): Promise<SalesInvoice> {
    const doc = await query(
      `SELECT si.*, p.name as customer_name FROM sales_invoices si
       JOIN parties p ON p.id = si.customer_id WHERE si.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT sii.*, i.code as item_code, i.name as item_name 
       FROM sales_invoice_items sii
       JOIN items i ON i.id = sii.item_id
       WHERE sii.invoice_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllSalesInvoices(): Promise<SalesInvoice[]> {
    const result = await query(
      `SELECT si.*, p.name as customer_name FROM sales_invoices si
       JOIN parties p ON p.id = si.customer_id ORDER BY si.doc_date DESC`
    );
    return result.rows;
  }
}

export const salesService = new SalesService();