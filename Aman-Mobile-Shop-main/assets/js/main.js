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

// PWA Install Logic
let deferredPrompt;
const installContainer = document.getElementById('install-app-container'); // Profile page button
const installBtn = document.getElementById('install-app-btn'); // Profile page trigger
const installSheet = document.getElementById('pwa-install-sheet'); // Home page sheet
const homeInstallBtn = document.getElementById('pwa-install-trigger'); // Home page trigger

// Helper to show/hide sheet
window.toggleInstallSheet = (show) => {
    if (!installSheet) return;
    if (show) {
        installSheet.classList.remove('translate-y-full');
    } else {
        installSheet.classList.add('translate-y-full');
    }
};

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent internal logic from running immediately
    e.preventDefault();
    deferredPrompt = e;

    // 1. Show Profile Button if exists
    if (installContainer) {
        installContainer.classList.remove('hidden');
    }

    // 2. Show Home Sheet after a delay (if on home page)
    if (installSheet) {
        // Show automatically when event fires
        setTimeout(() => {
            toggleInstallSheet(true);
        }, 3000);
    }
});

// Force check (Optional: If event fired very early)
// Note: We can't retroactively get the event. But we can ensure UI is ready.
if (installSheet) {
    // Debug: If testing, you might want to uncomment this to see UI
    // setTimeout(() => toggleInstallSheet(true), 3000);
}

const handleInstallClick = async (promptEvent) => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
        deferredPrompt = null;
        if (installContainer) installContainer.classList.add('hidden');
        toggleInstallSheet(false);
    }
};

if (installBtn) {
    installBtn.addEventListener('click', () => handleInstallClick(deferredPrompt));
}

if (homeInstallBtn) {
    homeInstallBtn.addEventListener('click', () => handleInstallClick(deferredPrompt));
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installContainer) installContainer.classList.add('hidden');
    toggleInstallSheet(false);
});

// Note: Auth link logic is now handled in profile.html specifically for the App structure
