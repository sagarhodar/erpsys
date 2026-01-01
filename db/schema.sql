-- Document series for auto-numbering
CREATE TABLE IF NOT EXISTS doc_series (
  prefix VARCHAR(10) NOT NULL,
  year VARCHAR(4) NOT NULL,
  last_no INT DEFAULT 0,
  PRIMARY KEY (prefix, year)
);

-- Master: Parties (Customers & Suppliers)
CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier', 'both')),
  gstin VARCHAR(15),
  contact VARCHAR(50),
  email VARCHAR(100),
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master: Items
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  rate DECIMAL(15,2) DEFAULT 0,
  hsn_code VARCHAR(20),
  gst_rate DECIMAL(5,2) DEFAULT 0,
  opening_stock DECIMAL(15,3) DEFAULT 0,
  current_stock DECIMAL(15,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master: Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'income', 'expense', 'equity')),
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase: Indent
CREATE TABLE IF NOT EXISTS purchase_indents (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'cancelled')),
  requested_by VARCHAR(100),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_indent_items (
  id SERIAL PRIMARY KEY,
  indent_id INT REFERENCES purchase_indents(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  qty DECIMAL(15,3) NOT NULL,
  required_date DATE NOT NULL
);

-- Purchase: Order
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  supplier_id INT REFERENCES parties(id),
  indent_id INT REFERENCES purchase_indents(id),
  delivery_date DATE NOT NULL,
  terms TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  gst_amount DECIMAL(15,2) NOT NULL
);

-- Purchase: GRN
CREATE TABLE IF NOT EXISTS grns (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  po_id INT REFERENCES purchase_orders(id),
  supplier_id INT REFERENCES parties(id),
  challan_no VARCHAR(50),
  challan_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INT REFERENCES grns(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  received_qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL
);

-- Purchase: Invoice
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  supplier_id INT REFERENCES parties(id),
  grn_id INT REFERENCES grns(id),
  supplier_invoice_no VARCHAR(50),
  supplier_invoice_date DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INT REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  cgst DECIMAL(15,2) NOT NULL,
  sgst DECIMAL(15,2) NOT NULL,
  igst DECIMAL(15,2) NOT NULL
);

-- Sales: Quotation
CREATE TABLE IF NOT EXISTS sales_quotations (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  customer_id INT REFERENCES parties(id),
  valid_till DATE NOT NULL,
  terms TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INT REFERENCES sales_quotations(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  gst_amount DECIMAL(15,2) NOT NULL
);

-- Sales: Order
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  customer_id INT REFERENCES parties(id),
  quotation_id INT REFERENCES sales_quotations(id),
  delivery_date DATE NOT NULL,
  terms TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id SERIAL PRIMARY KEY,
  so_id INT REFERENCES sales_orders(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  gst_amount DECIMAL(15,2) NOT NULL
);

-- Sales: Delivery Note
CREATE TABLE IF NOT EXISTS delivery_notes (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  so_id INT REFERENCES sales_orders(id),
  customer_id INT REFERENCES parties(id),
  vehicle_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_note_items (
  id SERIAL PRIMARY KEY,
  dc_id INT REFERENCES delivery_notes(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  delivered_qty DECIMAL(15,3) NOT NULL
);

-- Sales: Invoice
CREATE TABLE IF NOT EXISTS sales_invoices (
  id SERIAL PRIMARY KEY,
  doc_no VARCHAR(50) UNIQUE NOT NULL,
  doc_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  customer_id INT REFERENCES parties(id),
  dc_id INT REFERENCES delivery_notes(id),
  subtotal DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INT REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  cgst DECIMAL(15,2) NOT NULL,
  sgst DECIMAL(15,2) NOT NULL,
  igst DECIMAL(15,2) NOT NULL
);

-- Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  doc_type VARCHAR(50) NOT NULL,
  doc_id INT NOT NULL,
  doc_no VARCHAR(50) NOT NULL,
  doc_date DATE NOT NULL,
  account_id INT REFERENCES accounts(id),
  txn_type VARCHAR(10) CHECK (txn_type IN ('debit', 'credit')),
  amount DECIMAL(15,2) NOT NULL,
  party_id INT REFERENCES parties(id),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Ledger
CREATE TABLE IF NOT EXISTS stock_ledger (
  id SERIAL PRIMARY KEY,
  doc_type VARCHAR(50) NOT NULL,
  doc_id INT NOT NULL,
  doc_no VARCHAR(50) NOT NULL,
  doc_date DATE NOT NULL,
  item_id INT REFERENCES items(id),
  movement VARCHAR(10) CHECK (movement IN ('in', 'out')),
  qty DECIMAL(15,3) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  balance_qty DECIMAL(15,3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ledger_doc ON ledger_entries(doc_type, doc_id);
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_date ON ledger_entries(doc_date);
CREATE INDEX idx_stock_doc ON stock_ledger(doc_type, doc_id);
CREATE INDEX idx_stock_item ON stock_ledger(item_id);
CREATE INDEX idx_stock_date ON stock_ledger(doc_date);