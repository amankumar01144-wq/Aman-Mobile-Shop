import { getLocalCart, setLocalCart, formatCurrency, showToast } from './utils.js';

const cartContainer = document.getElementById('cart-container');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const loadCart = () => {
    const cart = getLocalCart();

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center py-20">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-shopping-cart text-gray-400 text-2xl"></i>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Your Cart is Empty</h3>
                <p class="text-gray-500 text-sm mb-6">Looks like you haven't added anything yet.</p>
                <a href="index.html" class="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform">Start Shopping</a>
            </div>
        `;
        cartTotalEl.innerText = formatCurrency(0);
        return;
    }

    renderCartItems(cart);
};

const renderCartItems = (cart) => {
    cartContainer.innerHTML = cart.map(item => `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 mb-3 relative overflow-hidden group">
            <!-- Image -->
            <div class="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                <img src="${item.image || 'https://via.placeholder.com/150'}" class="w-full h-full object-contain mix-blend-multiply p-1">
            </div>
            
            <!-- Details -->
            <div class="flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-gray-800 text-sm line-clamp-1">${item.name}</h3>
                    <p class="text-xs text-gray-500 mb-1">Variant: Default</p>
                    <span class="font-bold text-blue-600 text-sm">${formatCurrency(item.price)}</span>
                </div>
                
                <!-- Qty Stepper -->
                <div class="flex items-center gap-3">
                    <div class="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8">
                        <button onclick="updateItemQty('${item.id}', -1)" class="w-8 h-full flex items-center justify-center text-gray-600 active:bg-gray-200 rounded-l-lg">-</button>
                        <span class="px-2 text-xs font-bold text-gray-800 min-w-[20px] text-center">${item.qty}</span>
                        <button onclick="updateItemQty('${item.id}', 1)" class="w-8 h-full flex items-center justify-center text-gray-600 active:bg-gray-200 rounded-r-lg">+</button>
                    </div>
                </div>
            </div>

            <!-- Remove Button -->
             <button onclick="removeItem('${item.id}')" class="absolute top-3 right-3 text-gray-300 hover:text-red-500 p-1">
                <i class="fas fa-trash-alt text-sm"></i>
            </button>
        </div>
    `).join('');

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    cartTotalEl.innerText = formatCurrency(total);
};

// Global Actions
window.updateItemQty = (id, change) => {
    let cart = getLocalCart();
    const item = cart.find(i => i.id === id);

    if (item) {
        const newQty = item.qty + change;
        if (newQty > 0) {
            item.qty = newQty;
        } else {
            // Confirm delete? Or just set to 1? Let's just keep min 1 via stepper, or allow remove.
            return;
        }
        setLocalCart(cart);
        renderCartItems(cart);
        // Dispatch event for other listeners if needed
        window.dispatchEvent(new Event('cartUpdated'));
    }
};

window.removeItem = (id) => {
    let cart = getLocalCart();
    cart = cart.filter(i => i.id !== id);
    setLocalCart(cart);
    loadCart(); // Re-render full state (empty check)
    window.dispatchEvent(new Event('cartUpdated'));
    showToast("Item removed");
};

// Checkout
// Auth State
let currentUser = null;
import { onAuthChange } from '../../firebase/auth.js';

onAuthChange((user) => {
    currentUser = user;
});

// Checkout
checkoutBtn.addEventListener('click', () => {
    const cart = getLocalCart();
    if (cart.length === 0) {
        showToast("Your cart is empty", "info");
        return;
    }

    if (!currentUser) {
        showToast("Please login to checkout", "info");
        setTimeout(() => window.location.href = 'login.html', 1500);
    } else {
        window.location.href = 'checkout.html';
    }
});

// Init
document.addEventListener('DOMContentLoaded', loadCart);
