import { db } from '../../../firebase/firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getProducts, addProduct } from '../../../firebase/db.js';
import { showToast, showLoading, hideLoading, formatCurrency } from '../utils.js';

const productsList = document.getElementById('products-list');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');

// Inputs
const pId = document.getElementById('product-id');
const pName = document.getElementById('p-name');
const pPrice = document.getElementById('p-price');
const pMrp = document.getElementById('p-mrp');
const pCategory = document.getElementById('p-category');
const pImage = document.getElementById('p-image');
const pDesc = document.getElementById('p-desc');

let allProducts = [];

const loadProducts = async () => {
    try {
        const snap = await getDocs(collection(db, "products"));
        allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(allProducts);
    } catch (error) {
        showToast("Error loading products", "error");
    }
};

const renderProducts = (products) => {
    if (products.length === 0) {
        productsList.innerHTML = `<p class="text-center text-gray-400 py-10">No products found.</p>`;
        return;
    }

    productsList.innerHTML = products.map(p => `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 relative">
            <div class="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                <img src="${p.image || (p.imageUrls && p.imageUrls[0]) || 'https://via.placeholder.com/100'}" class="w-full h-full object-contain p-1 mix-blend-multiply">
            </div>
            <div class="flex-1">
                <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">${p.category}</div>
                <h3 class="font-bold text-gray-800 text-sm line-clamp-1">${p.name}</h3>
                <div class="flex items-center gap-2 mt-1">
                    <span class="font-bold text-blue-600">${formatCurrency(p.price)}</span>
                    ${p.mrp ? `<span class="text-xs text-gray-400 line-through">${formatCurrency(p.mrp)}</span>` : ''}
                </div>
            </div>
            
            <div class="flex flex-col gap-2 justify-center">
                <button onclick="editProduct('${p.id}')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                    <i class="fas fa-pen text-xs"></i>
                </button>
                <button onclick="deleteProduct('${p.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
};

window.openAddModal = () => {
    productForm.reset();
    pId.value = '';
    modalTitle.textContent = "Add New Product";
    productModal.classList.remove('translate-y-full');
};

window.closeModal = () => {
    productModal.classList.add('translate-y-full');
};

window.editProduct = (id) => {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;

    pId.value = p.id;
    pName.value = p.name;
    pPrice.value = p.price;
    pMrp.value = p.mrp || '';
    pCategory.value = p.category;
    pImage.value = p.image || (p.imageUrls && p.imageUrls[0]) || '';
    pDesc.value = p.description || '';

    modalTitle.textContent = "Edit Product";
    productModal.classList.remove('translate-y-full');
};

window.deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
        await deleteDoc(doc(db, "products", id));
        showToast("Product deleted");
        loadProducts();
    } catch (e) {
        showToast("Delete failed", "error");
    }
};

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = pId.value;
    const data = {
        name: pName.value,
        price: Number(pPrice.value),
        mrp: pMrp.value ? Number(pMrp.value) : null,
        category: pCategory.value,
        image: pImage.value,
        description: pDesc.value,
        type: pCategory.value === 'Service' ? 'service' : 'product',
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "products", id), data);
            showToast("Product updated");
        } else {
            data.createdAt = new Date().toISOString();
            await addDoc(collection(db, "products"), data);
            showToast("Product added");
        }
        closeModal();
        loadProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    }
});

document.addEventListener('DOMContentLoaded', loadProducts);
