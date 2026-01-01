# 🚀 Quick Start Guide

## Prerequisites Check
```bash
node --version  # Should be v18+
psql --version  # Should be v14+
```

## 5-Minute Setup

### 1. Database Setup (2 minutes)

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE erp_db;

# Exit
\q
```

### 2. Configure Environment (1 minute)

Create `.env` file:
```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 3. Install & Initialize (2 minutes)

```bash
# Install dependencies
npm install

# Initialize database (creates tables + sample data)
npm run db:init

# Start server
npm run dev
```

### 4. Open Application

Visit: **http://localhost:3000**

---

## 🎯 First Steps in the Application

### 1. View Sample Data
- Click **Masters** → See pre-loaded parties and items
- Check **Inventory** → See item stock levels

### 2. Create Your First Purchase Order

1. Click **Purchase** tab
2. Click **New Purchase Order**
3. Fill form:
   - Select Supplier: "Reliable Suppliers Ltd"
   - Set Delivery Date
   - Click **+ Add Item**
   - Select Item: "Widget A"
   - Enter Quantity: 100
   - Rate will auto-fill
   - Click **Save**
4. In the table, click **Submit** to finalize

### 3. Receive Materials (GRN)

1. Click **New GRN**
2. Select same supplier
3. Add items with received quantities
4. Click **Save** then **Submit**
5. **✅ Stock automatically increases!**

### 4. Book Purchase Invoice

1. Click **New Purchase Invoice**
2. Select supplier and enter their invoice details
3. Add items
4. Click **Save** then **Submit**
5. **✅ Ledger entries automatically posted!**

### 5. Create Sales Order

1. Click **Sales** tab
2. Click **New Sales Order**
3. Select Customer: "ABC Enterprises"
4. Add items (system validates stock)
5. Save and Submit

### 6. Deliver Goods

1. Click **New Delivery**
2. Select customer
3. Add delivered items
4. Submit
5. **✅ Stock automatically decreases!**

### 7. Generate Sales Invoice

1. Click **New Sales Invoice**
2. Select customer
3. Add items with rates
4. Submit
5. **✅ Revenue recognized, debtor balance updated!**

### 8. View Reports

1. Click **Reports** tab
2. **Ledger Report**: Select "Debtors" account → View customer balances
3. **Stock Report**: Select any item → View stock movements
4. **Party Ledger**: Select party → View all transactions

---

## 🎨 Understanding the UI

### Color Coding
- 🔵 **Blue buttons**: Create new documents
- 🟢 **Green buttons**: Submit/finalize actions
- 🟡 **Yellow badge**: Draft status
- 🟢 **Green badge**: Submitted status

### Document Flow
```
PURCHASE: PO → GRN (stock↑) → Invoice (ledger posted)
SALES: SO → Delivery (stock↓) → Invoice (ledger posted)
```

### Key Concepts
- **Draft**: Editable, no accounting impact
- **Submitted**: Final, posts to stock/ledger, read-only
- **Auto-calculations**: GST, totals, balances all automatic

---

## 📝 Sample Workflow: Complete Purchase Cycle

```bash
# Step 1: Create PO for 100 widgets @ ₹100
- Subtotal: ₹10,000
- GST (18%): ₹1,800
- Total: ₹11,800

# Step 2: Receive 100 widgets via GRN
- Stock increases by 100 units
- Stock ledger entry created

# Step 3: Book supplier invoice for ₹11,800
- DR Purchase: ₹10,000
- DR GST Input: ₹1,800
- CR Creditor: ₹11,800
- Supplier balance: ₹11,800 (you owe them)
```

## 📊 Sample Workflow: Complete Sales Cycle

```bash
# Step 1: Create SO for 50 widgets @ ₹150
- System validates: 100 units available ✓
- Subtotal: ₹7,500
- GST (18%): ₹1,350
- Total: ₹8,850

# Step 2: Deliver 50 widgets
- Stock decreases by 50 units
- Remaining: 50 units

# Step 3: Generate invoice for ₹8,850
- DR Debtor: ₹8,850
- CR Sales: ₹7,500
- CR GST Output: ₹1,350
- Customer balance: ₹8,850 (they owe you)
```

---

## 🔍 Verification Points

After completing above workflows, verify:

1. **Stock Balance**:
   - Started: 1,000 units
   - Purchased: +100 units
   - Sold: -50 units
   - **Final: 1,050 units** ✓

2. **Supplier Balance**:
   - Invoice: ₹11,800 (credit)
   - **You owe: ₹11,800** ✓

3. **Customer Balance**:
   - Invoice: ₹8,850 (debit)
   - **They owe you: ₹8,850** ✓

4. **Accounts**:
   - Purchase account: +₹10,000
   - Sales account: +₹7,500
   - GST Input: +₹1,800
   - GST Output: +₹1,350
   - Net GST: ₹1,800 - ₹1,350 = ₹450 (to claim)

---

## 🛠️ Common Tasks

### Add New Party
Masters → Add Party → Fill details → Save

### Add New Item
Masters → Add Item → Fill details (including opening stock) → Save

### View Party Balance
Reports → Party Ledger → Select party → View

### Check Item Stock
Inventory → View current stock table
or
Reports → Stock Report → Select item → View movements

### View Account Balance
Reports → Ledger Report → Select account → View transactions

---

## ⚡ Pro Tips

1. **Always submit GRN before invoice** - Stock should be received first
2. **Submit SO before delivery** - Validates stock availability
3. **Use Draft status** to save work in progress
4. **Check reports regularly** to verify balances
5. **GST calculations are automatic** - Just enter rates per item

---

## 🆘 Troubleshooting

### "Insufficient stock" error
- Check Inventory tab for current stock
- Ensure GRN is submitted (not just saved)

### Ledger not updating
- Ensure document is **Submitted** (not Draft)
- Only submitted documents post to ledger

### Cannot connect to database
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify .env credentials
cat .env
```

### Port 3000 already in use
```bash
# Change port in .env
PORT=3001

# Or kill process using port
lsof -ti:3000 | xargs kill
```

---

## 📚 Next Steps

1. ✅ Complete the sample workflows above
2. 📖 Read full [README.md](README.md) for architecture details
3. 🎨 Customize for your business needs
4. 📊 Add more accounts, parties, items
5. 🚀 Deploy to production

---

**Need Help?** Check the main README.md for detailed API documentation and architecture explanation.

**Happy ERP-ing! 🎉**