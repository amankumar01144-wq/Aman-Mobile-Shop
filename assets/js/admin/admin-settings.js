import { uploadBannerImage, updateSettings, getSettings, sendBroadcastNotification, getRecentBroadcastNotifications, deleteBroadcastNotification } from '../../../firebase/db.js';
import { showToast, showLoading, hideLoading } from '../utils.js';

const bannersList = document.getElementById('banners-list');
const bannerUploadInput = document.getElementById('banner-upload');
const generalForm = document.getElementById('general-form');
const notifForm = document.getElementById('notification-form');

let currentBanners = [];

// --- Banners ---

const loadBanners = async () => {
    try {
        const data = await getSettings('home_banners');
        currentBanners = data?.banners || [];
        renderBanners();
    } catch (error) {
        console.error(error);
        if (bannersList) bannersList.innerHTML = '<p class="text-red-500 text-xs p-4">Failed to load banners.</p>';
    }
};

const renderBanners = () => {
    if (!bannersList) return;

    if (currentBanners.length === 0) {
        bannersList.innerHTML = '<p class="text-gray-400 text-xs p-4 text-center">No banners added yet.</p>';
        return;
    }

    bannersList.innerHTML = currentBanners.map((banner, index) => `
        <div class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
            <div class="w-24 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100">
                <img src="${banner.image}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-gray-700 truncate">${banner.filename || 'Banner Image'}</p>
                <p class="text-[10px] text-gray-400 truncate">${new Date(banner.addedAt).toLocaleDateString()}</p>
            </div>
            <button onclick="deleteBanner(${index})" 
                class="w-8 h-8 rounded-full bg-white border border-gray-200 text-red-500 shadow-sm flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        </div>
    `).join('');
};

window.deleteBanner = async (index) => {
    if (!confirm('Delete this banner?')) return;

    try {
        currentBanners.splice(index, 1);
        await updateSettings('home_banners', { banners: currentBanners });
        renderBanners();
        showToast('Banner deleted');
    } catch (error) {
        showToast('Failed to delete', 'error');
    }
};

if (bannerUploadInput) {
    bannerUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            showToast('Uploading...', 'info');
            const url = await uploadBannerImage(file);

            const newBanner = {
                id: Date.now().toString(),
                image: url,
                filename: file.name,
                addedAt: new Date().toISOString()
            };

            currentBanners.push(newBanner);
            await updateSettings('home_banners', { banners: currentBanners });

            renderBanners();
            showToast('Banner added successfully');
        } catch (error) {
            console.error(error);
            showToast('Upload failed', 'error');
        } finally {
            e.target.value = ''; // Reset input
        }
    });
}

// Add via URL
const addUrlBtn = document.getElementById('add-url-btn');
if (addUrlBtn) {
    addUrlBtn.addEventListener('click', async () => {
        const input = document.getElementById('banner-url-input');
        const url = input.value.trim();

        if (!url) return;

        try {
            showLoading('add-url-btn');

            // Basic image check
            const img = new Image();
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const newBanner = {
                id: Date.now().toString(),
                image: url,
                filename: 'External Link',
                addedAt: new Date().toISOString()
            };

            currentBanners.push(newBanner);
            await updateSettings('home_banners', { banners: currentBanners });

            renderBanners();
            showToast('Banner link added');
            input.value = '';

        } catch (error) {
            console.error(error);
            showToast('Invalid Image URL', 'error');
        } finally {
            hideLoading('add-url-btn');
        }
    });
}

// --- General Settings ---

