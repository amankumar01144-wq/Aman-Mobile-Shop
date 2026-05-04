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
                    <div class="bg-white p-3 rounded-[2.5rem] product-card-shadow border border-gray-100 h-80">
                        <div class="skeleton h-44 w-full rounded-[2rem] mb-4"></div>
                        <div class="skeleton h-4 w-3/4 rounded-full mb-3"></div>
                        <div class="skeleton h-4 w-1/2 rounded-full mb-6"></div>
                        <div class="flex gap-2">
                            <div class="skeleton h-10 flex-1 rounded-2xl"></div>
                            <div class="skeleton h-10 w-10 rounded-2xl"></div>
                        </div>
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

let currentFilteredProducts = []; // Track current view for re-renders

const renderProducts = (products) => {
    currentFilteredProducts = products;
    if (products.length === 0) {
        productGrid.innerHTML = `<div class="col-span-2 text-center py-10 text-gray-400 text-sm">No items found.</div>`;
        return;
    }

    // Group by category
    const grouped = products.reduce((acc, p) => {
        const cat = p.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {});

    const cart = getLocalCart();

    productGrid.innerHTML = Object.entries(grouped).map(([category, catProducts]) => `
        <div class="col-span-2 mb-6">
            <div class="flex items-center justify-between px-4 mb-3">
                <h2 class="text-[12px] font-black text-gray-900 uppercase tracking-wider">${category}</h2>
                <button class="text-[10px] font-bold text-[#0070bc]">See All</button>
            </div>
            <div class="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x">
                ${catProducts.map(product => {
        const cartItem = cart.find(i => i.id === product.id);
        const qty = cartItem ? cartItem.qty : 0;
        return `
                        <div class="min-w-[150px] max-w-[150px] bg-white rounded-[2rem] p-2.5 product-card-shadow border border-gray-100 flex flex-col justify-between h-[280px] snap-start relative active:scale-95 transition-all" 
                            onclick="window.location.href='${product.type === 'service' ? 'book-service.html?id=' + product.id : 'product.html?id=' + product.id}'">
                            
                            <!-- Wishlist Icon -->
                            <button class="absolute top-3 right-3 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md active:scale-90 transition-all" onclick="event.stopPropagation(); window.toggleWishHome('${product.id}', this)">
                                <i class="${isInWishlist(product.id) ? 'fas text-red-500' : 'far text-gray-400'} text-[10px] fa-heart"></i>
                            </button>

                            <!-- Share Icon -->
                            <button class="absolute top-12 right-3 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md active:scale-90 transition-all" 
                                onclick="event.stopPropagation(); window.shareProduct('${product.id}')">
                                <i class="fas fa-share-nodes text-[10px] text-gray-500"></i>
                            </button>

                            <!-- Image Section -->
                            <div class="relative h-32 rounded-[1.5rem] overflow-hidden bg-[#f8f8f8] mb-2 flex items-center justify-center">
                                <img src="${product.imageUrl || product.image || (product.imageUrls && product.imageUrls[0]) || 'https://via.placeholder.com/300'}" alt="${product.name}" class="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply p-1">
                                
                                ${product.mrp && product.price < product.mrp ? `
                                    <div class="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                        -${Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Content Section -->
                            <div class="flex-1 flex flex-col px-0.5">
                                <h3 class="font-bold text-gray-900 text-[11px] leading-tight line-clamp-2 min-h-[1.5rem] mb-1">${product.name}</h3>
                                
                                <!-- Rating -->
                                <div class="flex items-center gap-1 mb-2">
                                    <div class="flex text-orange-400 text-[8px]">
                                        <i class="fas fa-star"></i>
                                    </div>
                                    <span class="text-[8px] font-bold text-gray-500">4.5</span>
                                </div>

                                <div class="mt-auto">
                                    <div class="flex items-baseline gap-1 mb-2">
                                         <span class="text-sm font-black text-gray-900">₹${product.price}</span>
                                         ${product.mrp && product.price < product.mrp ? `
                                            <span class="text-[9px] text-gray-400 line-through font-medium">₹${product.mrp}</span>
                                         ` : ''}
                                    </div>

                                    <!-- Actions -->
                                    <div class="flex items-center gap-1.5 mb-0.5">
                                        ${qty > 0 ? `
                                            <div class="flex-1 flex items-center justify-between bg-gray-100 rounded-xl px-2 py-1.5">
                                                <button onclick="event.stopPropagation(); window.changeHomeQty('${product.id}', -1)" class="text-gray-500"><i class="fas fa-minus text-[8px]"></i></button>
                                                <span class="text-[9px] font-bold text-gray-900">${qty}</span>
                                                <button onclick="event.stopPropagation(); window.changeHomeQty('${product.id}', 1)" class="text-gray-500"><i class="fas fa-plus text-[8px]"></i></button>
                                            </div>
                                            <button onclick="event.stopPropagation(); window.location.href='cart.html'" 
                                                class="w-8 h-8 bg-gray-900 text-white rounded-xl active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-gray-200 shrink-0">
                                                <i class="fas fa-shopping-cart text-[10px]"></i>
                                            </button>
                                        ` : `
                                            <button onclick="event.stopPropagation(); window.addToCartHome('${product.id}')" 
                                                class="w-full py-1.5 bg-gray-900 text-white rounded-xl active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-gray-200">
                                                <span class="text-[10px] font-bold">Add +</span>
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `).join('');
};

// Share Product Function
window.shareProduct = async (id) => {
    console.log('Sharing product:', id);
    // Find the item from our global product/service lists
    const item = allProducts.find(p => p.id === id) || allServices.find(s => s.id === id);
    
    const shareUrl = window.location.origin + `/product.html?id=${id}`;
    const shareTitle = item ? `Aman Mobile Shop - ${item.name}` : 'Aman Mobile Shop';
    const shareText = item ? `Check out this amazing deal on ${item.name} at Aman Mobile Shop!` : 'Check out this amazing deal at Aman Mobile Shop!';

    try {
        if (navigator.share) {
            await navigator.share({
                title: shareTitle,
                text: shareText,
                url: shareUrl
            });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
            showToast('Link copied to clipboard!');
        } else {
            // Last resort fallback
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('Link copied!');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            // Show a prompt as absolute fallback
            prompt('Copy this link to share:', shareUrl);
        }
    }
};

// Grab to Scroll for PC
const initGrabToScroll = () => {
    const sliders = document.querySelectorAll('.overflow-x-auto.scrollbar-hide');
    sliders.forEach(slider => {
        let isDown = false;
        let startDate;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            startDate = new Date();
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initGrabToScroll();
    // Re-run after products are rendered
    const observer = new MutationObserver(() => initGrabToScroll());
    const target = document.getElementById('product-grid');
    if (target) observer.observe(target, { childList: true });
});

window.loadServices = async () => {
    // UI Update
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`.category-btn[data-category="services"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
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
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Set Active
    const activeBtn = document.querySelector(`.category-btn[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category && p.category.toLowerCase() === category);
        renderProducts(filtered);
    }
};

// Search
const searchInput = document.getElementById('search-input-new');
const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
};

if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

const desktopSearch = document.getElementById('desktop-search-input');
if (desktopSearch) {
    desktopSearch.addEventListener('input', handleSearch);
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

        if (!slides.length) return;

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

// Mode Switching (Shop / Repair)
window.switchMode = (mode) => {
    const shopBtn = document.getElementById('toggle-shop');
    const repairBtn = document.getElementById('toggle-repair');

    if (mode === 'shop') {
        shopBtn.classList.add('bg-[#f7941d]', 'shadow-sm');
        repairBtn.classList.remove('bg-[#f7941d]', 'shadow-sm');
        filterCategory('all');
    } else {
        repairBtn.classList.add('bg-[#f7941d]', 'shadow-sm');
        shopBtn.classList.remove('bg-[#f7941d]', 'shadow-sm');
        loadServices();
    }
};

// Floating Cart Logic
const updateFloatingCart = () => {
    const cart = getLocalCart();
    const floatingCart = document.getElementById('floating-cart');
    const cartImg = document.getElementById('floating-cart-img');
    const cartText = document.getElementById('floating-cart-text');
    const cartSavings = document.getElementById('floating-cart-savings');

    if (!floatingCart) return;

    if (cart.length > 0) {
        const count = cart.reduce((acc, item) => acc + item.qty, 0);
        const totalSavings = cart.reduce((acc, item) => {
            if (item.mrp && item.mrp > item.price) {
                return acc + ((item.mrp - item.price) * item.qty);
            }
            return acc;
        }, 0);

        cartText.textContent = `${count} item${count > 1 ? 's' : ''}`;

        if (totalSavings > 0) {
            cartSavings.textContent = `You save ₹${totalSavings}`;
            cartSavings.classList.remove('hidden');
        } else {
            cartSavings.classList.add('hidden');
        }

        // Use the last added item's image for the floating cart icon
        const lastItem = cart[cart.length - 1];
        if (cartImg && lastItem.image) {
            cartImg.src = lastItem.image;
        }

        floatingCart.classList.remove('translate-y-full');
    } else {
        floatingCart.classList.add('translate-y-full');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadBanners();
    updateFloatingCart();

    // Bind Menu Button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', openSidebar);
    }

    window.addEventListener('cartUpdated', () => {
        updateFloatingCart();
        if (currentFilteredProducts.length > 0) {
            renderProducts(currentFilteredProducts);
        }
    });

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

window.changeHomeQty = (id, delta) => {
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

// Generic Add to Cart from Home
window.addToCartHome = (id) => {
    // Check products first, then services
    const item = allProducts.find(p => p.id === id) || allServices.find(s => s.id === id);
    if (!item) return;

    let cart = getLocalCart();
    const existing = cart.find(i => i.id === id);

    if (existing) {
        if (item.type === 'service') {
            showToast('Only 1 unit allowed per service', 'info');
            return;
        }
        existing.qty += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            mrp: item.mrp || item.price,
            image: item.imageUrl || item.image || (item.imageUrls && item.imageUrls[0]) || 'assets/images/repair_banner.png',
            qty: 1,
            type: item.type || 'product'
        });
    }

    setLocalCart(cart);
    showToast(`Added ${item.name} to cart`);
};

window.addToCartService = (id) => {
    window.addToCartHome(id);
};
