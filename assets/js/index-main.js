import { getProducts, getSettings, getServices } from '../../firebase/db.js';
import { formatCurrency, showToast, toggleWishlist, isInWishlist, getLocalCart, setLocalCart } from './utils.js';

const productGrid = document.getElementById('product-grid');
// Sort select is removed from UI for now in mobile view, or we can add a filter button later.
let allProducts = [];
let allServices = []; // Store services globally

// Fetch and Render Products
const loadProducts = async () => {
    try {
        productGrid.innerHTML = `
            <div class="col-span-2 grid grid-cols-2 gap-3">
                ${Array(4).fill(0).map(() => `
                    <div class="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <div class="skeleton h-32 w-full rounded-xl mb-3"></div>
                        <div class="skeleton h-3 w-3/4 rounded mb-2"></div>
                        <div class="skeleton h-3 w-1/2 rounded"></div>
                    </div>
                `).join('')}
            </div>
        `;

        allProducts = await getProducts();
        renderProducts(allProducts);
    } catch (error) {
        console.error("CRITICAL: Failed to load products.", error);
        productGrid.innerHTML = `<div class="col-span-2 text-center text-red-500 text-sm py-10">
            <p>Failed to load content.</p>
            <p class="text-xs text-gray-400 mt-1">${error.message}</p>
        </div>`;
    }
};

const renderProducts = (products) => {
    if (products.length === 0) {
        productGrid.innerHTML = `<div class="col-span-2 text-center py-10 text-gray-400 text-sm">No items found.</div>`;
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <div class="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-col justify-between h-full relative" onclick="window.location.href='${product.type === 'service' ? 'book-service.html?id=' + product.id : 'product.html?id=' + product.id}'">
            
            <!-- Wishlist Icon -->
            <button class="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm active:scale-95 transition-all" onclick="event.stopPropagation(); window.toggleWishHome('${product.id}', this)">
                <i class="${isInWishlist(product.id) ? 'fas text-red-500' : 'far text-gray-400'} fa-heart text-xs"></i>
            </button>

            <div class="relative h-36 rounded-xl overflow-hidden bg-gray-50 mb-2">
                <img src="${product.imageUrl || product.image || (product.imageUrls && product.imageUrls[0]) || 'https://via.placeholder.com/300'}" alt="${product.name}" class="w-full h-full object-contain mix-blend-multiply p-2">
                ${product.mrp && product.price < product.mrp ? `
                    <span class="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">${Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF</span>
                ` : ''}
            </div>

            <div class="flex-1 flex flex-col">
                <div class="text-[10px] text-gray-400 mb-0.5 uppercase font-semibold tracking-wide truncate">${product.category || 'Product'}</div>
                <h3 class="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5em]">${product.name}</h3>
                
                <div class="mt-auto">
                    <div class="flex items-center gap-1.5 mb-2">
                         <span class="text-base font-bold text-gray-900">₹${product.price}</span>
                         ${product.mrp && product.price < product.mrp ? `
                            <span class="text-xs text-gray-400 line-through">₹${product.mrp}</span>
                         ` : ''}
                    </div>

                    <button onclick="${product.type === 'service' ? `event.stopPropagation(); window.addToCartService('${product.id}')` : `event.stopPropagation(); window.location.href='product.html?id=${product.id}'`}" class="w-full py-2 ${product.type === 'service' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600 border border-blue-200'} rounded-lg text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1">
                        ${product.type === 'service' ? '<i class="fas fa-cart-plus"></i> Add' : '<i class="fas fa-plus"></i> Add'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

window.loadServices = async () => {
    // UI Update
    document.querySelectorAll('.category-btn div').forEach(div => {
        div.className = "w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-transform active:scale-95 shadow-sm";
        div.querySelector('i').classList.remove('text-orange-500', 'text-white', 'text-blue-600');
        div.querySelector('i').classList.add('text-gray-600');
    });

    const activeBtn = document.querySelector(`.category-btn[data-category="services"] div`);
    if (activeBtn) {
        activeBtn.className = "w-14 h-14 rounded-full bg-orange-50 border-2 border-orange-500 flex items-center justify-center transition-transform active:scale-95";
        activeBtn.querySelector('i').classList.remove('text-gray-600');
        activeBtn.querySelector('i').classList.add('text-orange-500');
    }

    productGrid.innerHTML = `
        <div class="col-span-2 text-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p class="text-xs text-gray-500">Loading Services...</p>
        </div>
    `;

    const services = await getServices();
    allServices = services; // Store for cart lookup
    const mappedServices = services.map(s => ({
        ...s,
        category: 'Service',
        type: 'service',
        rating: 5
    }));

    renderProducts(mappedServices);
};

// Filtering
window.filterCategory = (category) => {
    // UI Update - Reset all
    document.querySelectorAll('.category-btn div').forEach(div => {
        div.className = "w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-transform active:scale-95 shadow-sm";
        div.querySelector('i').classList.remove('text-blue-600', 'text-white');
        div.querySelector('i').classList.add('text-gray-600');
    });

    // Set Active
    const activeBtn = document.querySelector(`.category-btn[data-category="${category}"] div`);
    if (activeBtn) {
        activeBtn.className = "w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center transition-transform active:scale-95";
        activeBtn.querySelector('i').classList.remove('text-gray-600');
        activeBtn.querySelector('i').classList.add('text-blue-600');
    }

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category && p.category.toLowerCase() === category);
        renderProducts(filtered);
    }
};

// Search
const searchInput = document.getElementById('search-input');
const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
};

