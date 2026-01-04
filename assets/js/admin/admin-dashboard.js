import { db } from '../../../firebase/firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency, showLoading, hideLoading } from '../utils.js';
import { logoutUser } from '../../../firebase/auth.js';

const totalRevenueEl = document.getElementById('total-revenue');
const totalOrdersEl = document.getElementById('total-orders');
const totalProductsEl = document.getElementById('total-products');
const totalUsersEl = document.getElementById('total-users');
const recentOrdersList = document.getElementById('recent-orders-list');
const logoutBtn = document.getElementById('logout-btn');

const loadDashboardStats = async () => {
    try {
        // Fetch Parallel (Optimization: Limit orders if possible, but for stats we need all or a designated 'stats' doc)
        const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
            getDocs(collection(db, "orders")), // Removed orderBy to avoid index requirement for All Orders stats
            getDocs(collection(db, "products")),
            getDocs(collection(db, "users"))
        ]);

        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client-side Sort for Recent Orders
        const recentOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);

        // Stats
        const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.summary?.finalTotal) || 0), 0);

        totalRevenueEl.innerText = formatCurrency(totalRevenue);
        totalOrdersEl.innerText = orders.length;
        totalProductsEl.innerText = productsSnap.size;
        totalUsersEl.innerText = usersSnap.size;

        renderRecentOrders(recentOrders);

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        showToast("Error loading stats: " + error.message, "error");
    }
};

const renderRecentOrders = (orders) => {
    if (orders.length === 0) {
        recentOrdersList.innerHTML = `<p class="text-center text-gray-400 text-sm py-4">No recent activity.</p>`;
        return;
    }

    recentOrdersList.innerHTML = orders.map(order => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center" onclick="window.location.href='orders.html'">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold text-gray-800">#${order.id.slice(0, 6)}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}">${order.status}</span>
                </div>
                <p class="text-xs text-gray-500">${order.customerInfo?.name || 'Guest'}</p>
            </div>
            <div class="text-right">
                <div class="font-bold text-gray-900 text-sm">${formatCurrency(order.summary?.finalTotal)}</div>
                <div class="text-[10px] text-gray-400">${new Date(order.orderDate).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
};

const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'delivered': return 'bg-green-100 text-green-700';
        case 'pending': return 'bg-yellow-100 text-yellow-700';
        case 'shipped': return 'bg-blue-100 text-blue-700';
        case 'cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await logoutUser();
        window.location.href = 'admin-login.html';
    });
}

document.addEventListener('DOMContentLoaded', loadDashboardStats);
