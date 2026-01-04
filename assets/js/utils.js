/**
 * Utility Functions
 */

// Format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
};

// Toast Notification
export const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast-enter transform p-4 rounded-lg shadow-lg text-white mb-3 flex items-center justify-between min-w-[300px] ${type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
        }`;

    toast.innerHTML = `
        <span class="font-medium">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col items-end';
    document.body.appendChild(container);
    return container;
}

// Loading Spinner
export const showLoading = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
        el.dataset.originalContent = el.innerHTML;
        el.innerHTML = `
            <div class="flex justify-center items-center">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
        `;
        el.disabled = true;
    }
};

export const hideLoading = (elementId) => {
    const el = document.getElementById(elementId);
    if (el && el.dataset.originalContent) {
        el.innerHTML = el.dataset.originalContent;
        el.disabled = false;
    }
};

// Date Formatter
export const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

// LocalStorage Helper for Cart (Sync with Firebase later)
export const getLocalCart = () => {
    const cart = localStorage.getItem('shopping_cart');
    return cart ? JSON.parse(cart) : [];
};

export const setLocalCart = (cart) => {
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    // Dispatch event for UI updates
    window.dispatchEvent(new Event('cartUpdated'));
};

export const clearLocalCart = () => {
    localStorage.removeItem('shopping_cart');
    window.dispatchEvent(new Event('cartUpdated'));
};

// --- Wishlist Utilities ---

export const getWishlist = () => {
    try {
        const list = localStorage.getItem('wishlist');
        return list ? JSON.parse(list) : [];
    } catch {
        return [];
    }
};

export const isInWishlist = (productId) => {
    const list = getWishlist();
    return list.includes(productId);
};

export const toggleWishlist = (productId) => {
    let list = getWishlist();
    const index = list.indexOf(productId);
    let added = false;

    if (index === -1) {
        list.push(productId);
        added = true;
        showToast("Added to Wishlist");
    } else {
        list.splice(index, 1);
        added = false;
        showToast("Removed from Wishlist");
    }

    localStorage.setItem('wishlist', JSON.stringify(list));
    window.dispatchEvent(new Event('wishlistUpdated'));
    return added;
};

// --- Notification Utilities ---

export const getNotifications = () => {
    try {
        const list = localStorage.getItem('notifications');
        return list ? JSON.parse(list) : [];
    } catch {
        return [];
    }
};

export const addNotification = (title, message, type = 'info') => {
    const list = getNotifications();
    const newNotif = {
        id: Date.now().toString(),
        title,
        message,
        type,
        read: false,
        date: new Date().toISOString()
    };
    list.unshift(newNotif); // Add to top
    // Limit to 20 notifications
    if (list.length > 20) list.pop();

    localStorage.setItem('notifications', JSON.stringify(list));
    // Also show toast
    showToast(message, type);
};

export const markAllNotificationsRead = () => {
    const list = getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(updated));
};
