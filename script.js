/**
 * Event Management System - Centralized Logic
 * Modular Structure: DataStore, Auth, Helpers, Page Initializers
 */

// --- 1. CONFIG & SEED DATA ---
const SEED_USERS = [
    { id: 1, username: 'admin', password: '123', role: 'admin', name: 'System Admin' },
    { id: 2, username: 'vendor1', password: '123', role: 'vendor', name: 'Party Supplies Co.', membership: 'Gold' },
    { id: 3, username: 'vendor2', password: '123', role: 'vendor', name: 'Event Decorations Ltd.', membership: 'Silver' },
    { id: 4, username: 'user1', password: '123', role: 'user', name: 'John Doe', guestList: [] },
    { id: 5, username: 'user2', password: '123', role: 'user', name: 'Jane Smith', guestList: [] }
];

const SEED_PRODUCTS = [
    { id: 101, vendorId: 2, name: 'Colorful Balloons', price: 15.00, status: 'Active', description: 'Pack of 50 balloons' },
    { id: 102, vendorId: 2, name: 'Party Streamers', price: 5.50, status: 'Active', description: 'Red and gold streamers' },
    { id: 103, vendorId: 3, name: 'Table Centerpiece', price: 45.00, status: 'Active', description: 'Floral arrangement' }
];

const SEED_ORDERS = [
    { id: 501, userId: 4, vendorId: 2, items: [{ productId: 101, qty: 2 }], total: 30.00, status: 'Completed', date: '2023-10-01' },
];

// --- 2. DATA STORE OBJECT ---
const DataStore = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),

    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),

    add: (key, item) => {
        const data = DataStore.get(key);
        data.push(item);
        DataStore.save(key, data);
        return item;
    },

    update: (key, id, updatedItem) => {
        const data = DataStore.get(key);
        const index = data.findIndex(i => i.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updatedItem };
            DataStore.save(key, data);
            return true;
        }
        return false;
    },

    remove: (key, id) => {
        let data = DataStore.get(key);
        data = data.filter(i => i.id !== id);
        DataStore.save(key, data);
    },

    find: (key, id) => {
        const data = DataStore.get(key);
        return data.find(i => i.id === id);
    },

    init: () => {
        if (!localStorage.getItem('ems_users')) DataStore.save('ems_users', SEED_USERS);
        if (!localStorage.getItem('ems_products')) DataStore.save('ems_products', SEED_PRODUCTS);
        if (!localStorage.getItem('ems_orders')) DataStore.save('ems_orders', SEED_ORDERS);
    }
};

// --- 3. AUTH OBJECT ---
const Auth = {
    login: (username, password, role) => {
        const users = DataStore.get('ems_users');
        const user = users.find(u => u.username === username && u.password === password && u.role === role);
        if (user) {
            localStorage.setItem('ems_currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    logout: () => {
        localStorage.removeItem('ems_currentUser');
        window.location.href = 'index.html';
    },

    getCurrentUser: () => JSON.parse(localStorage.getItem('ems_currentUser')),

    checkAuth: (requiredRole) => {
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        if (requiredRole && user.role !== requiredRole) {
            alert('Unauthorized access');
            window.location.href = `${user.role}.html`;
            return null;
        }
        return user;
    }
};

// --- 4. UI HELPER OBJECT ---
const UI = {
    showSection: (sectionId) => {
        document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
        document.getElementById(`section-${sectionId}`).classList.remove('hidden');

        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    },

    openModal: (modalId) => document.getElementById(modalId).classList.add('active'),

    closeModal: (modalId) => document.getElementById(modalId).classList.remove('active'),

    formatDate: (dateString) => new Date(dateString).toLocaleDateString(),

    renderTable: (tableId, data, columns, actionsCallback) => {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length + (actionsCallback ? 1 : 0)}" class="text-center text-secondary">No data found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((item, index) => {
            const rowCells = columns.map(col => `<td>${col(item, index)}</td>`).join('');
            const actions = actionsCallback ? `<td>${actionsCallback(item, index)}</td>` : '';
            return `<tr>${rowCells}${actions}</tr>`;
        }).join('');
    }
};

