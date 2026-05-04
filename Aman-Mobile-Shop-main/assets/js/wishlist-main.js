import { db } from '../../firebase/firebase-config.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthChange } from '../../firebase/auth.js';
import { formatCurrency, showToast, getWishlist, toggleWishlist } from './utils.js';

const wishlistGrid = document.getElementById('wishlist-grid');
const emptyState = document.getElementById('empty-state');

// Mock Wishlist ID storage (LocalStorage for MVP)

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    loadWishlist();
});

const loadWishlist = async () => {
    const wishids = getWishlist();

    if (wishids.length === 0) {
        wishlistGrid.style.display = 'none';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }

    try {
        // Fetch product details for these IDs
        // In real app, querying 'in' array or fetching individual docs
        const promises = wishids.map(id => getDoc(doc(db, "products", id)));
        const snapshots = await Promise.all(promises);
        const products = snapshots.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));

        renderWishlist(products);
    } catch (e) {
        console.error(e);
        showToast("Error loading wishlist");
    }
};

const renderWishlist = (products) => {
    if (products.length === 0) {
        wishlistGrid.style.display = 'none';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }

    wishlistGrid.innerHTML = products.map(p => `
         <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative">
            <button onclick="removeFromWishlist('${p.id}')" class="absolute top-2 right-2 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center z-10">
                <i class="fas fa-times text-xs"></i>
            </button>
            <div class="bg-gray-50 rounded-xl h-32 w-full mb-3 flex items-center justify-center relative overflow-hidden">
                <img src="${p.image || (p.imageUrls && p.imageUrls[0]) || 'https://via.placeholder.com/150'}" class="w-full h-full object-contain mix-blend-multiply p-2">
            </div>
            <h3 class="font-bold text-gray-800 text-sm mb-1 line-clamp-1">${p.name}</h3>
            <span class="font-bold text-blue-600 text-sm">${formatCurrency(p.price)}</span>
            <button onclick="window.location.href='product.html?id=${p.id}'" class="mt-2 w-full bg-blue-50 text-blue-600 text-xs font-bold py-2 rounded-lg">View</button>
        </div>
    `).join('');
};

window.removeFromWishlist = (id) => {
    // Toggle will remove if exists
    toggleWishlist(id);
    // Reload UI
    loadWishlist();
};


