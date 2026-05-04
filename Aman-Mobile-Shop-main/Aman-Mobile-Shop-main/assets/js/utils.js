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
// Premium Designer Toast Notification (Compact)
export const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    // Base classes for premium look - now ultra compact pill style
    const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-white/10 text-white mb-2 animate-slide-up max-w-[80vw]";

    // Type-specific styles
    const typeStyles = {
        success: { bg: "bg-green-500/95", icon: "fas fa-check" },
        error: { bg: "bg-red-500/95", icon: "fas fa-exclamation" },
        info: { bg: "bg-blue-600/95", icon: "fas fa-info" }
    };

    const style = typeStyles[type] || typeStyles.info;
    toast.className = `${baseClasses} ${style.bg}`;

    toast.innerHTML = `
        <i class="${style.icon} text-[10px]"></i>
        <div class="flex-1 overflow-hidden">
            <p class="text-[10px] font-bold truncate whitespace-nowrap">${message}</p>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 1 seconds (snappier feel)
    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.classList.add('animate-slide-down');
            setTimeout(() => toast.remove(), 300);
        }
    }, 1000);
};

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    // Mobile-first centered at bottom
    container.className = 'fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center px-4 pointer-events-none';
    // Allow clicks only on children
    container.style.cssText = 'pointer-events: none;';
    document.body.appendChild(container);

    // Inline style for children to be clickable
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container > div { pointer-events: auto; }
        .animate-slide-up { animation: toastSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-down { animation: toastSlideDown 0.3s ease-in forwards; }
        @keyframes toastSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideDown {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(10px) scale(0.9); }
        }
    `;
    document.head.appendChild(style);

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
