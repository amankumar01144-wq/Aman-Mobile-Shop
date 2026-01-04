import { getServiceById, addBooking } from '../../firebase/db.js';
import { onAuthChange } from '../../firebase/auth.js';
import { formatCurrency, showToast, showLoading, hideLoading } from './utils.js';

const urlParams = new URLSearchParams(window.location.search);
const serviceId = urlParams.get('id');

const serviceSummary = document.getElementById('service-summary');
const totalPriceEl = document.getElementById('total-price');
const form = document.getElementById('booking-form');

// Inputs
const bName = document.getElementById('b-name');
const bMobile = document.getElementById('b-mobile');
const bEmail = document.getElementById('b-email');
const bAddress = document.getElementById('b-address');
const dBrand = document.getElementById('d-brand');
const dModel = document.getElementById('d-model');

let currentService = null;
let currentUser = null;

const loadService = async () => {
    if (!serviceId) {
        // Handle General Inquiry / Repair Request
        currentService = {
            id: 'general_repair',
            name: 'General Repair Service',
            price: 0,
            imageUrl: 'assets/images/repair_banner.png', // Recycle banner or placeholder
            description: 'Describe your issue and we will provide a quote.'
        };
        renderSummary(currentService);
        return;
    }

    try {
        currentService = await getServiceById(serviceId);
        if (!currentService) {
            alert('Service not found');
            window.location.href = 'index.html';
            return;
        }
        renderSummary(currentService);
    } catch (error) {
        console.error(error);
        showToast('Error loading service details', 'error');
    }
};

const renderSummary = (service) => {
    serviceSummary.innerHTML = `
        <img src="${service.imageUrl || 'https://via.placeholder.com/80'}" class="w-16 h-16 object-cover rounded-lg border border-gray-200">
        <div>
            <h4 class="font-bold text-gray-800">${service.name}</h4>
            <p class="text-blue-600 font-medium">${service.price > 0 ? formatCurrency(service.price) : 'Price on Inspection'}</p>
        </div>
    `;
    totalPriceEl.textContent = service.price > 0 ? formatCurrency(service.price) : 'To be Quoted';
};

// Prefill user data
onAuthChange((user) => {
    currentUser = user;
    if (user) {
        // Fetch extra profile details if we had them stored separately, 
        // for now just prefill email and name from auth object
        bName.value = user.displayName || '';
        bEmail.value = user.email || '';
    } else {
        // Redirect to login if enforced, or allow guest booking (user preference is usually strict auth)
        // For better UX, redirect to login
        window.location.href = `login.html?redirect=book-service.html?id=${serviceId}`;
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        showToast('Please login to book a service', 'error');
        return;
    }

    const btnId = 'confirm-btn';
    showLoading(btnId);

    try {
        const bookingData = {
            customerInfo: {
                userId: currentUser.uid,
                name: bName.value,
                mobile: bMobile.value,
                email: bEmail.value,
                address: bAddress.value
            },
            deviceInfo: {
                brand: dBrand.value,
                model: dModel.value
            },
            items: {
                [currentService.id]: {
                    itemId: currentService.id,
                    itemName: currentService.name,
                    price: currentService.price,
                    quantity: 1
                }
            },
            summary: {
                estimatedTotal: currentService.price
            }
        };

        await addBooking(bookingData);
        showToast('Booking Confirmed Successfully!');
        setTimeout(() => {
            window.location.href = 'orders.html'; // Or bookings.html if we make one
        }, 1500);

    } catch (error) {
        console.error(error);
        showToast('Failed to book service', 'error');
    } finally {
        hideLoading(btnId);
    }
});

loadService();
