import { onAuthChange, getUserProfile } from '../../firebase/auth.js';
import { createOrder, getSettings } from '../../firebase/db.js';
import {
    getLocalCart,
    clearLocalCart,
    formatCurrency,
    showToast,
    showLoading,
    hideLoading
} from './utils.js';

// --- DOM ---
const userName = document.getElementById('user-name');
const userAddress = document.getElementById('user-address');
const userPhone = document.getElementById('user-phone');
const subtotalEl = document.getElementById('subtotal');
const finalTotalEl = document.getElementById('final-total');
const placeOrderBtn = document.getElementById('place-order-btn');
if (!placeOrderBtn) console.error("Place Order Button not found!");
const successOverlay = document.getElementById('success-overlay');

// Device Inputs
const deviceSection = document.getElementById('device-details-section');
const deviceBrand = document.getElementById('device-brand');
const deviceModel = document.getElementById('device-model');
const deviceIssue = document.getElementById('device-issue');

// --- STATE ---
let currentUser = null;
let profileData = null;
let cart = [];
let isPlacingOrder = false;

// --- CART ---
const refreshCartState = () => {
    cart = getLocalCart();
    if (!cart || cart.length === 0) {
        window.location.replace('index.html');
        return false;
    }
    calculateTotals();
    checkServiceItems();
    return true;
};

const checkServiceItems = () => {
    const hasService = cart.some(item => item.type === 'service');
    if (hasService && deviceSection) {
        deviceSection.classList.remove('hidden');
    } else if (deviceSection) {
        deviceSection.classList.add('hidden');
    }
};

const calculateTotals = () => {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    subtotalEl.textContent = formatCurrency(total);
    finalTotalEl.textContent = formatCurrency(total);
};

// --- PROFILE ---
const loadUserProfile = async (user) => {
    try {
        const profile = await getUserProfile(user.uid);
        profileData = profile || null;

        userName.textContent =
            profile?.name || user.displayName || 'User';

        if (profile?.address) {
            userAddress.textContent = profile.address;
            userAddress.classList.remove('text-red-500', 'font-bold');
        } else {
            userAddress.textContent = 'Add delivery address';
            userAddress.classList.add('text-red-500', 'font-bold');
        }

        userPhone.textContent = profile?.phone || '';
    } catch (err) {
        console.error(err);
        showToast('Failed to load profile', 'error');
    }
};

// --- INIT ---
const initCheckout = () => {
    if (!refreshCartState()) return;

    onAuthChange(async (user) => {
        if (!user) {
            window.location.replace('login.html');
            return;
        }
        currentUser = user;
        await loadUserProfile(user);
    });
};

// --- PLACE ORDER ---
placeOrderBtn.addEventListener('click', async () => {
    // Debug: Check button click
    console.log("Place Order Clicked");

    if (isPlacingOrder) return;
    if (!refreshCartState()) {
        console.warn("Cart is empty or invalid state");
        return;
    }
    if (!currentUser) {
        console.warn("User not logged in");
        showToast("Please login to continue", "info");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    isPlacingOrder = true;
    placeOrderBtn.disabled = true;

    try {
        showLoading('place-order-btn');

        // 0. Check Minimum Order
        const settings = await getSettings('general');
        const minOrder = settings?.minOrderPrice || 0;
        const currentTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

        if (currentTotal < minOrder) {
            showToast(`Minimum order amount is ${formatCurrency(minOrder)}`, 'error');
            return;
        }

        // 1. Robust Profile Check
        // If address is missing, force a re-fetch to ensure we have latest data
        if (!profileData || !profileData.address) {
            console.log("Address check failed, re-fetching profile...");
            await loadUserProfile(currentUser);
        }

        // 1.5 Validate Device Details (if service in cart)
        if (cart.some(item => item.type === 'service')) {
            if (!deviceBrand.value.trim() || !deviceModel.value.trim()) {
                showToast('Please provide device brand and model', 'info');
                return;
            }
        }

        // 2. Validate Address
        // Check for non-empty string explicitly
        if (!profileData || !profileData.address || typeof profileData.address !== 'string' || profileData.address.trim() === '') {
            console.warn("Address Validation Failed:", profileData);
            showToast('Please add a delivery address', 'info');
            setTimeout(() => window.location.href = 'address.html', 1000);
            return; // Stop execution
        }

        // 3. Payment Method
        const paymentInput = document.querySelector('input[name="payment"]:checked');
        if (!paymentInput) {
            showToast('Select payment method', 'info');
            return;
        }

        const totalItemsPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

        // 4. Construct Order Data
        const orderData = {
            userId: currentUser.uid,
            items: cart.map(i => ({
                id: i.id,
                title: i.name || i.title || 'Unknown Product', // Fallback for safety
                price: i.price,
                qty: i.qty,
                image: i.image || '',
                type: i.type || 'product' // Persist type for admin filtering
            })),
            customerInfo: {
                name: profileData.name || currentUser.displayName || 'Guest',
                address: profileData.address,
                phone: profileData.phone || '',
                email: currentUser.email
            },
            deviceInfo: cart.some(item => item.type === 'service') ? {
                brand: deviceBrand.value,
                model: deviceModel.value,
                issue: deviceIssue.value
            } : null,
            summary: {
                subTotal: totalItemsPrice,
                delivery: 0,
                finalTotal: totalItemsPrice
            },
            paymentMethod: paymentInput.value,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            pointsAwarded: Math.floor(totalItemsPrice * (settings?.pointsAwardRate || 0)) // Calculate Points
        };

        console.log("Creating Order:", orderData);

        // 5. Send to Firebase
        const orderId = await createOrder(orderData);

        if (orderId) {
            console.log("Order Created:", orderId);
            clearLocalCart();

            // Show success overlay
            if (successOverlay) successOverlay.classList.remove('hidden');

            setTimeout(() => {
                window.location.replace('orders.html');
            }, 2000);
        } else {
            throw new Error("Order creation returned no ID");
        }

    } catch (err) {
        console.error("Order Error:", err);
        showToast(err.message || 'Order failed. Please try again.', 'error');
    } finally {
        hideLoading('place-order-btn');
        placeOrderBtn.disabled = false;
        isPlacingOrder = false;
    }
});

// --- REFRESH FIX ---
const forceRefresh = () => {
    if (currentUser) {
        refreshCartState();
        loadUserProfile(currentUser);
    }
};

window.addEventListener('pageshow', forceRefresh);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') forceRefresh();
});

// START
initCheckout();
