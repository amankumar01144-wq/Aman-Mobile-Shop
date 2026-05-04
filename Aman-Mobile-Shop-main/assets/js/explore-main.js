import { db } from '../../firebase/firebase-config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency, showToast, toggleWishlist, isInWishlist } from './utils.js';

const resultsContainer = document.getElementById('explore-results');
const searchInput = document.getElementById('explore-search');
const resultsTitle = document.getElementById('results-title');
const resultsCount = document.getElementById('results-count');

let allProducts = [];

const loadProducts = async () => {
    try {
        const snap = await getDocs(collection(db, "products"));
        allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(allProducts);
    } catch (error) {
        showToast("Error loading products", "error");
        console.error(error);
    }
};

let currentFilteredProducts = []; // Track for re-renders

const renderProducts = (products) => {
    currentFilteredProducts = products;
    resultsCount.innerText = `${products.length} items`;

    if (products.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-span-2 text-center py-10">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-search text-gray-400 text-xl"></i>
                </div>
                <p class="text-gray-500 text-sm">No items found.</p>
            </div>
        `;
        return;
    }

    const cart = getLocalCart();

    resultsContainer.innerHTML = products.map(p => {
        const cartItem = cart.find(i => i.id === p.id);
        const qty = cartItem ? cartItem.qty : 0;

        return `
            <div class="bg-white rounded-[2.5rem] p-3 product-card-shadow border border-gray-100 flex flex-col justify-between h-full relative group active:scale-[0.98] transition-all" onclick="window.location.href='product.html?id=${p.id}'">
                
                <!-- Wishlist Icon -->
                <button class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md active:scale-90 transition-all" onclick="event.stopPropagation(); window.toggleWishExplore('${p.id}', this)">
                    <i class="${isInWishlist(p.id) ? 'fas text-red-500' : 'far text-gray-400'} fa-heart text-xs"></i>
                </button>

                <!-- Image Section -->
                <div class="relative h-44 rounded-[2rem] overflow-hidden bg-[#f8f8f8] mb-4 flex items-center justify-center">
                    <img src="${p.image || (p.imageUrls && p.imageUrls[0]) || 'https://via.placeholder.com/300'}" class="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply p-2 group-hover:scale-110 transition-transform duration-700">
                    ${p.mrp && p.mrp > p.price ?
                        `<div class="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
                            -${Math.round(((p.mrp - p.price) / p.mrp) * 100)}%
                        </div>` : ''
                    }
                </div>

                <!-- Content Section -->
                <div class="flex-1 flex flex-col px-1">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">${p.name}</h3>
                    </div>
                    
                    <!-- Rating -->
                    <div class="flex items-center gap-1 mb-3">
                        <div class="flex text-orange-400 text-[10px]">
                            <i class="fas fa-star"></i>
                        </div>
                        <span class="text-[10px] font-bold text-gray-500">4.5</span>
                    </div>

                    <div class="mt-auto">
                        <div class="flex items-baseline gap-1.5 mb-4">
                             <span class="text-lg font-black text-gray-900">${formatCurrency(p.price)}</span>
                             ${p.mrp && p.mrp > p.price ? `<span class="text-xs text-gray-400 line-through font-medium">${formatCurrency(p.mrp)}</span>` : ''}
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-2 mb-1">
                            ${qty > 0 ? `
                                <div class="flex-1 flex items-center justify-between bg-gray-100 rounded-2xl px-3 py-2.5">
                                    <button onclick="event.stopPropagation(); window.changeExploreQty('${p.id}', -1)" class="text-gray-500 hover:text-gray-900 transition-colors"><i class="fas fa-minus text-[10px]"></i></button>
                                    <span class="text-xs font-bold text-gray-900">${qty}</span>
                                    <button onclick="event.stopPropagation(); window.changeExploreQty('${p.id}', 1)" class="text-gray-500 hover:text-gray-900 transition-colors"><i class="fas fa-plus text-[10px]"></i></button>
                                </div>
                                <button onclick="event.stopPropagation(); window.location.href='cart.html'" 
                                    class="w-11 h-11 bg-gray-900 text-white rounded-2xl active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-gray-200">
                                    <i class="fas fa-shopping-cart text-sm"></i>
                                </button>
                            ` : `
                                <button onclick="event.stopPropagation(); window.addToCartExplore('${p.id}')" 
                                    class="w-11 h-11 bg-gray-900 text-white rounded-2xl active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-gray-200 ml-auto">
                                    <i class="fas fa-plus text-sm"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

window.addEventListener('cartUpdated', () => {
    if (currentFilteredProducts.length > 0) {
        renderProducts(currentFilteredProducts);
    }
});

window.filterExplore = (category) => {
    resultsTitle.innerText = category === 'all' ? 'Discover' : category.charAt(0).toUpperCase() + category.slice(1);

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
        renderProducts(filtered);
    }
};

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
    resultsTitle.innerText = term ? `Search: "${term}"` : 'Discover';
    renderProducts(filtered);
});

const desktopSearch = document.getElementById('desktop-search-input');
if (desktopSearch) {
    desktopSearch.addEventListener('input', (e) => {
        searchInput.value = e.target.value;
        searchInput.dispatchEvent(new Event('input'));
    });
}

window.toggleWishExplore = (id, btn) => {
    const added = toggleWishlist(id);
    const icon = btn.querySelector('i');
    if (added) {
        icon.classList.remove('far', 'text-gray-400');
        icon.classList.add('fas', 'text-red-500');
    } else {
        icon.classList.remove('fas', 'text-red-500');
        icon.classList.add('far', 'text-gray-400');
    }
};

window.changeExploreQty = (id, delta) => {
    let cart = getLocalCart();
    const itemIndex = cart.findIndex(i => i.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].qty += delta;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
        setLocalCart(cart);
    }
};

window.addToCartExplore = (id) => {
    const item = allProducts.find(p => p.id === id);
    if (!item) return;

    let cart = getLocalCart();
    const existing = cart.find(i => i.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            mrp: item.mrp || item.price,
            image: item.imageUrl || item.image || (item.imageUrls && item.imageUrls[0]),
            qty: 1
        });
    }

    setLocalCart(cart);
    showToast(`Added ${item.name} to cart`);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    // Header Scroll Effect
    const main = document.querySelector('main');
    const header = document.querySelector('header.md\\:hidden');
    if (main && header) {
        main.addEventListener('scroll', () => {
            if (main.scrollTop > 40) {
                header.classList.add('collapsed-header');
            } else {
                header.classList.remove('collapsed-header');
            }
        });
    }
});

import { getLocalCart, setLocalCart } from './utils.js';
