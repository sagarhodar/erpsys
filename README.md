# 📊 ERP System - Complete Implementation

A production-ready ERP system with proper workflow implementation for Purchase, Sales, Inventory, and Finance management.

## 🎯 Features

### Complete ERP Workflows
- **Purchase Cycle**: Indent → PO → GRN → Invoice
- **Sales Cycle**: Quotation → SO → Delivery → Invoice
- **Inventory Management**: Real-time stock tracking with ledger
- **Finance Management**: Double-entry bookkeeping with automatic postings
- **Master Data**: Party, Item, and Account management

### Technical Features
- Event-driven architecture for workflow automation
- Transaction safety with PostgreSQL
- Automatic document numbering
- GST calculations (CGST/SGST/IGST)
- Stock movement tracking
- Ledger automation
- Party balance tracking

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

### Step 2: Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE erp_db;
```

2. Update `.env` file with your database credentials:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_db
DB_USER=postgres
DB_PASSWORD=your_password
```

3. Initialize database:
```bash
npm run db:init
```

This will:
- Create all tables
- Insert default accounts (Chart of Accounts)
- Insert sample parties and items

### Step 3: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
erp-system/
├── src/
│   ├── index.ts              # Main server
│   ├── types.ts              # TypeScript interfaces
│   │
│   ├── core/                 # Core ERP engine
│   │   ├── db.ts             # Database connection & transactions
│   │   ├── ledger.ts         # Ledger engine (single source of truth)
│   │   └── event.ts          # Event bus for workflow automation
│   │
│   ├── modules/              # Business logic modules
│   │   ├── master.ts         # Party, Item, Account management
│   │   ├── purchase.ts       # Purchase workflow
│   │   └── sales.ts          # Sales workflow
│   │
│   └── api/
│       └── routes.ts         # HTTP API endpoints
│
├── db/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Initial data
│
├── scripts/
│   └── init-db.ts            # Database initialization
│
└── public/                   # Frontend application
    ├── index.html
    └── app.js