if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

// Banner Logic
const loadBanners = async () => {
    const container = document.getElementById('home-banner-container');
    const indicators = document.getElementById('banner-indicators');
    if (!container) return;

    try {
        let banners = [];
        const generalSettings = await getSettings('general');

        // 1. Marketing Banners (Only if Show Offers is ON)
        if (!generalSettings || generalSettings.showOffersOnHome !== false) {
            // Try fetching rich banners
            const bannerSettings = await getSettings('home_banners');
            if (bannerSettings && bannerSettings.banners && bannerSettings.banners.length > 0) {
                banners = bannerSettings.banners;
            } else if (generalSettings && generalSettings.bannerImageUrl) {
                // Fallback
                banners = [{ image: generalSettings.bannerImageUrl, filename: 'Featured' }];
            }
        }

        // 2. Inject Repair Banner (Always show)
        banners.push({
            image: 'assets/images/repair_banner.png',
            onClick: "loadServices(); document.getElementById('category-section').scrollIntoView({behavior: 'smooth'});"
        });

        if (banners.length === 0) {
            container.closest('section').style.display = 'none';
            return;
        } else {
            container.closest('section').style.display = 'block';
        }

        // Render Carousel
        renderCarousel(banners, container, indicators);

    } catch (error) {
        console.error("Banner load error:", error);
    }
};

const renderCarousel = (banners, container, indicators) => {
    if (banners.length === 1) {
        container.innerHTML = `<img src="${banners[0].image}" class="w-full h-full object-cover">`;
        if (indicators) indicators.innerHTML = '';
        return;
    }

    let currentIndex = 0;

    // Images
    const slidesHtml = banners.map((b, i) => `
        <div class="absolute inset-0 transition-opacity duration-500 ease-in-out ${i === 0 ? 'opacity-100' : 'opacity-0'}" data-slide="${i}" 
            onclick="${b.onClick ? b.onClick : (b.link ? `window.location.href='${b.link}'` : '')}" 
            ${(b.link || b.onClick) ? 'style="cursor: pointer;"' : ''}>
            <img src="${b.image}" class="w-full h-full object-cover">
        </div>
    `).join('');
    container.innerHTML = slidesHtml;

    // Indicators
    if (indicators) {
        indicators.innerHTML = banners.map((_, i) => `
            <div class="w-1.5 h-1.5 rounded-full bg-white transition-opacity ${i === 0 ? 'opacity-100' : 'opacity-50'} shadow-sm" data-indicator="${i}"></div>
        `).join('');
    }

    // Auto Slide
    setInterval(() => {
        const slides = container.querySelectorAll('[data-slide]');
        const dots = indicators ? indicators.querySelectorAll('[data-indicator]') : [];

        // Hide Current
        slides[currentIndex].classList.remove('opacity-100');
        slides[currentIndex].classList.add('opacity-0');
        if (dots[currentIndex]) dots[currentIndex].classList.replace('opacity-100', 'opacity-50');

        // Next
        currentIndex = (currentIndex + 1) % banners.length;

        // Show Next
        slides[currentIndex].classList.remove('opacity-0');
        slides[currentIndex].classList.add('opacity-100');
        if (dots[currentIndex]) dots[currentIndex].classList.replace('opacity-50', 'opacity-100');

    }, 4000);
};

window.toggleWishHome = (id, btn) => {
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

// Sidebar
const openSidebar = () => {
    const overlay = document.getElementById('sidebar-overlay');
    const panel = document.getElementById('sidebar-panel');
    if (!overlay || !panel) return;

    overlay.classList.remove('hidden');
    // small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        panel.classList.remove('-translate-x-full');
    }, 10);
};

window.closeSidebar = () => {
    const overlay = document.getElementById('sidebar-overlay');
    const panel = document.getElementById('sidebar-panel');
    if (!overlay || !panel) return;

    overlay.classList.add('opacity-0');
    panel.classList.add('-translate-x-full');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
};

window.openSidebar = openSidebar; // Keep global for inline onclick backup

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadBanners();

    // Bind Menu Button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', openSidebar);
    }
});

// Service Cart Logic
window.addToCartService = (id) => {
    const service = allServices.find(s => s.id === id);
    if (!service) return;

    let cart = getLocalCart();
    const existing = cart.find(i => i.id === id);

    if (existing) {
        showToast('Only 1 unit allowed per service', 'info');
        return;
    }

    cart.push({
        id: service.id,
        name: service.name,
        price: service.price,
        image: service.imageUrl || 'assets/images/repair_banner.png',
        qty: 1,
        type: 'service'
    });

    setLocalCart(cart);
    showToast('Service added to cart');

    // Update badge if exists (index logic usually handles this via event listener in index-main or main.js? let's check events)
    // cart-main.js dispatch 'cartUpdated'. index-main might need to listen or main.js does.
    // main.js usually updates the badge.
};
