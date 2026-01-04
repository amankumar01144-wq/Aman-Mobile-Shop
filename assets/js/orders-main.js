import { onAuthChange } from '../../firebase/auth.js';
import { db } from '../../firebase/firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency, formatDate } from './utils.js';

const ordersContainer = document.getElementById('orders-container');

onAuthChange(async (user) => {
    if (!user) {
        ordersContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center py-20">
                <h3 class="font-bold text-gray-800 mb-2">Login Required</h3>
                <p class="text-gray-500 text-sm mb-6">Please sign in to view your orders.</p>
                <a href="login.html" class="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md">Sign In</a>
            </div>
        `;
        return;
    }

    try {
        // Query without orderBy to avoid composite index requirement
        const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        // Client-side Sort
        const orders = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const getDate = (d) => {
                    if (!d) return new Date(0);
                    if (d.toDate) return d.toDate();
                    return new Date(d);
                };
                return getDate(b.createdAt) - getDate(a.createdAt);
            });

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-20">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-box-open text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="font-bold text-gray-800 mb-2">No Orders Yet</h3>
                    <p class="text-gray-500 text-sm mb-6">Start shopping to see your orders here.</p>
                    <a href="index.html" class="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md">Shop Now</a>
                </div>
            `;
            return;
        }

        renderOrders(orders);

    } catch (error) {
        console.error("Error fetching orders:", error);
        // More descriptive error
        ordersContainer.innerHTML = `<div class="text-center text-red-500 py-10 px-4">
            <p class="mb-2">Failed to load orders.</p>
            <p class="text-xs text-gray-400">${error.message}</p>
        </div>`;
    }
});

const renderOrders = (orders) => {
    ordersContainer.innerHTML = orders.map(order => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <div class="flex justify-between items-start mb-3">
                <div>
                     <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}">
                        ${order.status || 'Pending'}
                    </span>
                    <h3 class="font-bold text-gray-800 text-sm mt-1">Order #${order.id.slice(0, 8)}</h3>
                    <p class="text-xs text-gray-400">${formatDate(order.createdAt)}</p>
                </div>
                <span class="font-bold text-blue-600">${formatCurrency(order.summary ? order.summary.finalTotal : 0)}</span>
            </div>
            
            <div class="border-t border-gray-50 pt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                ${(Array.isArray(order.items) ? order.items : []).map(item => `
                    <div class="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-100">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" class="w-full h-full object-contain p-1 mix-blend-multiply">
                    </div>
                `).join('')}
                ${(Array.isArray(order.items) ? order.items : []).length > 4 ? `<div class="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-gray-500 font-bold">+${order.items.length - 4}</div>` : ''}
            </div>

            <div class="mt-4 flex gap-4">
                <button class="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-bold active:bg-blue-50">Track Order</button>
                <button class="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold active:bg-blue-100">View Invoice</button>
            </div>
        </div>
    `).join('');
};

const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status.toLowerCase()) {
        case 'delivered': return 'bg-green-100 text-green-700';
        case 'pending': return 'bg-yellow-100 text-yellow-700';
        case 'shipped': return 'bg-blue-100 text-blue-700';
        case 'cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};
