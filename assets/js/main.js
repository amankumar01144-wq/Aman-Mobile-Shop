import { onAuthChange, logoutUser } from '../../firebase/auth.js';
import { getLatestBroadcastNotification } from '../../firebase/db.js';
import { getLocalCart, addNotification, getNotifications } from './utils.js';

// Elements
const navCartCount = document.getElementById('nav-cart-count');

const updateCartCount = () => {
    const cart = getLocalCart();
    const count = cart.reduce((acc, item) => acc + item.qty, 0);

    const badges = [
        document.getElementById('nav-cart-count'),
        document.getElementById('cart-count')
    ];

    badges.forEach(badge => {
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
                badge.classList.add('flex'); // Ensure flex is added back if hidden removed it
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('flex');
            }
        }
    });
};

// Init Global Listeners
updateCartCount();
window.addEventListener('cartUpdated', updateCartCount);

// Check for Broadcast Notifications
const checkBroadcasts = async () => {
    // Only check if online/connected to avoid spam errors
    if (!navigator.onLine) return;

    const latest = await getLatestBroadcastNotification();
    if (latest) {
        const localList = getNotifications();
        // Check if we already have this notification ID
        const exists = localList.some(n => n.id === latest.id || (n.title === latest.title && n.message === latest.message && n.date === latest.sentAt));

        if (!exists) {
            // New notification from Admin!
            // We use standard utils addNotification, but we might want to override ID to match server ID to prevent dupes
            // Actually, utils.addNotification generates a new Date ID. 
            // Better to manually add to storage or modify utils.
            // Let's modify logic slightly: Add it using the helper, but since the helper generates ID, we might double add if we rely on generated ID.
            // Safe bet: Check by Content+Time or assume 'latest' query is enough for "one-time" popups.
            // BETTER: Storing "lastBroadcastId" in local storage separately.

            const lastSeenId = localStorage.getItem('last_broadcast_id');
            if (lastSeenId !== latest.id) {
                addNotification(latest.title, latest.message, latest.type);
                localStorage.setItem('last_broadcast_id', latest.id);
            }
        }
    }
};

// Check on load
document.addEventListener('DOMContentLoaded', () => {
    // distinct from others
    setTimeout(checkBroadcasts, 2000); // 2s delay so it doesn't clash with other load toasts
});

// Note: Auth link logic is now handled in profile.html specifically for the App structure
