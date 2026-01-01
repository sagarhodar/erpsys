import { Party, Item, Account } from '../types.js';
import { pool, query } from '../core/db.js';

export class MasterService {
  // PARTY MANAGEMENT
  async createParty(party: Party): Promise<Party> {
    const result = await query(
      `INSERT INTO parties (code, name, type, gstin, contact, email, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [party.code, party.name, party.type, party.gstin, party.contact, party.email, 0]
    );
    return result.rows[0];
  }

  async updateParty(id: number, party: Partial<Party>): Promise<Party> {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(party)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    values.push(id);
    const result = await query(
      `UPDATE parties SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async getParty(id: number): Promise<Party | null> {
    const result = await query(`SELECT * FROM parties WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getAllParties(type?: string): Promise<Party[]> {
    if (type) {
      const result = await query(`SELECT * FROM parties WHERE type = $1 OR type = 'both' ORDER BY name`, [type]);
      return result.rows;
    }
    const result = await query(`SELECT * FROM parties ORDER BY name`);
    return result.rows;
  }

  async deleteParty(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM parties WHERE id = $1`, [id]);
    return (result.rowCount || 0) > 0;
  }

  // ITEM MANAGEMENT
  async createItem(item: Item): Promise<Item> {
    const result = await query(
      `INSERT INTO items (code, name, unit, rate, hsn_code, gst_rate, opening_stock, current_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING *`,
      [item.code, item.name, item.unit, item.rate, item.hsn_code, item.gst_rate, item.opening_stock]
    );
    return result.rows[0];
  }

  async updateItem(id: number, item: Partial<Item>): Promise<Item> {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(item)) {
      if (key !== 'id' && key !== 'current_stock' && value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    values.push(id);
    const result = await query(
      `UPDATE items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async getItem(id: number): Promise<Item | null> {
    const result = await query(`SELECT * FROM items WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getAllItems(): Promise<Item[]> {
    const result = await query(`SELECT * FROM items ORDER BY name`);
    return result.rows;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM items WHERE id = $1`, [id]);
    return (result.rowCount || 0) > 0;
  }

  // ACCOUNT MANAGEMENT
  async createAccount(account: Account): Promise<Account> {
    const result = await query(
      `INSERT INTO accounts (code, name, type, balance)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [account.code, account.name, account.type, account.balance || 0]
    );
    return result.rows[0];
  }

  async getAccount(id: number): Promise<Account | null> {
    const result = await query(`SELECT * FROM accounts WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getAllAccounts(type?: string): Promise<Account[]> {
    if (type) {
      const result = await query(`SELECT * FROM accounts WHERE type = $1 ORDER BY name`, [type]);
      return result.rows;
    }
    const result = await query(`SELECT * FROM accounts ORDER BY name`);
    return result.rows;
  }

  async getAccountByCode(code: string): Promise<Account | null> {
    const result = await query(`SELECT * FROM accounts WHERE code = $1`, [code]);
    return result.rows[0] || null;
  }
}

export const masterService = new MasterService();