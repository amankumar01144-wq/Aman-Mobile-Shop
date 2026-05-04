import { getSettings } from '../../firebase/db.js';

const loadContactDetails = async () => {
    try {
        console.log("Loading contact details...");
        const data = await getSettings('general');
        console.log("Fetched Settings Data:", data);

        if (!data) {
            console.warn("No settings data found.");
            return;
        }

        const emailEl = document.getElementById('support-email');
        const phoneEl = document.getElementById('support-phone');
        const whatsappEl = document.getElementById('support-whatsapp');

        // Debugging elements
        if (!emailEl) console.error("Email element not found");
        if (!phoneEl) console.error("Phone element not found");
        if (!whatsappEl) console.error("WhatsApp element not found");

        // Use new keys (supportEmail) with fallback to old keys (email) just in case
        const email = data.supportEmail || data.email;
        const phone = data.supportPhoneNumber || data.phone;
        const whatsapp = data.supportWhatsAppNumber || data.whatsapp;

        if (emailEl && email) {
            // emailEl.textContent = email; // Don't change text 'Email'
            emailEl.href = `mailto:${email}`;
        }

        if (phoneEl && phone) {
            // phoneEl.textContent = phone;
            phoneEl.href = `tel:${phone}`;
        }

        if (whatsappEl && whatsapp) {
            // whatsappEl.textContent = whatsapp;
            const cleanNum = whatsapp.replace(/\D/g, '');
            whatsappEl.href = `https://wa.me/${cleanNum}`;
        }

    } catch (error) {
        console.error("Failed to load contact info", error);
    }
};

document.addEventListener('DOMContentLoaded', loadContactDetails);
