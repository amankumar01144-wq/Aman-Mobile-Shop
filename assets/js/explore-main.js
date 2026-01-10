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

const renderProducts = (products) => {
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

    resultsContainer.innerHTML = products.map(p => `
        <a href="product.html?id=${p.id}" class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 active:scale-95 transition-transform block">
            <div class="bg-gray-50 rounded-xl h-32 w-full mb-3 flex items-center justify-center relative overflow-hidden group">
                <img src="${p.image || (p.imageUrls && p.imageUrls[0]) || 'https://via.placeholder.com/150'}" class="w-full h-full object-contain mix-blend-multiply p-2">
                ${p.mrp && p.mrp > p.price ?
            `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        -${Math.round(((p.mrp - p.price) / p.mrp) * 100)}%
                    </span>` : ''
        }
                <button onclick="event.preventDefault(); window.toggleWishExplore('${p.id}', this)" class="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all z-20">
                     <i class="${isInWishlist(p.id) ? 'fas text-red-500' : 'far text-gray-400'} fa-heart text-xs"></i>
                </button>
            </div>
            <div class="bg-gray-50 text-[10px] text-gray-500 px-2 py-0.5 rounded w-max mb-1 uppercase font-bold tracking-wide">${p.category}</div>
            <h3 class="font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-snug min-h-[2.5rem]">${p.name}</h3>
            
            <div class="flex items-center justify-between mt-1">
                <div class="flex flex-col">
                    <span class="font-bold text-blue-600 text-sm">${formatCurrency(p.price)}</span>
                    ${p.mrp ? `<span class="text-[10px] text-gray-400 line-through">${formatCurrency(p.mrp)}</span>` : ''}
                </div>
                <button class="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:bg-blue-600 active:text-white transition-colors">
                    <i class="fas fa-plus text-xs"></i>
                </button>
            </div>
        </a>
    `).join('');
};

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
        // Trigger same logic
        searchInput.value = e.target.value; // Sync with mobile input if needed, or just run logic
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

document.addEventListener('DOMContentLoaded', loadProducts);