const loadGeneralSettings = async () => {
    try {
        const data = await getSettings('general');
        if (data) {
            if (document.getElementById('min-order')) document.getElementById('min-order').value = data.minOrderPrice || '';
            if (document.getElementById('points-rate')) document.getElementById('points-rate').value = data.pointsAwardRate || '';
            if (document.getElementById('show-offers')) document.getElementById('show-offers').checked = data.showOffersOnHome || false;

            if (document.getElementById('support-phone')) document.getElementById('support-phone').value = data.supportPhoneNumber || '';
            if (document.getElementById('support-whatsapp')) document.getElementById('support-whatsapp').value = data.supportWhatsAppNumber || '';
            if (document.getElementById('support-email')) document.getElementById('support-email').value = data.supportEmail || '';
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
};

if (generalForm) {
    generalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnId = 'save-general-btn';

        try {
            showLoading(btnId);
            const info = {
                minOrderPrice: Number(document.getElementById('min-order').value),
                pointsAwardRate: Number(document.getElementById('points-rate').value),
                showOffersOnHome: document.getElementById('show-offers').checked,

                supportPhoneNumber: document.getElementById('support-phone').value,
                supportWhatsAppNumber: document.getElementById('support-whatsapp').value,
                supportEmail: document.getElementById('support-email').value,

                // Legacy keys
                phone: document.getElementById('support-phone').value,
                whatsapp: document.getElementById('support-whatsapp').value,
                email: document.getElementById('support-email').value
            };

            await updateSettings('general', info);
            showToast('Configuration saved successfully');
        } catch (error) {
            console.error(error);
            showToast('Failed to save', 'error');
        } finally {
            hideLoading(btnId);
        }
    });
}

// --- Notification Sending ---
if (notifForm) {
    notifForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnId = 'send-notif-btn';

        const title = document.getElementById('notif-title').value.trim();
        const message = document.getElementById('notif-message').value.trim();
        const type = document.getElementById('notif-type').value;

        if (!title || !message) {
            showToast('Please fill all fields', 'error');
            return;
        }

        if (confirm("Send this notification to ALL users?")) {
            try {
                showLoading(btnId);
                await sendBroadcastNotification({ title, message, type });
                showToast('Notification sent successfully!');
                notifForm.reset();
                loadNotifications(); // Refresh list
            } catch (error) {
                console.error(error);
                showToast('Failed to send: ' + error.message, 'error');
            } finally {
                hideLoading(btnId);
            }
        }
    });
}

// --- Notification History ---

const notifList = document.getElementById('notifications-list');

const loadNotifications = async () => {
    if (!notifList) return;

    try {
        const { getRecentBroadcastNotifications } = await import('../../firebase/db.js');
        const notifs = await getRecentBroadcastNotifications(10);

        if (notifs.length === 0) {
            notifList.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">No history found.</p>';
            return;
        }

        notifList.innerHTML = notifs.map(n => `
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-start group">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${n.type === 'error' ? 'bg-red-100 text-red-600' : n.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}">${n.type || 'info'}</span>
                        <span class="text-[10px] text-gray-400">${new Date(n.sentAt).toLocaleDateString()}</span>
                    </div>
                    <p class="text-xs font-bold text-gray-800">${n.title}</p>
                    <p class="text-xs text-gray-500 line-clamp-1">${n.message}</p>
                </div>
                <button onclick="deleteNotif('${n.id}')" class="text-gray-400 hover:text-red-500 p-1 active:scale-90 transition-transform">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        notifList.innerHTML = '<p class="text-xs text-red-400 text-center">Failed to load history.</p>';
    }
};

window.deleteNotif = async (id) => {
    if (!confirm("Are you sure? This will remove it from history (users who already received it may still have it locally).")) return;

    try {
        const { deleteBroadcastNotification } = await import('../../firebase/db.js');
        await deleteBroadcastNotification(id);
        showToast("Notification deleted");
        loadNotifications();
    } catch (error) {
        showToast("Delete failed: " + error.message, 'error');
    }
};

if (notifForm) {
    // Reload list after sending
    const originalSubmit = notifForm.onsubmit;
    // ... attaching to existing listener is tricky if anonymous.
    // simpler: just call loadNotifications in the existing listener.
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadBanners();
    loadGeneralSettings();
    loadNotifications();
});
