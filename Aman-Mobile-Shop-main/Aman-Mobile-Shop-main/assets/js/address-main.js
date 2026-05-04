import { onAuthChange, getUserProfile } from '../../firebase/auth.js';
import { db } from '../../firebase/firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast, showLoading, hideLoading } from './utils.js';

const currentCard = document.getElementById('current-address-card');
const addrName = document.getElementById('addr-name');
const addrText = document.getElementById('addr-text');
const addrPhone = document.getElementById('addr-phone');
const modal = document.getElementById('address-modal');
const form = document.getElementById('address-form');
const inpName = document.getElementById('inp-name');
const inpAddr = document.getElementById('inp-address');
const inpPhone = document.getElementById('inp-phone');

let currentUser = null;

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    loadAddress(user.uid);
});

const loadAddress = async (uid) => {
    const profile = await getUserProfile(uid);
    if (profile && profile.address) {
        currentCard.classList.remove('hidden');
        addrName.innerText = profile.name || currentUser.displayName || 'User';
        addrText.innerText = profile.address;
        addrPhone.innerText = profile.phone || 'No phone';

        // Pre-fill form
        inpName.value = profile.name || currentUser.displayName || '';
        inpAddr.value = profile.address;
        inpPhone.value = profile.phone || '';
    } else {
        currentCard.classList.add('hidden');
    }
};

window.editAddress = () => {
    modal.classList.remove('hidden');
};

window.closeModal = () => {
    modal.classList.add('hidden');
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            name: inpName.value,
            address: inpAddr.value,
            phone: inpPhone.value
        }, { merge: true });
        showToast("Address saved successfully");
        closeModal();
        loadAddress(currentUser.uid);
    } catch (error) {
        showToast("Failed to save address", "error");
        console.error(error);
    }
});
