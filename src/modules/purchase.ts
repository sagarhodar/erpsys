import {
  PurchaseIndent,
  PurchaseOrder,
  GRN,
  PurchaseInvoice,
  POItem,
  GRNItem,
  PurchaseInvoiceItem,
} from '../types.js';
import { query, transaction, getNextDocNo } from '../core/db.js';
import { ledger } from '../core/ledger.js';
import { eventBus } from '../core/event.js';
import { masterService } from './master.js';

export class PurchaseService {
  // PURCHASE INDENT
  async createIndent(indent: PurchaseIndent): Promise<PurchaseIndent> {
    return transaction(async (client) => {
      indent.doc_no = await getNextDocNo('PI', client);
      indent.doc_date = new Date();
      indent.status = 'draft';

      const result = await client.query(
        `INSERT INTO purchase_indents (doc_no, doc_date, status, requested_by, remarks)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [indent.doc_no, indent.doc_date, indent.status, indent.requested_by, indent.remarks]
      );

      const doc = result.rows[0];

      for (const item of indent.items) {
        await client.query(
          `INSERT INTO purchase_indent_items (indent_id, item_id, qty, required_date)
           VALUES ($1, $2, $3, $4)`,
          [doc.id, item.item_id, item.qty, item.required_date]
        );
      }

      return this.getIndent(doc.id);
    });
  }

  async submitIndent(id: number): Promise<PurchaseIndent> {
    await query(`UPDATE purchase_indents SET status = 'submitted' WHERE id = $1`, [id]);
    await eventBus.emit({
      type: 'indent.submitted',
      docType: 'purchase_indent',
      docId: id,
      data: {},
      timestamp: new Date(),
    });
    return this.getIndent(id);
  }

  async getIndent(id: number): Promise<PurchaseIndent> {
    const doc = await query(`SELECT * FROM purchase_indents WHERE id = $1`, [id]);
    const items = await query(
      `SELECT pii.*, i.code as item_code, i.name as item_name 
       FROM purchase_indent_items pii
       JOIN items i ON i.id = pii.item_id
       WHERE pii.indent_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllIndents(): Promise<PurchaseIndent[]> {
    const result = await query(`SELECT * FROM purchase_indents ORDER BY doc_date DESC`);
    return result.rows;
  }

  // PURCHASE ORDER
  async createPO(po: PurchaseOrder): Promise<PurchaseOrder> {
    return transaction(async (client) => {
      po.doc_no = await getNextDocNo('PO', client);
      po.doc_date = new Date();
      po.status = 'draft';

      // Calculate totals
      po.subtotal = po.items.reduce((sum, item) => sum + item.amount, 0);
      po.tax_amount = po.items.reduce((sum, item) => sum + item.gst_amount, 0);
      po.total = po.subtotal + po.tax_amount;

      const result = await client.query(
        `INSERT INTO purchase_orders 
         (doc_no, doc_date, status, supplier_id, indent_id, delivery_date, terms, subtotal, tax_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          po.doc_no,
          po.doc_date,
          po.status,
          po.supplier_id,
          po.indent_id,
          po.delivery_date,
          po.terms,
          po.subtotal,
          po.tax_amount,
          po.total,
        ]
      );

      const doc = result.rows[0];

      for (const item of po.items) {
        item.amount = item.qty * item.rate;
        item.gst_amount = (item.amount * item.gst_rate) / 100;

        await client.query(
          `INSERT INTO purchase_order_items 
           (po_id, item_id, qty, rate, amount, gst_rate, gst_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [doc.id, item.item_id, item.qty, item.rate, item.amount, item.gst_rate, item.gst_amount]
        );
      }

      return this.getPO(doc.id);
    });
  }

  async submitPO(id: number): Promise<PurchaseOrder> {
    await query(`UPDATE purchase_orders SET status = 'submitted' WHERE id = $1`, [id]);
    await eventBus.emit({
      type: 'po.submitted',
      docType: 'purchase_order',
      docId: id,
      data: {},
      timestamp: new Date(),
    });
    return this.getPO(id);
  }

  async getPO(id: number): Promise<PurchaseOrder> {
    const doc = await query(
      `SELECT po.*, p.name as supplier_name FROM purchase_orders po
       JOIN parties p ON p.id = po.supplier_id WHERE po.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT poi.*, i.code as item_code, i.name as item_name 
       FROM purchase_order_items poi
       JOIN items i ON i.id = poi.item_id
       WHERE poi.po_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllPOs(): Promise<PurchaseOrder[]> {
    const result = await query(
      `SELECT po.*, p.name as supplier_name FROM purchase_orders po
       JOIN parties p ON p.id = po.supplier_id ORDER BY po.doc_date DESC`
    );
    return result.rows;
  }

  // GOODS RECEIPT NOTE (GRN)
  async createGRN(grn: GRN): Promise<GRN> {
    return transaction(async (client) => {
      grn.doc_no = await getNextDocNo('GRN', client);
      grn.doc_date = new Date();
      grn.status = 'draft';

      const result = await client.query(
        `INSERT INTO grns 
         (doc_no, doc_date, status, po_id, supplier_id, challan_no, challan_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [grn.doc_no, grn.doc_date, grn.status, grn.po_id, grn.supplier_id, grn.challan_no, grn.challan_date]
      );

      const doc = result.rows[0];

      for (const item of grn.items) {
        item.amount = item.received_qty * item.rate;

        await client.query(
          `INSERT INTO grn_items (grn_id, item_id, received_qty, rate, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [doc.id, item.item_id, item.received_qty, item.rate, item.amount]
        );
      }

      return this.getGRN(doc.id);
    });
  }

  async submitGRN(id: number): Promise<GRN> {
    return transaction(async (client) => {
      await client.query(`UPDATE grns SET status = 'submitted' WHERE id = $1`, [id]);

      const grn = await this.getGRN(id);

      // Post stock entries
      for (const item of grn.items) {
        await ledger.postStock(
          {
            doc_type: 'GRN',
            doc_id: id,
            doc_no: grn.doc_no,
            doc_date: grn.doc_date,
            item_id: item.item_id,
            movement: 'in',
            qty: item.received_qty,
            rate: item.rate,
          },
          client
        );
      }

      await eventBus.emit({
        type: 'grn.submitted',
        docType: 'grn',
        docId: id,
        data: grn,
        timestamp: new Date(),
      });

      return grn;
    });
  }

  async getGRN(id: number): Promise<GRN> {
    const doc = await query(
      `SELECT g.*, p.name as supplier_name, po.doc_no as po_no 
       FROM grns g
       JOIN parties p ON p.id = g.supplier_id
       LEFT JOIN purchase_orders po ON po.id = g.po_id
       WHERE g.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT gi.*, i.code as item_code, i.name as item_name 
       FROM grn_items gi
       JOIN items i ON i.id = gi.item_id
       WHERE gi.grn_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllGRNs(): Promise<GRN[]> {
    const result = await query(
      `SELECT g.*, p.name as supplier_name FROM grns g
       JOIN parties p ON p.id = g.supplier_id ORDER BY g.doc_date DESC`
    );
    return result.rows;
  }

  // PURCHASE INVOICE
  async createPurchaseInvoice(invoice: PurchaseInvoice): Promise<PurchaseInvoice> {
    return transaction(async (client) => {
      invoice.doc_no = await getNextDocNo('PINV', client);
      invoice.doc_date = new Date();
      invoice.status = 'draft';

      // Calculate totals
      invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
      invoice.cgst = invoice.items.reduce((sum, item) => sum + item.cgst, 0);
      invoice.sgst = invoice.items.reduce((sum, item) => sum + item.sgst, 0);
      invoice.igst = invoice.items.reduce((sum, item) => sum + item.igst, 0);
      invoice.total = invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst;

      const result = await client.query(
        `INSERT INTO purchase_invoices 
         (doc_no, doc_date, status, supplier_id, grn_id, supplier_invoice_no, supplier_invoice_date, 
          subtotal, cgst, sgst, igst, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          invoice.doc_no,
          invoice.doc_date,
          invoice.status,
          invoice.supplier_id,
          invoice.grn_id,
          invoice.supplier_invoice_no,
          invoice.supplier_invoice_date,
          invoice.subtotal,
          invoice.cgst,
          invoice.sgst,
          invoice.igst,
          invoice.total,
        ]
      );

      const doc = result.rows[0];

      for (const item of invoice.items) {
        item.amount = item.qty * item.rate;
        const taxAmount = (item.amount * item.gst_rate) / 100;
        item.cgst = taxAmount / 2;
        item.sgst = taxAmount / 2;
        item.igst = 0;

        await client.query(
          `INSERT INTO purchase_invoice_items 
           (invoice_id, item_id, qty, rate, amount, gst_rate, cgst, sgst, igst)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [doc.id, item.item_id, item.qty, item.rate, item.amount, item.gst_rate, item.cgst, item.sgst, item.igst]
        );
      }

      return this.getPurchaseInvoice(doc.id);
    });
  }

  async submitPurchaseInvoice(id: number): Promise<PurchaseInvoice> {
    return transaction(async (client) => {
      await client.query(`UPDATE purchase_invoices SET status = 'submitted' WHERE id = $1`, [id]);

      const invoice = await this.getPurchaseInvoice(id);

      // Get account IDs
      const purchaseAcc = await masterService.getAccountByCode('PURCHASE');
      const gstInputAcc = await masterService.getAccountByCode('GST_INPUT');
      const creditorAcc = await masterService.getAccountByCode('CREDITORS');

      if (!purchaseAcc || !gstInputAcc || !creditorAcc) {
        throw new Error('Required accounts not found');
      }

      // Post ledger entries
      // DR Purchase Account
      await ledger.postEntry(
        {
          doc_type: 'PINV',
          doc_id: id,
          doc_no: invoice.doc_no,
          doc_date: invoice.doc_date,
          account_id: purchaseAcc.id!,
          txn_type: 'debit',
          amount: invoice.subtotal,
          party_id: invoice.supplier_id,
        },
        client
      );

      // DR GST Input
      await ledger.postEntry(
        {
          doc_type: 'PINV',
          doc_id: id,
          doc_no: invoice.doc_no,
          doc_date: invoice.doc_date,
          account_id: gstInputAcc.id!,
          txn_type: 'debit',
          amount: invoice.cgst + invoice.sgst + invoice.igst,
        },
        client
      );

      // CR Creditor (Supplier)
      await ledger.postEntry(
        {
          doc_type: 'PINV',
          doc_id: id,
          doc_no: invoice.doc_no,
          doc_date: invoice.doc_date,
          account_id: creditorAcc.id!,
          txn_type: 'credit',
          amount: invoice.total,
          party_id: invoice.supplier_id,
        },
        client
      );

      await eventBus.emit({
        type: 'purchase_invoice.submitted',
        docType: 'purchase_invoice',
        docId: id,
        data: invoice,
        timestamp: new Date(),
      });

      return invoice;
    });
  }

  async getPurchaseInvoice(id: number): Promise<PurchaseInvoice> {
    const doc = await query(
      `SELECT pi.*, p.name as supplier_name FROM purchase_invoices pi
       JOIN parties p ON p.id = pi.supplier_id WHERE pi.id = $1`,
      [id]
    );
    const items = await query(
      `SELECT pii.*, i.code as item_code, i.name as item_name 
       FROM purchase_invoice_items pii
       JOIN items i ON i.id = pii.item_id
       WHERE pii.invoice_id = $1`,
      [id]
    );
    return { ...doc.rows[0], items: items.rows };
  }

  async getAllPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    const result = await query(
      `SELECT pi.*, p.name as supplier_name FROM purchase_invoices pi
       JOIN parties p ON p.id = pi.supplier_id ORDER BY pi.doc_date DESC`
    );
    return result.rows;
  }
}

export const purchaseService = new PurchaseService();