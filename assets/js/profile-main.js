import { onAuthChange, getUserProfile, logoutUser, isAdmin } from '../../firebase/auth.js';
import { showToast } from './utils.js';

// Elements
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profilePhone = document.getElementById('profile-phone');
const userAvatarIcon = document.getElementById('user-avatar-icon');
const userAvatarImg = document.getElementById('user-avatar-img');
const logoutBtn = document.getElementById('logout-btn');
const adminPanelLink = document.getElementById('admin-panel-link');
const editProfileBtn = document.getElementById('edit-profile-btn');

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'login.html'; // Or show login screen
        return;
    }

    // Basic Info
    profileEmail.textContent = user.email;
    profileName.textContent = user.displayName || 'ShopMax User';

    // Fetch Full Profile
    try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
            profileName.textContent = profile.name || user.displayName || 'ShopMax User';
            profilePhone.textContent = profile.phone || '';
            if (profile.address) {
                // Maybe show address summary or leave for Address page
            }
        }

        // Check Admin
        const admin = await isAdmin(user.uid);
        if (admin && adminPanelLink) {
            adminPanelLink.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Error loading profile:", error);
    }
});

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await logoutUser();
            window.location.href = 'index.html';
        } catch (error) {
            showToast('Error logging out', 'error');
        }
    });
}

// Edit Profile (Placeholder)
if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        showToast("Edit Profile feature coming soon!", "info");
    });
}
