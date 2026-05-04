import { getProductById } from '../../firebase/db.js';

import { formatCurrency, showToast, getLocalCart, setLocalCart, toggleWishlist, isInWishlist } from './utils.js';

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

const productContainer = document.getElementById('product-container');
const qtyInput = document.getElementById('qty-input');
let currentProduct = null;
let currentQty = 1;

const loadProduct = async () => {
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        currentProduct = await getProductById(productId);

        if (!currentProduct) {
            productContainer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400">Product not found.</div>`;
            return;
        }

        renderProductDetails(currentProduct);
    } catch (error) {
        console.error(error);
        productContainer.innerHTML = `<div class="flex items-center justify-center h-full text-red-500">Error loading product.</div>`;
    }
};

const renderProductDetails = (product) => {
    document.title = product.name;

    // Calculate Discount
    const discountPercentage = (product.mrp && product.price < product.mrp)
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    // Main Image Logic (Simple Slider for now: just main image + scrollable thumbnails if any)
    const mainImage = product.image || (product.imageUrls && product.imageUrls[0]) || 'https://via.placeholder.com/600';

    productContainer.innerHTML = `
        <!-- Image Area -->
        <div class="relative bg-white mb-4">
            <div class="h-[400px] w-full bg-gray-50 flex items-center justify-center overflow-hidden relative">
                <img id="display-image" src="${mainImage}" class="w-full h-full object-contain mix-blend-multiply p-4">
                <button onclick="toggleWish('${product.id}')" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center transition-transform active:scale-95 z-20">
                    <i id="wish-icon" class="${isInWishlist(product.id) ? 'fas text-red-500' : 'far text-gray-400'} fa-heart text-xl"></i>
                </button>
            </div>
            ${product.imageUrls && product.imageUrls.length > 1 ? `
                <div class="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-hide absolute bottom-4 left-0 w-full">
                    ${product.imageUrls.map(url => `
                        <button onclick="changeImage('${url}')" class="w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm active:scale-95 transition-transform">
                            <img src="${url}" class="w-full h-full object-cover">
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <!-- Info Area -->
        <div class="px-4 pb-4 bg-white rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] -mt-6 relative z-10 pt-6">
            <div class="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            
            <div class="mb-1 text-xs font-bold text-blue-600 uppercase tracking-widest">${product.category || 'Product'}</div>
            <h1 class="text-xl font-bold text-gray-800 leading-snug mb-2">${product.name}</h1>

            <div class="flex items-end gap-3 mb-4 border-b border-gray-100 pb-4">
                <span class="text-3xl font-bold text-gray-900">${formatCurrency(product.price)}</span>
                ${product.mrp && product.price < product.mrp ? `
                    <span class="text-lg text-gray-400 line-through mb-1">${formatCurrency(product.mrp)}</span>
                    <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold mb-2">
                        ${discountPercentage}% OFF
                    </span>
                ` : ''}
            </div>

            <div class="mb-6">
                <h3 class="font-bold text-gray-800 mb-2">Description</h3>
                <p class="text-sm text-gray-600 leading-relaxed">
                    ${product.description || 'No description available for this product.'}
                </p>
            </div>

            <!-- Features -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-truck text-xs"></i></div>
                    <span class="text-xs font-medium text-gray-600">Free Delivery</span>
                </div>
                <div class="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-undo text-xs"></i></div>
                    <span class="text-xs font-medium text-gray-600">7 Day Return</span>
                </div>
            </div>

             <!-- Reviews Preview -->
             <div class="mb-8">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-gray-800">Reviews (120)</h3>
                    <div class="flex text-yellow-500 text-xs">
                         <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><div class="text-gray-300 ml-1">4.5</div>
                    </div>
                </div>
                <!-- Mock Review -->
                <!-- Mock Review -->
                <!-- Mock Review -->
                 <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div class="flex gap-2 mb-2">
                        <div class="w-6 h-6 bg-gray-300 rounded-full"></div>
                        <span class="text-xs font-bold text-gray-700 pt-1">Aman Kumar</span>
                    </div>
                    <p class="text-xs text-gray-600">"This product is really amazing. Loved the quality!"</p>
                 </div>
             </div>

             <!-- PID: Action Buttons (Desktop Visible) -->
             <div class="hidden md:flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button id="desktop-add-cart-btn" class="flex-1 bg-blue-50 text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button id="desktop-buy-now-btn" class="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]">
                    Buy Now
                </button>
             </div>
        </div>
    `;

    // Attach Desktop Listeners
    setTimeout(() => {
        const dAddBtn = document.getElementById('desktop-add-cart-btn');
        const dBuyBtn = document.getElementById('desktop-buy-now-btn');

        if (dAddBtn) {
            dAddBtn.addEventListener('click', () => addToCart(product, 1));
        }
        if (dBuyBtn) {
            dBuyBtn.addEventListener('click', () => {
                addToCart(product, 1);
                window.location.href = 'cart.html';
            });
        }
    }, 0);

    // Global func for image switch
    window.changeImage = (url) => {
        document.getElementById('display-image').src = url;
    };

    window.toggleWish = (id) => {
        const added = toggleWishlist(id);
        const icon = document.getElementById('wish-icon');
        if (added) {
            icon.classList.remove('far', 'text-gray-400');
            icon.classList.add('fas', 'text-red-500');
        } else {
            icon.classList.remove('fas', 'text-red-500');
            icon.classList.add('far', 'text-gray-400');
        }
    };
};

// Footer Action Listeners
document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    // Simple Qty 1 for "Add" button, or use the input if we decide to show it.
    // Logic: If item is not in cart, add with qty 1. If in cart, maybe open cart or increment?
    // Let's stick to standard behavior: Add 1.
    addToCart(currentProduct, 1);
});

document.getElementById('buy-now-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    addToCart(currentProduct, 1);
    window.location.href = 'cart.html';
});

const addToCart = (product, qty) => {
    let cart = getLocalCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.discountPrice || product.price,
            image: product.image || (product.imageUrls && product.imageUrls[0]),
            qty: qty
        });
    }

    setLocalCart(cart);
    showToast(`${qty} item added!`);

    // Trigger event for navbar badge update
    window.dispatchEvent(new Event('cartUpdated'));
};

window.addToCart = addToCart; // Make global for inline clicks

loadProduct();
