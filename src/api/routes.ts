import express from 'express';
import { masterService } from '../modules/master.js';
import { purchaseService } from '../modules/purchase.js';
import { salesService } from '../modules/sales.js';
import { query } from '../core/db.js';

const router = express.Router();

// MASTER APIS
router.post('/parties', async (req, res) => {
  try {
    const party = await masterService.createParty(req.body);
    res.json(party);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/parties', async (req, res) => {
  try {
    const parties = await masterService.getAllParties(req.query.type as string);
    res.json(parties);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/parties/:id', async (req, res) => {
  try {
    const party = await masterService.getParty(parseInt(req.params.id));
    res.json(party);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/parties/:id', async (req, res) => {
  try {
    const party = await masterService.updateParty(parseInt(req.params.id), req.body);
    res.json(party);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const item = await masterService.createItem(req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/items', async (req, res) => {
  try {
    const items = await masterService.getAllItems();
    res.json(items);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/items/:id', async (req, res) => {
  try {
    const item = await masterService.getItem(parseInt(req.params.id));
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    const accounts = await masterService.getAllAccounts(req.query.type as string);
    res.json(accounts);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PURCHASE APIS
router.post('/purchase/indents', async (req, res) => {
  try {
    const indent = await purchaseService.createIndent(req.body);
    res.json(indent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/indents/:id/submit', async (req, res) => {
  try {
    const indent = await purchaseService.submitIndent(parseInt(req.params.id));
    res.json(indent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/purchase/indents', async (req, res) => {
  try {
    const indents = await purchaseService.getAllIndents();
    res.json(indents);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/orders', async (req, res) => {
  try {
    const po = await purchaseService.createPO(req.body);
    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/orders/:id/submit', async (req, res) => {
  try {
    const po = await purchaseService.submitPO(parseInt(req.params.id));
    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/purchase/orders', async (req, res) => {
  try {
    const pos = await purchaseService.getAllPOs();
    res.json(pos);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/grns', async (req, res) => {
  try {
    const grn = await purchaseService.createGRN(req.body);
    res.json(grn);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/grns/:id/submit', async (req, res) => {
  try {
    const grn = await purchaseService.submitGRN(parseInt(req.params.id));
    res.json(grn);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/purchase/grns', async (req, res) => {
  try {
    const grns = await purchaseService.getAllGRNs();
    res.json(grns);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/invoices', async (req, res) => {
  try {
    const invoice = await purchaseService.createPurchaseInvoice(req.body);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/purchase/invoices/:id/submit', async (req, res) => {
  try {
    const invoice = await purchaseService.submitPurchaseInvoice(parseInt(req.params.id));
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/purchase/invoices', async (req, res) => {
  try {
    const invoices = await purchaseService.getAllPurchaseInvoices();
    res.json(invoices);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// SALES APIS
router.post('/sales/quotations', async (req, res) => {
  try {
    const quot = await salesService.createQuotation(req.body);
    res.json(quot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/quotations/:id/submit', async (req, res) => {
  try {
    const quot = await salesService.submitQuotation(parseInt(req.params.id));
    res.json(quot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sales/quotations', async (req, res) => {
  try {
    const quots = await salesService.getAllQuotations();
    res.json(quots);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/orders', async (req, res) => {
  try {
    const so = await salesService.createSO(req.body);
    res.json(so);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/orders/:id/submit', async (req, res) => {
  try {
    const so = await salesService.submitSO(parseInt(req.params.id));
    res.json(so);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sales/orders', async (req, res) => {
  try {
    const sos = await salesService.getAllSOs();
    res.json(sos);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/delivery-notes', async (req, res) => {
  try {
    const dc = await salesService.createDC(req.body);
    res.json(dc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/delivery-notes/:id/submit', async (req, res) => {
  try {
    const dc = await salesService.submitDC(parseInt(req.params.id));
    res.json(dc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sales/delivery-notes', async (req, res) => {
  try {
    const dcs = await salesService.getAllDCs();
    res.json(dcs);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/invoices', async (req, res) => {
  try {
    const invoice = await salesService.createSalesInvoice(req.body);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/invoices/:id/submit', async (req, res) => {
  try {
    const invoice = await salesService.submitSalesInvoice(parseInt(req.params.id));
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sales/invoices', async (req, res) => {
  try {
    const invoices = await salesService.getAllSalesInvoices();
    res.json(invoices);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// REPORTS
router.get('/reports/ledger/:accountId', async (req, res) => {
  try {
    const result = await query(
      `SELECT le.*, a.name as account_name, p.name as party_name 
       FROM ledger_entries le
       JOIN accounts a ON a.id = le.account_id
       LEFT JOIN parties p ON p.id = le.party_id
       WHERE le.account_id = $1
       ORDER BY le.doc_date, le.created_at`,
      [req.params.accountId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reports/stock/:itemId', async (req, res) => {
  try {
    const result = await query(
      `SELECT sl.*, i.name as item_name, i.code as item_code
       FROM stock_ledger sl
       JOIN items i ON i.id = sl.item_id
       WHERE sl.item_id = $1
       ORDER BY sl.doc_date, sl.created_at`,
      [req.params.itemId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reports/party-ledger/:partyId', async (req, res) => {
  try {
    const result = await query(
      `SELECT le.*, a.name as account_name
       FROM ledger_entries le
       JOIN accounts a ON a.id = le.account_id
       WHERE le.party_id = $1
       ORDER BY le.doc_date, le.created_at`,
      [req.params.partyId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;