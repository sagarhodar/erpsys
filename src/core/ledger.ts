import { LedgerEntry, StockLedger, TxnType, StockMovement } from '../types.js';
import { pool, transaction } from './db.js';
import pg from 'pg';

export class LedgerEngine {
  // Post financial entry
  async postEntry(entry: LedgerEntry, client: pg.PoolClient): Promise<void> {
    const q = client;
    
    await q.query(
      `INSERT INTO ledger_entries 
       (doc_type, doc_id, doc_no, doc_date, account_id, txn_type, amount, party_id, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.doc_type,
        entry.doc_id,
        entry.doc_no,
        entry.doc_date,
        entry.account_id,
        entry.txn_type,
        entry.amount,
        entry.party_id,
        entry.remarks,
      ]
    );

    // Update account balance
    const multiplier = entry.txn_type === 'debit' ? 1 : -1;
    await q.query(
      `UPDATE accounts SET balance = balance + $1 WHERE id = $2`,
      [entry.amount * multiplier, entry.account_id]
    );

    // Update party balance if applicable
    if (entry.party_id) {
      const partyMultiplier = entry.txn_type === 'debit' ? 1 : -1;
      await q.query(
        `UPDATE parties SET balance = balance + $1 WHERE id = $2`,
        [entry.amount * partyMultiplier, entry.party_id]
      );
    }
  }

  // Post double entry (DR/CR pair)
  async postDoubleEntry(
    docType: string,
    docId: number,
    docNo: string,
    docDate: Date,
    drAccount: number,
    crAccount: number,
    amount: number,
    client: pg.PoolClient,
    partyId?: number,
    remarks?: string
  ): Promise<void> {
    await this.postEntry(
      {
        doc_type: docType,
        doc_id: docId,
        doc_no: docNo,
        doc_date: docDate,
        account_id: drAccount,
        txn_type: 'debit',
        amount,
        party_id: partyId,
        remarks,
      },
      client
    );

    await this.postEntry(
      {
        doc_type: docType,
        doc_id: docId,
        doc_no: docNo,
        doc_date: docDate,
        account_id: crAccount,
        txn_type: 'credit',
        amount,
        party_id: partyId,
        remarks,
      },
      client
    );
  }

  // Post stock movement
  async postStock(entry: StockLedger, client: pg.PoolClient): Promise<void> {
    const q = client;

    // Insert stock ledger entry
    await q.query(
      `INSERT INTO stock_ledger 
       (doc_type, doc_id, doc_no, doc_date, item_id, movement, qty, rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.doc_type,
        entry.doc_id,
        entry.doc_no,
        entry.doc_date,
        entry.item_id,
        entry.movement,
        entry.qty,
        entry.rate,
      ]
    );

    // Update item stock
    const multiplier = entry.movement === 'in' ? 1 : -1;
    await q.query(
      `UPDATE items SET current_stock = current_stock + $1 WHERE id = $2`,
      [entry.qty * multiplier, entry.item_id]
    );
  }

  // Cancel document entries
  async cancelEntries(docType: string, docId: number, client: pg.PoolClient): Promise<void> {
    const q = client;

    // Reverse ledger entries
    const ledgerResult = await q.query(
      `SELECT * FROM ledger_entries WHERE doc_type = $1 AND doc_id = $2`,
      [docType, docId]
    );

    for (const entry of ledgerResult.rows) {
      const reverseTxn: TxnType = entry.txn_type === 'debit' ? 'credit' : 'debit';
      await this.postEntry(
        {
          doc_type: docType,
          doc_id: docId,
          doc_no: entry.doc_no,
          doc_date: new Date(),
          account_id: entry.account_id,
          txn_type: reverseTxn,
          amount: entry.amount,
          party_id: entry.party_id,
          remarks: `Cancelled: ${entry.doc_no}`,
        },
        q
      );
    }

    // Reverse stock entries
    const stockResult = await q.query(
      `SELECT * FROM stock_ledger WHERE doc_type = $1 AND doc_id = $2`,
      [docType, docId]
    );

    for (const entry of stockResult.rows) {
      const reverseMovement: StockMovement = entry.movement === 'in' ? 'out' : 'in';
      await this.postStock(
        {
          doc_type: docType,
          doc_id: docId,
          doc_no: entry.doc_no,
          doc_date: new Date(),
          item_id: entry.item_id,
          movement: reverseMovement,
          qty: entry.qty,
          rate: entry.rate,
        },
        q
      );
    }
  }

  // Get account balance
  async getAccountBalance(accountId: number): Promise<number> {
    const result = await pool.query(`SELECT balance FROM accounts WHERE id = $1`, [accountId]);
    return result.rows[0]?.balance || 0;
  }

  // Get party balance
  async getPartyBalance(partyId: number): Promise<number> {
    const result = await pool.query(`SELECT balance FROM parties WHERE id = $1`, [partyId]);
    return result.rows[0]?.balance || 0;
  }

  // Get item stock
  async getItemStock(itemId: number): Promise<number> {
    const result = await pool.query(`SELECT current_stock FROM items WHERE id = $1`, [itemId]);
    return result.rows[0]?.current_stock || 0;
  }
}

export const ledger = new LedgerEngine();