// --- 5. INITIALIZERS ---
const App = {
    init: () => {
        DataStore.init();
        const path = window.location.pathname;

        if (path.includes('login.html')) initLogin();
        else if (path.includes('admin.html')) initAdmin();
        else if (path.includes('vendor.html')) initVendor();
        else if (path.includes('user.html')) initUser();

        window.logout = Auth.logout;
    }
};

// --- PAGE: LOGIN ---
function initLogin() {
    const roleBtns = document.querySelectorAll('.role-btn');
    const loginForm = document.getElementById('loginForm');
    const submitBtn = loginForm.querySelector('button');
    let currentRole = 'admin';

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.dataset.role;
            submitBtn.textContent = `Login as ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}`;
        });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');

        const result = Auth.login(username, password, currentRole);

        if (result.success) {
            errorMsg.style.display = 'none';
            window.location.href = `${currentRole}.html`;
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    });
}

// --- PAGE: ADMIN ---
function initAdmin() {
    if (!Auth.checkAuth('admin')) return;

    // Navigation
    window.showSection = (id) => {
        UI.showSection(id);
        const titles = { 'dashboard': 'Dashboard', 'vendors': 'Vendor Management', 'users': 'User Management' };
        document.getElementById('pageTitle').textContent = titles[id];

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        // NOTE: Active class on specific link is handled by the click event in HTML mostly, but we reset for cleanliness

        if (id === 'dashboard') loadAdminStats();
        if (id === 'vendors') loadVendors();
        if (id === 'users') loadUsers();
    };

    // Load Data
    loadAdminStats();

    // Globals for onclicks
    window.openModal = UI.openModal;
    window.closeModal = UI.closeModal;
    window.openEditVendor = openEditVendor;
    window.deleteUser = deleteUser;

    // Add Vendor
    document.getElementById('addVendorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newVendor = {
            id: Date.now(),
            username: formData.get('username'),
            password: formData.get('password'),
            name: formData.get('name'),
            role: 'vendor',
            membership: formData.get('membership')
        };
        DataStore.add('ems_users', newVendor);
        e.target.reset();
        UI.closeModal('addVendorModal');
        loadVendors();
        loadAdminStats();
    });

    // Edit Vendor
    document.getElementById('editVendorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = parseInt(formData.get('id'));
        DataStore.update('ems_users', id, { membership: formData.get('membership') });
        UI.closeModal('editVendorModal');
        loadVendors();
    });
}

function loadAdminStats() {
    const users = DataStore.get('ems_users');
    const orders = DataStore.get('ems_orders');

    document.getElementById('stat-users').textContent = users.filter(u => u.role === 'user').length;
    document.getElementById('stat-vendors').textContent = users.filter(u => u.role === 'vendor').length;
    document.getElementById('stat-orders').textContent = orders.length;

    const recentOrders = orders.slice(-5).reverse();
    UI.renderTable('recentOrdersTable', recentOrders, [
        o => `#${o.id}`,
        o => `User #${o.userId}`,
        o => `$${o.total}`,
        o => `<span class="badge ${o.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${o.status}</span>`,
        o => o.date || 'N/A'
    ]);
}

function loadVendors() {
    const users = DataStore.get('ems_users');
    const vendors = users.filter(u => u.role === 'vendor');

    UI.renderTable('vendorsTable', vendors, [
        v => `#${v.id}`,
        v => v.name,
        v => v.username,
        v => `<span class="badge badge-warning">${v.membership || 'Standard'}</span>`
    ], (v) => `
        <button class="btn btn-secondary text-sm" onclick="openEditVendor(${v.id})">Edit</button>
        <button class="btn btn-danger text-sm" onclick="deleteUser(${v.id})">Delete</button>
    `);
}

