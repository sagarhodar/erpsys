-- Seed Default Accounts (Chart of Accounts)
INSERT INTO accounts (code, name, type, balance) VALUES
('CASH', 'Cash', 'asset', 100000),
('BANK', 'Bank Account', 'asset', 500000),
('DEBTORS', 'Accounts Receivable', 'asset', 0),
('CREDITORS', 'Accounts Payable', 'liability', 0),
('STOCK', 'Stock/Inventory', 'asset', 0),
('SALES', 'Sales', 'income', 0),
('PURCHASE', 'Purchase', 'expense', 0),
('GST_INPUT', 'GST Input', 'asset', 0),
('GST_OUTPUT', 'GST Output', 'liability', 0),
('CAPITAL', 'Capital', 'equity', 600000)
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Parties
INSERT INTO parties (code, name, type, gstin, contact, email, balance) VALUES
('CUST001', 'ABC Enterprises', 'customer', '27AAAAA1234A1Z5', '9876543210', 'abc@example.com', 0),
('CUST002', 'XYZ Industries', 'customer', '27BBBBB5678B1Z5', '9876543211', 'xyz@example.com', 0),
('SUPP001', 'Reliable Suppliers Ltd', 'supplier', '27CCCCC9012C1Z5', '9876543212', 'reliable@example.com', 0),
('SUPP002', 'Quality Materials Co', 'supplier', '27DDDDD3456D1Z5', '9876543213', 'quality@example.com', 0)
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Items
INSERT INTO items (code, name, unit, rate, hsn_code, gst_rate, opening_stock, current_stock) VALUES
('ITEM001', 'Widget A', 'PCS', 100.00, '8421', 18.00, 1000, 1000),
('ITEM002', 'Widget B', 'PCS', 150.00, '8422', 18.00, 500, 500),
('ITEM003', 'Component X', 'KG', 50.00, '7308', 12.00, 2000, 2000),
('ITEM004', 'Component Y', 'MTR', 75.00, '7309', 12.00, 1500, 1500),
('ITEM005', 'Raw Material Z', 'LITRE', 200.00, '2710', 18.00, 800, 800)
ON CONFLICT (code) DO NOTHING;