```

## 🔄 ERP Workflows

### Purchase Workflow

1. **Purchase Indent (Optional)**
   - Request for materials
   - Status: Draft → Submitted

2. **Purchase Order (PO)**
   - Create PO with items, quantities, rates
   - Calculate GST automatically
   - Status: Draft → Submitted

3. **Goods Receipt Note (GRN)**
   - Record received materials
   - **Posts stock entries automatically**
   - Updates inventory in real-time
   - Status: Draft → Submitted

4. **Purchase Invoice**
   - Record supplier invoice
   - **Posts ledger entries automatically**:
     - DR Purchase Account
     - DR GST Input
     - CR Creditors (Supplier)
   - Updates party balance
   - Status: Draft → Submitted

### Sales Workflow

1. **Sales Quotation (Optional)**
   - Provide quote to customer
   - Calculate totals with GST
   - Status: Draft → Submitted

2. **Sales Order (SO)**
   - Confirm order from customer
   - **Validates stock availability**
   - Status: Draft → Submitted

3. **Delivery Note (DC)**
   - Record materials delivered
   - **Posts stock entries automatically**
   - Reduces inventory
   - Status: Draft → Submitted

4. **Sales Invoice**
   - Bill the customer
   - **Posts ledger entries automatically**:
     - DR Debtors (Customer)
     - CR Sales Account
     - CR GST Output
   - Updates party balance
   - Status: Draft → Submitted

## 💼 API Endpoints

### Master Data
- `POST /api/parties` - Create party
- `GET /api/parties` - List all parties
- `GET /api/parties/:id` - Get party details
- `POST /api/items` - Create item
- `GET /api/items` - List all items
- `GET /api/accounts` - List all accounts

### Purchase
- `POST /api/purchase/orders` - Create PO
- `POST /api/purchase/orders/:id/submit` - Submit PO
- `GET /api/purchase/orders` - List POs
- `POST /api/purchase/grns` - Create GRN
- `POST /api/purchase/grns/:id/submit` - Submit GRN (posts stock)
- `POST /api/purchase/invoices` - Create invoice
- `POST /api/purchase/invoices/:id/submit` - Submit invoice (posts ledger)

### Sales
- `POST /api/sales/quotations` - Create quotation
- `POST /api/sales/orders` - Create SO
- `POST /api/sales/orders/:id/submit` - Submit SO (validates stock)
- `POST /api/sales/delivery-notes` - Create DC
- `POST /api/sales/delivery-notes/:id/submit` - Submit DC (posts stock)
- `POST /api/sales/invoices` - Create invoice
- `POST /api/sales/invoices/:id/submit` - Submit invoice (posts ledger)

### Reports
- `GET /api/reports/ledger/:accountId` - Account ledger
- `GET /api/reports/stock/:itemId` - Stock ledger
- `GET /api/reports/party-ledger/:partyId` - Party ledger

## 🎨 UI Features

- **Dashboard**: Quick summary and actions
- **Masters**: Manage parties, items, accounts
- **Purchase**: Complete purchase cycle management
- **Sales**: Complete sales cycle management
- **Inventory**: Real-time stock viewing
- **Reports**: Ledger and stock reports

## 🔐 Core Business Rules

### Ledger Posting Rules
1. Purchase Invoice posts:
   - Debit: Purchase + GST Input
   - Credit: Creditors (increases liability)

2. Sales Invoice posts:
   - Debit: Debtors (increases receivable)
   - Credit: Sales + GST Output

3. All postings are atomic (transaction-safe)

### Stock Management Rules
1. GRN increases stock (IN movement)
2. Delivery decreases stock (OUT movement)
3. Sales Order validates stock availability
4. All stock movements tracked in stock ledger

### Document Status Flow
- **Draft**: Editable, no impact on ledger/stock
- **Submitted**: Final, posts to ledger/stock, cannot edit
- **Cancelled**: Reverses all entries (future feature)

## 🛠️ Customization

### Adding New Accounts
Edit `db/seed.sql` to add accounts to your Chart of Accounts:

```sql
INSERT INTO accounts (code, name, type, balance) VALUES
('YOUR_CODE', 'Account Name', 'asset', 0);
```

### Adding Custom Workflow
1. Create event handlers in modules
2. Use `eventBus.on()` to listen for events
3. Post ledger/stock entries in event handlers

### GST Configuration
GST rates are configurable per item in the Items master. Current implementation supports:
- CGST + SGST (intra-state)
- IGST (inter-state) - placeholder

## 📊 Sample Data

The system comes with:
- **10 Accounts**: Cash, Bank, Debtors, Creditors, Stock, Sales, Purchase, GST Input/Output, Capital
- **4 Sample Parties**: 2 Customers, 2 Suppliers
- **5 Sample Items**: Various products with HSN codes and GST rates

## 🔍 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check firewall settings

### Port Already in Use
Change port in `.env`:
```env
PORT=3001
```

### Module Not Found Errors
Ensure you're using ES modules:
```json
{
  "type": "module"
}
```

## 📈 Future Enhancements

- Payment management (receipts/payments)
- Bank reconciliation
- Advanced reports (P&L, Balance Sheet)
- Multi-company support
- Role-based access control
- Document cancellation workflow
- Stock adjustments
- Batch/serial number tracking
- PDF generation for documents

## 🤝 Contributing

This is a production-ready foundation. Feel free to extend based on your business requirements.

## 📝 License

MIT License - Free to use and modify

## 💡 Architecture Principles

1. **Separation of Concerns**: Business logic in modules, API is thin
2. **Single Source of Truth**: Ledger engine handles all financial postings
3. **Event-Driven**: Workflows trigger via events for extensibility
4. **Transaction Safety**: Database transactions ensure data consistency
5. **Minimal Dependencies**: Core ERP doesn't depend on heavy frameworks

---

**Built with**: TypeScript, PostgreSQL, Express, Vanilla JavaScript

**Production-Ready**: Proper error handling, transactions, validation