function loadUsers() {
    const users = DataStore.get('ems_users');
    const regular = users.filter(u => u.role === 'user');

    UI.renderTable('usersTable', regular, [
        u => `#${u.id}`,
        u => u.name,
        u => u.username,
        u => `<span class="badge badge-success">User</span>`
    ], (u) => `
        <button class="btn btn-danger text-sm" onclick="deleteUser(${u.id})">Delete</button>
    `);
}

function deleteUser(id) {
    if (confirm('Are you sure?')) {
        DataStore.remove('ems_users', id);
        // Refresh current view
        const activeSection = document.querySelector('.section:not(.hidden)').id;
        if (activeSection === 'section-vendors') loadVendors();
        if (activeSection === 'section-users') loadUsers();
        loadAdminStats();
    }
}

function openEditVendor(id) {
    const vendor = DataStore.find('ems_users', id);
    if (!vendor) return;

    const form = document.getElementById('editVendorForm');
    form.elements['id'].value = vendor.id;
    form.elements['name'].value = vendor.name;
    form.elements['membership'].value = vendor.membership || 'Standard';
    UI.openModal('editVendorModal');
}


// --- PAGE: VENDOR ---
function initVendor() {
    const user = Auth.checkAuth('vendor');
    if (!user) return;

    document.getElementById('welcomeMsg').textContent = `Welcome, ${user.name}`;
    document.getElementById('vendorMembership').textContent = (user.membership || 'Standard') + ' Plan';

    window.showSection = (id) => {
        UI.showSection(id);
        const titles = { 'products': 'My Products', 'orders': 'Transactions / Orders' };
        document.getElementById('pageTitle').textContent = titles[id];

        if (id === 'products') loadVendorProducts(user.id);
        if (id === 'orders') loadVendorOrders(user.id);
    };

    window.openModal = UI.openModal;
    window.closeModal = UI.closeModal;
    window.openEditProduct = openEditProduct;
    window.deleteProduct = deleteProduct;
    window.completeOrder = completeOrder;

    loadVendorProducts(user.id);

    // Add Product
    document.getElementById('addProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        DataStore.add('ems_products', {
            id: Date.now(),
            vendorId: user.id,
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            status: formData.get('status')
        });

        e.target.reset();
        UI.closeModal('addProductModal');
        loadVendorProducts(user.id);
    });

    // Edit Product
    document.getElementById('editProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = parseInt(formData.get('id'));

        DataStore.update('ems_products', id, {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            status: formData.get('status')
        });

        UI.closeModal('editProductModal');
        loadVendorProducts(user.id);
    });
}

