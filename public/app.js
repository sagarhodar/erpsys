const API_BASE = '/api';

class ERPApp {
  constructor() {
    this.parties = [];
    this.items = [];
    this.accounts = [];
    this.currentSection = 'dashboard';
    this.init();
  }

  async init() {
    this.setupNavigation();
    await this.loadMasterData();
    this.loadDashboard();
  }

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const section = e.target.dataset.section;
        document.getElementById(section).classList.add('active');
        this.currentSection = section;
        this.loadSection(section);
      });
    });
  }

  async loadMasterData() {
    try {
      this.parties = await this.api('GET', '/parties');
      this.items = await this.api('GET', '/items');
      this.accounts = await this.api('GET', '/accounts');
    } catch (err) {
      this.showError('Failed to load master data: ' + err.message);
    }
  }

  async loadSection(section) {
    switch(section) {
      case 'dashboard': await this.loadDashboard(); break;
      case 'master': await this.loadMasters(); break;
      case 'purchase': await this.loadPurchase(); break;
      case 'sales': await this.loadSales(); break;
      case 'inventory': await this.loadInventory(); break;
      case 'reports': await this.loadReports(); break;
    }
  }

  async loadDashboard() {
    try {
      const [pos, sos, dcs] = await Promise.all([
        this.api('GET', '/purchase/orders'),
        this.api('GET', '/sales/orders'),
        this.api('GET', '/sales/delivery-notes')
      ]);
      document.getElementById('dash-po').textContent = pos.length;
      document.getElementById('dash-so').textContent = sos.length;
      document.getElementById('dash-dc').textContent = dcs.length;
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }

  async loadMasters() {
    await this.loadMasterData();
    this.renderTable('partiesTable', this.parties, [
      'code', 'name', 'type', 'gstin', 
      { key: 'balance', format: v => '₹' + v.toFixed(2) }
    ], []);
    this.renderTable('itemsTable', this.items, [
      'code', 'name', 'unit', 
      { key: 'rate', format: v => '₹' + v.toFixed(2) },
      { key: 'gst_rate', format: v => v + '%' },
      { key: 'current_stock', format: v => v.toFixed(2) }
    ], []);
  }

  async loadPurchase() {
    try {
      const [pos, grns, pinvs] = await Promise.all([
        this.api('GET', '/purchase/orders'),
        this.api('GET', '/purchase/grns'),
        this.api('GET', '/purchase/invoices')
      ]);

      this.renderTable('poTable', pos, [
        'doc_no',
        { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
        'supplier_name',
        { key: 'total', format: v => '₹' + v.toFixed(2) },
        { key: 'status', format: v => `<span class="badge badge-${v}">${v}</span>` }
      ], [
        { label: 'Submit', action: (item) => this.submitDocument('po', item.id), condition: (item) => item.status === 'draft' }
      ]);

      this.renderTable('grnTable', grns, [
        'doc_no',
        { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
        'po_no',
        'supplier_name',
        { key: 'status', format: v => `<span class="badge badge-${v}">${v}</span>` }
      ], [
        { label: 'Submit', action: (item) => this.submitDocument('grn', item.id), condition: (item) => item.status === 'draft' }
      ]);

      this.renderTable('pinvTable', pinvs, [
        'doc_no',
        { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
        'supplier_name',
        { key: 'total', format: v => '₹' + v.toFixed(2) },
        { key: 'status', format: v => `<span class="badge badge-${v}">${v}</span>` }
      ], [
        { label: 'Submit', action: (item) => this.submitDocument('purchaseInvoice', item.id), condition: (item) => item.status === 'draft' }
      ]);
    } catch (err) {
      this.showError('Failed to load purchase data: ' + err.message);
    }
  }

  async loadSales() {
    try {
      const [sos, dcs, sinvs] = await Promise.all([
        this.api('GET', '/sales/orders'),
        this.api('GET', '/sales/delivery-notes'),
        this.api('GET', '/sales/invoices')
      ]);

      this.renderTable('soTable', sos, [
        'doc_no',
        { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
        'customer_name',
        { key: 'total', format: v => '₹' + v.toFixed(2) },
        { key: 'status', format: v => `<span class="badge badge-${v}">${v}</span>` }
      ], [
        { label: 'Submit', action: (item) => this.submitDocument('so', item.id), condition: (item) => item.status === 'draft' }
      ]);

      this.renderTable('dcTable', dcs, [
        'doc_no',
        { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
        'so_no',
        'customer_name',
        { key: 'status', format: v => `<span class="badge badge-${v}">${v}</span>` }
      ], [
        { label: 'Submit', action: (item) => this.submitDocument('dc', item.id), condition: (item) => item.status === 'draft' }
      ]);

      this.renderTable('sinvTable', sinvs, [
        'doc_no',
        { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
        'customer_name',
        { key: 'total', format: v => '₹' + v.toFixed(2) },
        { key: 'status', format: v => `<span class="badge badge-${v}">${v}</span>` }
      ], [
        { label: 'Submit', action: (item) => this.submitDocument('salesInvoice', item.id), condition: (item) => item.status === 'draft' }
      ]);
    } catch (err) {
      this.showError('Failed to load sales data: ' + err.message);
    }
  }

  async loadInventory() {
    await this.loadMasterData();
    this.renderTable('stockTable', this.items, [
      'code', 'name', 'unit',
      { key: 'current_stock', format: v => v.toFixed(2) },
      { key: 'rate', format: v => '₹' + v.toFixed(2) },
      { key: 'value', format: (v, item) => '₹' + (item.current_stock * item.rate).toFixed(2) }
    ], []);
  }

  async loadReports() {
    const accSelect = document.getElementById('reportAccountId');
    const itemSelect = document.getElementById('reportItemId');
    const partySelect = document.getElementById('reportPartyId');

    accSelect.innerHTML = '<option value="">Select Account</option>';
    this.accounts.forEach(acc => {
      accSelect.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
    });

    itemSelect.innerHTML = '<option value="">Select Item</option>';
    this.items.forEach(item => {
      itemSelect.innerHTML += `<option value="${item.id}">${item.code} - ${item.name}</option>`;
    });

    partySelect.innerHTML = '<option value="">Select Party</option>';
    this.parties.forEach(party => {
      partySelect.innerHTML += `<option value="${party.id}">${party.code} - ${party.name}</option>`;
    });
  }

  renderTable(tableId, data, columns, actions) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="100" style="text-align:center; padding:40px; color:#95a5a6;">No data available</td></tr>';
      return;
    }

    data.forEach(item => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        if (typeof col === 'string') {
          td.textContent = item[col] || '-';
        } else {
          if (col.format) {
            const val = col.format(item[col.key], item);
            if (typeof val === 'string' && val.includes('<')) {
              td.innerHTML = val;
            } else {
              td.textContent = val;
            }
          } else {
            td.textContent = item[col.key] || '-';
          }
        }
        tr.appendChild(td);
      });

      if (actions && actions.length > 0) {
        const td = document.createElement('td');
        actions.forEach(action => {
          if (!action.condition || action.condition(item)) {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.className = 'btn-primary';
            btn.style.marginRight = '5px';
            btn.onclick = () => action.action(item);
            td.appendChild(btn);
          }
        });
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });
  }

  showForm(formType) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    const forms = {
      party: this.getPartyForm(),
      item: this.getItemForm(),
      purchaseOrder: this.getPurchaseOrderForm(),
      grn: this.getGRNForm(),
      purchaseInvoice: this.getPurchaseInvoiceForm(),
      salesQuotation: this.getSalesQuotationForm(),
      salesOrder: this.getSalesOrderForm(),
      deliveryNote: this.getDeliveryNoteForm(),
      salesInvoice: this.getSalesInvoiceForm()
    };

    title.textContent = formType.replace(/([A-Z])/g, ' $1').trim();
    content.innerHTML = forms[formType] || '<p>Form not found</p>';
    modal.style.display = 'block';

    // Initialize item rows for document forms
    if (['purchaseOrder', 'grn', 'purchaseInvoice', 'salesQuotation', 'salesOrder', 'deliveryNote', 'salesInvoice'].includes(formType)) {
      this.addItemRow(formType);
    }
  }

  closeModal() {
    document.getElementById('modal').style.display = 'none';
  }

  getPartyForm() {
    return `
      <form onsubmit="app.saveParty(event)">
        <div class="form-grid">
          <div><label>Code*</label><input name="code" required></div>
          <div><label>Name*</label><input name="name" required></div>
          <div><label>Type*</label><select name="type" required>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="both">Both</option>
          </select></div>
          <div><label>GSTIN</label><input name="gstin"></div>
          <div><label>Contact</label><input name="contact"></div>
          <div><label>Email</label><input name="email" type="email"></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getItemForm() {
    return `
      <form onsubmit="app.saveItem(event)">
        <div class="form-grid">
          <div><label>Code*</label><input name="code" required></div>
          <div><label>Name*</label><input name="name" required></div>
          <div><label>Unit*</label><input name="unit" required placeholder="PCS, KG, MTR"></div>
          <div><label>Rate*</label><input name="rate" type="number" step="0.01" required></div>
          <div><label>HSN Code</label><input name="hsn_code"></div>
          <div><label>GST Rate (%)*</label><input name="gst_rate" type="number" step="0.01" required value="18"></div>
          <div><label>Opening Stock*</label><input name="opening_stock" type="number" step="0.001" required value="0"></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getPurchaseOrderForm() {
    const suppliers = this.parties.filter(p => p.type === 'supplier' || p.type === 'both');
    return `
      <form onsubmit="app.savePurchaseOrder(event)">
        <div class="form-grid">
          <div><label>Supplier*</label><select name="supplier_id" required>
            <option value="">Select Supplier</option>
            ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select></div>
          <div><label>Delivery Date*</label><input name="delivery_date" type="date" required></div>
          <div style="grid-column: 1/-1"><label>Terms</label><textarea name="terms"></textarea></div>
        </div>
        <div class="items-section">
          <h3>Items</h3>
          <div id="poItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('purchaseOrder')">+ Add Item</button>
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span id="poSubtotal">₹0.00</span></div>
          <div class="total-row"><span>Tax:</span><span id="poTax">₹0.00</span></div>
          <div class="total-row grand"><span>Total:</span><span id="poTotal">₹0.00</span></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getGRNForm() {
    const suppliers = this.parties.filter(p => p.type === 'supplier' || p.type === 'both');
    return `
      <form onsubmit="app.saveGRN(event)">
        <div class="form-grid">
          <div><label>Supplier*</label><select name="supplier_id" required>
            <option value="">Select Supplier</option>
            ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select></div>
          <div><label>Challan No</label><input name="challan_no"></div>
          <div><label>Challan Date</label><input name="challan_date" type="date"></div>
        </div>
        <div class="items-section">
          <h3>Items Received</h3>
          <div id="grnItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('grn')">+ Add Item</button>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getPurchaseInvoiceForm() {
    const suppliers = this.parties.filter(p => p.type === 'supplier' || p.type === 'both');
    return `
      <form onsubmit="app.savePurchaseInvoice(event)">
        <div class="form-grid">
          <div><label>Supplier*</label><select name="supplier_id" required>
            <option value="">Select Supplier</option>
            ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select></div>
          <div><label>Supplier Invoice No*</label><input name="supplier_invoice_no" required></div>
          <div><label>Supplier Invoice Date*</label><input name="supplier_invoice_date" type="date" required></div>
        </div>
        <div class="items-section">
          <h3>Items</h3>
          <div id="purchaseInvoiceItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('purchaseInvoice')">+ Add Item</button>
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span id="pinvSubtotal">₹0.00</span></div>
          <div class="total-row"><span>CGST:</span><span id="pinvCGST">₹0.00</span></div>
          <div class="total-row"><span>SGST:</span><span id="pinvSGST">₹0.00</span></div>
          <div class="total-row grand"><span>Total:</span><span id="pinvTotal">₹0.00</span></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getSalesQuotationForm() {
    const customers = this.parties.filter(p => p.type === 'customer' || p.type === 'both');
    return `
      <form onsubmit="app.saveSalesQuotation(event)">
        <div class="form-grid">
          <div><label>Customer*</label><select name="customer_id" required>
            <option value="">Select Customer</option>
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select></div>
          <div><label>Valid Till*</label><input name="valid_till" type="date" required></div>
          <div style="grid-column: 1/-1"><label>Terms</label><textarea name="terms"></textarea></div>
        </div>
        <div class="items-section">
          <h3>Items</h3>
          <div id="salesQuotationItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('salesQuotation')">+ Add Item</button>
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span id="sqSubtotal">₹0.00</span></div>
          <div class="total-row"><span>Tax:</span><span id="sqTax">₹0.00</span></div>
          <div class="total-row grand"><span>Total:</span><span id="sqTotal">₹0.00</span></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getSalesOrderForm() {
    const customers = this.parties.filter(p => p.type === 'customer' || p.type === 'both');
    return `
      <form onsubmit="app.saveSalesOrder(event)">
        <div class="form-grid">
          <div><label>Customer*</label><select name="customer_id" required>
            <option value="">Select Customer</option>
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select></div>
          <div><label>Delivery Date*</label><input name="delivery_date" type="date" required></div>
          <div style="grid-column: 1/-1"><label>Terms</label><textarea name="terms"></textarea></div>
        </div>
        <div class="items-section">
          <h3>Items</h3>
          <div id="salesOrderItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('salesOrder')">+ Add Item</button>
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span id="soSubtotal">₹0.00</span></div>
          <div class="total-row"><span>Tax:</span><span id="soTax">₹0.00</span></div>
          <div class="total-row grand"><span>Total:</span><span id="soTotal">₹0.00</span></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getDeliveryNoteForm() {
    const customers = this.parties.filter(p => p.type === 'customer' || p.type === 'both');
    return `
      <form onsubmit="app.saveDeliveryNote(event)">
        <div class="form-grid">
          <div><label>Customer*</label><select name="customer_id" required>
            <option value="">Select Customer</option>
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select></div>
          <div><label>Vehicle No</label><input name="vehicle_no"></div>
        </div>
        <div class="items-section">
          <h3>Items Delivered</h3>
          <div id="deliveryNoteItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('deliveryNote')">+ Add Item</button>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  getSalesInvoiceForm() {
    const customers = this.parties.filter(p => p.type === 'customer' || p.type === 'both');
    return `
      <form onsubmit="app.saveSalesInvoice(event)">
        <div class="form-grid">
          <div><label>Customer*</label><select name="customer_id" required>
            <option value="">Select Customer</option>
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select></div>
        </div>
        <div class="items-section">
          <h3>Items</h3>
          <div id="salesInvoiceItems"></div>
          <button type="button" class="btn-add" onclick="app.addItemRow('salesInvoice')">+ Add Item</button>
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span id="sinvSubtotal">₹0.00</span></div>
          <div class="total-row"><span>CGST:</span><span id="sinvCGST">₹0.00</span></div>
          <div class="total-row"><span>SGST:</span><span id="sinvSGST">₹0.00</span></div>
          <div class="total-row grand"><span>Total:</span><span id="sinvTotal">₹0.00</span></div>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn-success">Save</button>
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
        </div>
      </form>`;
  }

  addItemRow(formType) {
    const containers = {
      purchaseOrder: 'poItems',
      grn: 'grnItems',
      purchaseInvoice: 'purchaseInvoiceItems',
      salesQuotation: 'salesQuotationItems',
      salesOrder: 'salesOrderItems',
      deliveryNote: 'deliveryNoteItems',
      salesInvoice: 'salesInvoiceItems'
    };

    const container = document.getElementById(containers[formType]);
    const itemOptions = this.items.map(i => `<option value="${i.id}" data-rate="${i.rate}" data-gst="${i.gst_rate}">${i.code} - ${i.name}</option>`).join('');
    
    let rowHTML = `<div class="item-row">
      <div><select class="item-select" onchange="app.updateItemRow(this, '${formType}')" required>
        <option value="">Select Item</option>${itemOptions}
      </select></div>`;

    if (['deliveryNote', 'grn'].includes(formType)) {
      rowHTML += `<div><input type="number" step="0.001" placeholder="Qty" class="qty-input" required></div>`;
    } else {
      rowHTML += `
        <div><input type="number" step="0.001" placeholder="Qty" class="qty-input" onchange="app.calculateRow(this, '${formType}')" required></div>
        <div><input type="number" step="0.01" placeholder="Rate" class="rate-input" onchange="app.calculateRow(this, '${formType}')" required></div>
        <div><input type="number" step="0.01" placeholder="GST %" class="gst-input" onchange="app.calculateRow(this, '${formType}')" required></div>
        <div><input type="number" step="0.01" placeholder="Amount" class="amount-input" readonly></div>`;
    }

    rowHTML += `<div><button type="button" class="btn-remove" onclick="this.parentElement.parentElement.remove(); app.calculateTotals('${formType}')">×</button></div></div>`;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
  }

  updateItemRow(select, formType) {
    const row = select.closest('.item-row');
    const option = select.options[select.selectedIndex];
    const rate = option.dataset.rate;
    const gst = option.dataset.gst;

    const rateInput = row.querySelector('.rate-input');
    const gstInput = row.querySelector('.gst-input');

    if (rateInput) rateInput.value = rate;
    if (gstInput) gstInput.value = gst;

    this.calculateRow(select, formType);
  }

  calculateRow(elem, formType) {
    const row = elem.closest('.item-row');
    const qty = parseFloat(row.querySelector('.qty-input')?.value || 0);
    const rate = parseFloat(row.querySelector('.rate-input')?.value || 0);
    const gst = parseFloat(row.querySelector('.gst-input')?.value || 0);

    const amount = qty * rate;
    const amountInput = row.querySelector('.amount-input');
    if (amountInput) {
      amountInput.value = amount.toFixed(2);
    }

    this.calculateTotals(formType);
  }

  calculateTotals(formType) {
    const containers = {
      purchaseOrder: { container: 'poItems', prefix: 'po' },
      purchaseInvoice: { container: 'purchaseInvoiceItems', prefix: 'pinv' },
      salesQuotation: { container: 'salesQuotationItems', prefix: 'sq' },
      salesOrder: { container: 'salesOrderItems', prefix: 'so' },
      salesInvoice: { container: 'salesInvoiceItems', prefix: 'sinv' }
    };

    const config = containers[formType];
    if (!config) return;

    const container = document.getElementById(config.container);
    const rows = container.querySelectorAll('.item-row');

    let subtotal = 0;
    let tax = 0;

    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.qty-input')?.value || 0);
      const rate = parseFloat(row.querySelector('.rate-input')?.value || 0);
      const gstRate = parseFloat(row.querySelector('.gst-input')?.value || 0);

      const amount = qty * rate;
      const gstAmount = (amount * gstRate) / 100;

      subtotal += amount;
      tax += gstAmount;
    });

    const total = subtotal + tax;

    document.getElementById(`${config.prefix}Subtotal`).textContent = '₹' + subtotal.toFixed(2);
    
    if (['pinv', 'sinv'].includes(config.prefix)) {
      const cgst = tax / 2;
      const sgst = tax / 2;
      document.getElementById(`${config.prefix}CGST`).textContent = '₹' + cgst.toFixed(2);
      document.getElementById(`${config.prefix}SGST`).textContent = '₹' + sgst.toFixed(2);
    } else {
      document.getElementById(`${config.prefix}Tax`).textContent = '₹' + tax.toFixed(2);
    }
    
    document.getElementById(`${config.prefix}Total`).textContent = '₹' + total.toFixed(2);
  }

  async saveParty(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      await this.api('POST', '/parties', data);
      this.showSuccess('Party created successfully');
      this.closeModal();
      await this.loadMasters();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async saveItem(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    data.rate = parseFloat(data.rate);
    data.gst_rate = parseFloat(data.gst_rate);
    data.opening_stock = parseFloat(data.opening_stock);

    try {
      await this.api('POST', '/items', data);
      this.showSuccess('Item created successfully');
      this.closeModal();
      await this.loadMasters();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async savePurchaseOrder(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      supplier_id: parseInt(formData.get('supplier_id')),
      delivery_date: formData.get('delivery_date'),
      terms: formData.get('terms'),
      items: []
    };

    const container = document.getElementById('poItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);
      const rate = parseFloat(row.querySelector('.rate-input').value);
      const gstRate = parseFloat(row.querySelector('.gst-input').value);

      if (itemId && qty && rate) {
        data.items.push({ item_id: itemId, qty, rate, gst_rate: gstRate });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/purchase/orders', data);
      this.showSuccess('Purchase Order created successfully');
      this.closeModal();
      await this.loadPurchase();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async saveGRN(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      supplier_id: parseInt(formData.get('supplier_id')),
      challan_no: formData.get('challan_no'),
      challan_date: formData.get('challan_date') || null,
      items: []
    };

    const container = document.getElementById('grnItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);

      if (itemId && qty) {
        const item = this.items.find(i => i.id === itemId);
        data.items.push({ 
          item_id: itemId, 
          received_qty: qty,
          rate: item.rate
        });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/purchase/grns', data);
      this.showSuccess('GRN created successfully');
      this.closeModal();
      await this.loadPurchase();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async savePurchaseInvoice(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      supplier_id: parseInt(formData.get('supplier_id')),
      supplier_invoice_no: formData.get('supplier_invoice_no'),
      supplier_invoice_date: formData.get('supplier_invoice_date'),
      items: []
    };

    const container = document.getElementById('purchaseInvoiceItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);
      const rate = parseFloat(row.querySelector('.rate-input').value);
      const gstRate = parseFloat(row.querySelector('.gst-input').value);

      if (itemId && qty && rate) {
        data.items.push({ item_id: itemId, qty, rate, gst_rate: gstRate });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/purchase/invoices', data);
      this.showSuccess('Purchase Invoice created successfully');
      this.closeModal();
      await this.loadPurchase();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async saveSalesQuotation(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      customer_id: parseInt(formData.get('customer_id')),
      valid_till: formData.get('valid_till'),
      terms: formData.get('terms'),
      items: []
    };

    const container = document.getElementById('salesQuotationItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);
      const rate = parseFloat(row.querySelector('.rate-input').value);
      const gstRate = parseFloat(row.querySelector('.gst-input').value);

      if (itemId && qty && rate) {
        data.items.push({ item_id: itemId, qty, rate, gst_rate: gstRate });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/sales/quotations', data);
      this.showSuccess('Sales Quotation created successfully');
      this.closeModal();
      await this.loadSales();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async saveSalesOrder(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      customer_id: parseInt(formData.get('customer_id')),
      delivery_date: formData.get('delivery_date'),
      terms: formData.get('terms'),
      items: []
    };

    const container = document.getElementById('salesOrderItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);
      const rate = parseFloat(row.querySelector('.rate-input').value);
      const gstRate = parseFloat(row.querySelector('.gst-input').value);

      if (itemId && qty && rate) {
        data.items.push({ item_id: itemId, qty, rate, gst_rate: gstRate });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/sales/orders', data);
      this.showSuccess('Sales Order created successfully');
      this.closeModal();
      await this.loadSales();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async saveDeliveryNote(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      customer_id: parseInt(formData.get('customer_id')),
      vehicle_no: formData.get('vehicle_no'),
      items: []
    };

    const container = document.getElementById('deliveryNoteItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);

      if (itemId && qty) {
        data.items.push({ item_id: itemId, delivered_qty: qty });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/sales/delivery-notes', data);
      this.showSuccess('Delivery Note created successfully');
      this.closeModal();
      await this.loadSales();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async saveSalesInvoice(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      customer_id: parseInt(formData.get('customer_id')),
      items: []
    };

    const container = document.getElementById('salesInvoiceItems');
    const rows = container.querySelectorAll('.item-row');

    rows.forEach(row => {
      const itemId = parseInt(row.querySelector('.item-select').value);
      const qty = parseFloat(row.querySelector('.qty-input').value);
      const rate = parseFloat(row.querySelector('.rate-input').value);
      const gstRate = parseFloat(row.querySelector('.gst-input').value);

      if (itemId && qty && rate) {
        data.items.push({ item_id: itemId, qty, rate, gst_rate: gstRate });
      }
    });

    if (data.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    try {
      await this.api('POST', '/sales/invoices', data);
      this.showSuccess('Sales Invoice created successfully');
      this.closeModal();
      await this.loadSales();
    } catch (err) {
      this.showError(err.message);
    }
  }

  async submitDocument(type, id) {
    if (!confirm('Are you sure you want to submit this document? This action cannot be undone.')) {
      return;
    }

    const endpoints = {
      po: `/purchase/orders/${id}/submit`,
      grn: `/purchase/grns/${id}/submit`,
      purchaseInvoice: `/purchase/invoices/${id}/submit`,
      so: `/sales/orders/${id}/submit`,
      dc: `/sales/delivery-notes/${id}/submit`,
      salesInvoice: `/sales/invoices/${id}/submit`
    };

    try {
      await this.api('POST', endpoints[type]);
      this.showSuccess('Document submitted successfully');
      
      if (['po', 'grn', 'purchaseInvoice'].includes(type)) {
        await this.loadPurchase();
      } else {
        await this.loadSales();
      }
    } catch (err) {
      this.showError(err.message);
    }
  }

  async showReport(type) {
    const container = document.getElementById('reportResult');
    
    try {
      let data, columns;
      
      if (type === 'ledger') {
        const accountId = document.getElementById('reportAccountId').value;
        if (!accountId) {
          this.showError('Please select an account');
          return;
        }
        data = await this.api('GET', `/reports/ledger/${accountId}`);
        columns = [
          'doc_no',
          { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
          'doc_type',
          'party_name',
          { key: 'txn_type', format: v => v.toUpperCase() },
          { key: 'amount', format: v => '₹' + v.toFixed(2) },
          'remarks'
        ];
      } else if (type === 'stock') {
        const itemId = document.getElementById('reportItemId').value;
        if (!itemId) {
          this.showError('Please select an item');
          return;
        }
        data = await this.api('GET', `/reports/stock/${itemId}`);
        columns = [
          'doc_no',
          { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
          'doc_type',
          { key: 'movement', format: v => v.toUpperCase() },
          { key: 'qty', format: v => v.toFixed(2) },
          { key: 'rate', format: v => '₹' + v.toFixed(2) }
        ];
      } else if (type === 'party') {
        const partyId = document.getElementById('reportPartyId').value;
        if (!partyId) {
          this.showError('Please select a party');
          return;
        }
        data = await this.api('GET', `/reports/party-ledger/${partyId}`);
        columns = [
          'doc_no',
          { key: 'doc_date', format: v => new Date(v).toLocaleDateString() },
          'doc_type',
          'account_name',
          { key: 'txn_type', format: v => v.toUpperCase() },
          { key: 'amount', format: v => '₹' + v.toFixed(2) }
        ];
      }

      if (data && data.length > 0) {
        let table = '<table><thead><tr>';
        columns.forEach(col => {
          const header = typeof col === 'string' ? col : col.key;
          table += `<th>${header.replace('_', ' ').toUpperCase()}</th>`;
        });
        table += '</tr></thead><tbody>';

        data.forEach(row => {
          table += '<tr>';
          columns.forEach(col => {
            if (typeof col === 'string') {
              table += `<td>${row[col] || '-'}</td>`;
            } else {
              table += `<td>${col.format(row[col.key], row)}</td>`;
            }
          });
          table += '</tr>';
        });

        table += '</tbody></table>';
        container.innerHTML = table;
      } else {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#95a5a6;">No data found</p>';
      }
    } catch (err) {
      this.showError(err.message);
    }
  }

  async api(method, endpoint, data) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(API_BASE + endpoint, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  showSuccess(message) {
    const msg = document.createElement('div');
    msg.className = 'message message-success';
    msg.textContent = message;
    document.querySelector('.content').prepend(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  showError(message) {
    const msg = document.createElement('div');
    msg.className = 'message message-error';
    msg.textContent = message;
    document.querySelector('.content').prepend(msg);
    setTimeout(() => msg.remove(), 5000);
  }
}

const app = new ERPApp();