import { db } from "../../firebase/firebase-config.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const servicesList = document.getElementById('services-list');
const serviceModal = document.getElementById('service-modal');
const serviceForm = document.getElementById('service-form');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const searchInput = document.getElementById('search-services');

let allServices = [];
let serviceToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchServices();
});

// Fetch Services
async function fetchServices() {
    try {
        const q = query(collection(db, "services")); // You might want to order by name or createdAt if available
        const querySnapshot = await getDocs(q);

        allServices = [];
        querySnapshot.forEach((doc) => {
            allServices.push({ id: doc.id, ...doc.data() });
        });

        renderServices(allServices);

    } catch (error) {
        console.error("Error fetching services:", error);
        servicesList.innerHTML = `<div class="text-center text-red-500 py-10">Error loading services. Please try again.</div>`;
    }
}

// Render Services
function renderServices(services) {
    servicesList.innerHTML = '';

    if (services.length === 0) {
        servicesList.innerHTML = `
            <div class="text-center py-10">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-2xl">
                    <i class="fas fa-tools"></i>
                </div>
                <p class="text-gray-500 font-medium">No services found.</p>
                <p class="text-xs text-gray-400 mt-1">Add a new service to get started.</p>
            </div>
        `;
        return;
    }

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center';

        const imgUrl = service.imageUrl || 'https://placehold.co/100x100?text=Service';

        card.innerHTML = `
            <div class="w-16 h-16 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
                <img src="${imgUrl}" alt="${service.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 text-sm truncate">${service.name}</h3>
                <p class="text-xs text-gray-500 line-clamp-1">${service.description || 'No description'}</p>
                <div class="mt-1 font-bold text-blue-600 text-sm">₹${service.price}</div>
            </div>
            <div class="flex flex-col gap-2">
                <button class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                    onclick="editService('${service.id}')">
                    <i class="fas fa-edit text-xs"></i>
                </button>
                <button class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                    onclick="confirmDelete('${service.id}')">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;
        servicesList.appendChild(card);
    });
}

// Search Logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allServices.filter(service =>
        service.name.toLowerCase().includes(term) ||
        (service.description && service.description.toLowerCase().includes(term))
    );
    renderServices(filtered);
});

// Modal Logic
window.openServiceModal = (mode = 'add', serviceId = null) => {
    serviceModal.classList.remove('hidden');

    if (mode === 'edit' && serviceId) {
        const service = allServices.find(s => s.id === serviceId);
        if (service) {
            document.getElementById('modal-title').textContent = 'Edit Service';
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-price').value = service.price;
            document.getElementById('service-description').value = service.description || '';
            document.getElementById('service-image').value = service.imageUrl || '';
        }
    } else {
        document.getElementById('modal-title').textContent = 'Add Service';
        serviceForm.reset();
        document.getElementById('service-id').value = '';
    }
};

window.closeServiceModal = () => {
    serviceModal.classList.add('hidden');
};

window.editService = (id) => {
    openServiceModal('edit', id);
};

// Form Submit
serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('service-id').value;
    const data = {
        name: document.getElementById('service-name').value,
        price: Number(document.getElementById('service-price').value),
        description: document.getElementById('service-description').value,
        imageUrl: document.getElementById('service-image').value,
        updatedAt: new Date().toISOString()
    };

    const submitBtn = serviceForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        if (id) {
            // Update
            await updateDoc(doc(db, "services", id), data);
        } else {
            // Add
            data.createdAt = new Date().toISOString();
            await addDoc(collection(db, "services"), data);
        }

        closeServiceModal();
        fetchServices(); // Refresh list

    } catch (error) {
        console.error("Error saving service:", error);
        alert("Failed to save service.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Delete Logic
window.confirmDelete = (id) => {
    serviceToDelete = id;
    deleteModal.classList.remove('hidden');
};

window.closeDeleteModal = () => {
    deleteModal.classList.add('hidden');
    serviceToDelete = null;
};

confirmDeleteBtn.addEventListener('click', async () => {
    if (!serviceToDelete) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';

    try {
        await deleteDoc(doc(db, "services", serviceToDelete));
        closeDeleteModal();
        fetchServices();
    } catch (error) {
        console.error("Error deleting service:", error);
        alert("Failed to delete service.");
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
    }
});
