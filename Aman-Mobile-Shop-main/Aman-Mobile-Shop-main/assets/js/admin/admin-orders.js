import { getAllOrders, updateOrderStatus, getSettings } from '../../../firebase/db.js';
import { db } from '../../../firebase/firebase-config.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast, showLoading, hideLoading, formatCurrency, formatDate } from '../utils.js';

const ordersList = document.getElementById('admin-orders-list');
const statusSheet = document.getElementById('status-sheet');
const statusOrderId = document.getElementById('status-order-id');

let allOrders = [];

const loadOrders = async () => {
    try {
        ordersList.innerHTML = `<div class="bg-white p-4 rounded-xl shadow-sm h-32 animate-pulse"></div>`;
        const snap = await getDocs(collection(db, "orders"));

        // Sort client side - Newest First
        allOrders = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const getDate = (d) => {
                    if (!d) return 0;
                    if (d.toDate) return d.toDate().getTime();
                    if (d.seconds) return d.seconds * 1000;
                    return new Date(d).getTime();
                };
                return getDate(b.createdAt) - getDate(a.createdAt);
            });

        renderOrders(allOrders);
    } catch (error) {
        console.error("Order Load Error:", error);
        showToast("Error loading orders: " + error.message, "error");
        ordersList.innerHTML = `<div class="bg-red-50 p-4 rounded-lg text-center text-red-600 text-sm">
            <p><strong>Failed to load orders</strong></p>
            <p>${error.message}</p>
        </div>`;
    }
};

window.filterOrders = (status) => {
    if (!allOrders) return;

    if (status === 'all') {
        renderOrders(allOrders);
    } else if (status === 'service_orders') {
        const serviceOrders = allOrders.filter(o =>
            o.deviceInfo ||
            (o.items && o.items.some(i =>
                (i.type === 'service') ||
                (i.image && i.image.includes('repair')) ||
                (i.title && (i.title.toLowerCase().includes('repair') || i.title.toLowerCase().includes('service')))
            ))
        );
        renderOrders(serviceOrders);
    } else {
        const filtered = allOrders.filter(o => o.status && o.status.toLowerCase() === status.toLowerCase());
        renderOrders(filtered);
    }
};

const renderOrders = (orders) => {
    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = `<p class="text-center text-gray-400 py-10">No orders found.</p>`;
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div class="flex justify-between items-start mb-2">
                <div>
                     <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}">
                        ${order.status || 'Pending'}
                    </span>
                    <h3 class="font-bold text-gray-800 text-sm mt-1">Order #${order.id.slice(0, 8)}</h3>
                </div>
                <div class="text-right">
                    <span class="font-bold text-blue-600">${formatCurrency(order.summary?.finalTotal || 0)}</span>
                    <p class="text-[10px] text-gray-400 mt-1">${formatDate(order.createdAt)}</p>
                </div>
            </div>

            <!-- Customer Info -->
            <div class="bg-gray-50 p-3 rounded-lg mb-3 text-xs text-gray-600">
                <p><strong>To:</strong> ${order.customerInfo?.name || 'Guest'}</p>
                <p class="truncate">${order.customerInfo?.address || 'No Address'}</p>
                <p>${order.customerInfo?.phone || ''}</p>
            </div>
            
            <!-- Items Preview -->
            <div class="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
                ${(Array.isArray(order.items) ? order.items : []).map(item => `
                    <div class="w-10 h-10 bg-white border border-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" class="w-full h-full object-contain p-0.5 mix-blend-multiply">
                    </div>
                `).join('')}
            </div>

            <div class="flex gap-2 mt-3">
                <button onclick="openDetailModal('${order.id}')" class="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold active:scale-95 transition-transform shadow-sm border border-blue-100">
                    View Details
                </button>
                <button onclick="openStatusSheet('${order.id}')" class="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold active:scale-95 transition-transform shadow-md">
                    Change Status
                </button>
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

window.openStatusSheet = (id) => {
    if (statusOrderId && statusSheet) {
        statusOrderId.value = id;
        statusSheet.classList.remove('hidden');
    }
};

window.closeStatusSheet = () => {
    if (statusSheet) statusSheet.classList.add('hidden');
};

window.updateStatus = async (status) => {
    const id = statusOrderId.value;
    if (!id) return;

    try {
        await updateDoc(doc(db, "orders", id), { status: status });
        showToast(`Order marked as ${status}`);
        closeStatusSheet();
        loadOrders(); // Refresh
    } catch (e) {
        console.error(e);
        showToast("Update failed", "error");
    }
}


// Detail Modal
const detailModal = document.getElementById('detail-modal');
const modalContent = document.getElementById('modal-content');

window.openDetailModal = (id) => {
    const order = allOrders.find(o => o.id === id);
    if (!order) return;

    modalContent.innerHTML = `
        <div class="space-y-4">
            <!-- ID & Status -->
            <div class="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                    <span class="text-xs text-gray-400 block">Order ID</span>
                    <span class="font-mono text-sm font-bold text-gray-800">#${order.id}</span>
                </div>
                <span class="px-3 py-1 rounded text-xs font-bold uppercase ${getStatusColor(order.status)}">${order.status}</span>
            </div>

            <!-- Customer -->
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</h4>
                <p class="font-bold text-gray-800 text-sm">${order.customerInfo?.name || 'Guest'}</p>
                <p class="text-sm text-gray-600">${order.customerInfo?.address || 'No address'}</p>
                <p class="text-sm text-blue-600 font-bold mt-1">${order.customerInfo?.phone || 'No phone'}</p>
                 <p class="text-xs text-gray-400 mt-0.5">${order.customerInfo?.email || ''}</p>
            </div>

            <!-- Device Info (If Service) -->
            ${order.deviceInfo ? `
            <div class="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <h4 class="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Device Repair Details</h4>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span class="text-xs text-gray-500 block">Brand</span>
                        <span class="font-bold text-gray-800">${order.deviceInfo.brand}</span>
                    </div>
                    <div>
                        <span class="text-xs text-gray-500 block">Model</span>
                        <span class="font-bold text-gray-800">${order.deviceInfo.model}</span>
                    </div>
                    <div class="col-span-2">
                         <span class="text-xs text-gray-500 block">Issue</span>
                        <p class="font-medium text-gray-800 bg-white p-2 rounded border border-orange-100 mt-1">${order.deviceInfo.issue}</p>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Items -->
            <div>
                 <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Items</h4>
                 <div class="space-y-2">
                    ${(order.items || []).map(item => `
                        <div class="flex gap-3 items-center bg-white border border-gray-100 p-2 rounded-lg">
                             <div class="w-12 h-12 bg-gray-50 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                <img src="${item.image || 'https://via.placeholder.com/50'}" class="w-full h-full object-contain p-0.5 mix-blend-multiply">
                            </div>
                            <div class="flex-1">
                                <p class="font-bold text-gray-800 text-sm line-clamp-1">${item.title || item.name}</p>
                                <p class="text-xs text-gray-500">Qty: ${item.qty} x ${formatCurrency(item.price)}</p>
                            </div>
                            <span class="font-bold text-gray-900 text-sm">${formatCurrency(item.price * item.qty)}</span>
                        </div>
                    `).join('')}
                 </div>
            </div>

            <!-- Summary -->
             <div class="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span class="text-gray-500 font-medium">Total Amount</span>
                <span class="text-xl font-extrabold text-blue-600">${formatCurrency(order.summary?.finalTotal || 0)}</span>
             </div>
        </div>
    `;

    if (detailModal) detailModal.classList.remove('hidden');
};

window.closeDetailModal = () => {
    if (detailModal) detailModal.classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', loadOrders);