function loadVendorProducts(vendorId) {
    const products = DataStore.get('ems_products').filter(p => p.vendorId === vendorId);
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = '<p class="text-secondary text-center w-full">No products added yet.</p>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img">
                <i class="fas fa-box fa-3x"></i>
            </div>
            <div class="product-details">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-lg">${p.name}</h4>
                    <span class="badge ${p.status === 'Active' ? 'badge-success' : 'badge-danger'}">${p.status}</span>
                </div>
                <p class="text-secondary text-sm my-2">${p.description}</p>
                <div class="flex justify-between items-center mt-4">
                    <span class="font-bold text-primary">$${p.price.toFixed(2)}</span>
                    <div class="flex gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="openEditProduct(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function openEditProduct(id) {
    const product = DataStore.find('ems_products', id);
    if (!product) return;
    const form = document.getElementById('editProductForm');
    form.elements['id'].value = product.id;
    form.elements['name'].value = product.name;
    form.elements['price'].value = product.price;
    form.elements['description'].value = product.description;
    form.elements['status'].value = product.status;
    UI.openModal('editProductModal');
}

function deleteProduct(id) {
    if (confirm('Delete product?')) {
        DataStore.remove('ems_products', id);
        loadVendorProducts(Auth.getCurrentUser().id);
    }
}

function loadVendorOrders(vendorId) {
    const orders = DataStore.get('ems_orders');
    const myOrders = orders.filter(o => o.vendorId === vendorId || o.items.some(i => {
        const p = DataStore.find('ems_products', i.productId);
        return p && p.vendorId === vendorId;
    }));

    UI.renderTable('ordersTable', myOrders, [
        o => `#${o.id}`,
        o => `Product IDs: ${o.items.map(i => i.productId).join(', ')}`,
        o => o.items.reduce((acc, i) => acc + i.qty, 0),
        o => `$${o.total}`,
        o => `<span class="badge ${o.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${o.status}</span>`
    ], (o) => {
        return o.status !== 'Completed'
            ? `<button class="btn btn-success text-sm" onclick="completeOrder(${o.id})">Approve</button>`
            : `<span class="text-secondary text-sm">No Action</span>`;
    });
}

function completeOrder(id) {
    DataStore.update('ems_orders', id, { status: 'Completed' });
    loadVendorOrders(Auth.getCurrentUser().id);
}

// --- PAGE: USER ---
function initUser() {
    const user = Auth.checkAuth('user');
    if (!user) return;

    document.getElementById('welcomeMsg').textContent = `Welcome, ${user.name}`;

    window.showSection = (id) => {
        UI.showSection(id);
        const titles = { 'marketplace': 'Marketplace', 'cart': 'My Cart', 'guestlist': 'Guest List', 'orders': 'Order Status' };
        document.getElementById('pageTitle').textContent = titles[id];

        if (id === 'marketplace') loadMarketplace();
        if (id === 'cart') loadCart();
        if (id === 'guestlist') loadGuestList(user.id);
        if (id === 'orders') loadUserOrders(user.id);
    };

    window.addToCart = addToCart;
    window.updateQty = updateQty;
    window.removeFromCart = removeFromCart;
    window.checkout = checkout;
    window.addGuest = addGuest;
    window.removeGuest = removeGuest;
    window.filterProducts = filterProducts;
    window.closeModal = UI.closeModal;

    updateCartIcon();
    loadMarketplace();
}

function loadMarketplace() {
    const products = DataStore.get('ems_products').filter(p => p.status === 'Active');
    renderUserProducts(products);
}

function renderUserProducts(products) {
    const grid = document.getElementById('marketplaceGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p class="text-secondary text-center w-full">No products found.</p>';
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img"><i class="fas fa-box fa-3x"></i></div>
            <div class="product-details">
                <h4 class="font-bold text-lg">${p.name}</h4>
                <p class="text-secondary text-sm my-2">${p.description}</p>
                <div class="flex justify-between items-center mt-4">
                    <span class="font-bold text-primary">$${p.price.toFixed(2)}</span>
                    <button class="btn btn-secondary btn-sm" onclick="addToCart(${p.id})">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const products = DataStore.get('ems_products');
    const filtered = products.filter(p => p.status === 'Active' && p.name.toLowerCase().includes(query));
    renderUserProducts(filtered);
}

// Cart Logic
function getCartKey() {
    return 'ems_cart_' + Auth.getCurrentUser().id;
}

function addToCart(productId) {
    let cart = DataStore.get(getCartKey());
    const existing = cart.find(i => i.productId === productId);

    if (existing) existing.qty++;
    else cart.push({ productId, qty: 1 });

    DataStore.save(getCartKey(), cart);
    alert('Added to cart!');
    updateCartIcon();
}

function updateCartIcon() {
    const cart = DataStore.get(getCartKey());
    document.getElementById('cartCount').textContent = cart.reduce((acc, i) => acc + i.qty, 0);
}

function loadCart() {
    const cart = DataStore.get(getCartKey());
    const products = DataStore.get('ems_products');
    const container = document.getElementById('cartItemsContainer');

    if (cart.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-secondary">Your cart is empty.</div>';
        updateCartTotals([]);
        return;
    }

    const cartItems = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product };
    });

    container.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item">
            <div class="flex items-center gap-4">
                 <div style="width: 50px; height: 50px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem;">
                    <i class="fas fa-box text-secondary"></i>
                </div>
                <div>
                    <h4 class="font-bold">${item.product ? item.product.name : 'Unknown Item'}</h4>
                    <p class="text-secondary text-sm">$${item.product ? item.product.price : 0} x ${item.qty}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" onclick="updateQty(${index}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" onclick="updateQty(${index}, 1)">+</button>
                <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; margin-left: 0.5rem;" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    updateCartTotals(cartItems);
}

function updateQty(index, change) {
    let cart = DataStore.get(getCartKey());
    if (cart[index].qty + change > 0) {
        cart[index].qty += change;
        DataStore.save(getCartKey(), cart);
        loadCart();
        updateCartIcon();
    }
}

function removeFromCart(index) {
    let cart = DataStore.get(getCartKey());
    cart.splice(index, 1);
    DataStore.save(getCartKey(), cart);
    loadCart();
    updateCartIcon();
}

function updateCartTotals(cartItems) {
    const subtotal = cartItems.reduce((acc, item) => acc + ((item.product?.price || 0) * item.qty), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

function checkout() {
    let cart = DataStore.get(getCartKey());
    if (cart.length === 0) return alert('Cart is empty!');

    const products = DataStore.get('ems_products');
    const subtotal = cart.reduce((acc, item) => {
        const p = products.find(prod => prod.id === item.productId);
        return acc + ((p?.price || 0) * item.qty);
    }, 0);
    const total = subtotal * 1.05;

    const currentUser = Auth.getCurrentUser();

    DataStore.add('ems_orders', {
        id: Date.now(),
        userId: currentUser.id,
        vendorId: products.find(p => p.id === cart[0].productId)?.vendorId,
        items: cart,
        total: parseFloat(total.toFixed(2)),
        status: 'Pending',
        date: new Date().toLocaleDateString()
    });

    DataStore.save(getCartKey(), []);
    loadCart();
    updateCartIcon();
    UI.openModal('paymentModal');
}

// Guest List
function loadGuestList(userId) {
    const user = DataStore.find('ems_users', userId);
    const list = user.guestList || [];
    UI.renderTable('guestListTable', list, [
        (g, i) => i + 1,
        (g) => g.name,
        (g) => g.email || 'N/A',
        (g) => `<span class="badge badge-success">Invited</span>`
    ], (g) => `<button class="btn btn-danger btn-sm" onclick="removeGuest('${g.name}')"><i class="fas fa-trash"></i></button>`);
}

function addGuest() {
    const name = document.getElementById('guestNameInput').value;
    const email = document.getElementById('guestEmailInput').value;
    if (!name) return alert('Enter name');

    const user = Auth.getCurrentUser();
    const storedUser = DataStore.find('ems_users', user.id);
    if (!storedUser.guestList) storedUser.guestList = [];

    // Simple duplicate check
    if (storedUser.guestList.some(g => g.name === name)) return alert('Guest already exists');

    storedUser.guestList.push({ name, email, status: 'Invited' });
    DataStore.update('ems_users', user.id, storedUser);

    localStorage.setItem('ems_currentUser', JSON.stringify(storedUser));

    document.getElementById('guestNameInput').value = '';
    document.getElementById('guestEmailInput').value = '';
    loadGuestList(user.id);
}

function removeGuest(name) {
    const user = Auth.getCurrentUser();
    const storedUser = DataStore.find('ems_users', user.id);

    storedUser.guestList = storedUser.guestList.filter(g => g.name !== name);
    DataStore.update('ems_users', user.id, storedUser);

    localStorage.setItem('ems_currentUser', JSON.stringify(storedUser));
    loadGuestList(user.id);
}

function loadUserOrders(userId) {
    const orders = DataStore.get('ems_orders').filter(o => o.userId === userId);
    UI.renderTable('userOrdersTable', orders, [
        o => `#${o.id}`,
        o => `${o.items.length} Items`,
        o => `$${o.total}`,
        o => o.date,
        o => `<span class="badge ${o.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${o.status}</span>`
    ]);
}


// --- 6. START APP ---
document.addEventListener('DOMContentLoaded', App.init);
