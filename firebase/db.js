import { db, storage } from './firebase-config.js';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// --- Caching Helper ---

const fetchWithCache = async (key, fetchFn, expiryMinutes = 30) => {
    const cached = localStorage.getItem(key);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = (Date.now() - timestamp) / 1000 / 60;
        if (age < expiryMinutes) {
            console.log(`[Cache Hit] ${key}`);
            return data;
        }
    }
    console.log(`[Cache Miss] ${key}`);
    const data = await fetchFn();
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
        console.warn("Cache full or error:", e); // clear if full?
        if (e.name === 'QuotaExceededError') localStorage.clear();
    }
    return data;
};

// --- Products ---

export const getProducts = async (category = null) => {
    try {
        const cacheKey = category ? `products_${category}` : 'products_all';

        return await fetchWithCache(cacheKey, async () => {
            let q = collection(db, "products");
            if (category) {
                q = query(q, where("category", "==", category));
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    } catch (error) {
        console.error("Error getting products: ", error);
        throw error;
    }
};

export const getProductById = async (id) => {
    try {
        return await fetchWithCache(`product_${id}`, async () => {
            const docRef = doc(db, "products", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        });
    } catch (error) {
        console.error("Error getting product: ", error);
        throw error;
    }
};

// --- Orders ---

export const createOrder = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            ...orderData,
            createdAt: new Date(),
            status: 'Pending'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating order: ", error);
        throw error;
    }
};

export const getUserOrders = async (userId) => {
    try {
        const q = query(
            collection(db, "orders"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting user orders: ", error);
        throw error;
    }
};

// --- Admin ---

export const addProduct = async (productData, imageFile) => {
    try {
        let imageUrl = productData.image || ''; // Use provided URL or default to empty

        if (imageFile) {
            const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const docRef = await addDoc(collection(db, "products"), {
            ...productData,
            image: imageUrl,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        throw error;
    }
};

export const getAllOrders = async () => {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status });
    } catch (error) {
        throw error;
    }
};

// --- Services & Bookings ---

export const getServices = async () => {
    try {
        return await fetchWithCache('services_all', async () => {
            const q = collection(db, "services");
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    } catch (error) {
        console.error("Error getting services: ", error);
        throw error;
    }
};

export const getServiceById = async (id) => {
    try {
        return await fetchWithCache(`service_${id}`, async () => {
            const docRef = doc(db, "services", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        });
    } catch (error) {
        console.error("Error getting service: ", error);
        throw error;
    }
};

export const addBooking = async (bookingData) => {
    try {
        const docRef = await addDoc(collection(db, "bookings"), {
            ...bookingData,
            status: 'pending',
            bookingDate: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        throw error;
    }
};

// --- Settings (Banners & Contact) ---

export const getSettings = async (docId) => {
    try {
        return await fetchWithCache(`settings_${docId}`, async () => {
            const docRef = doc(db, "settings", docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        }, 60); // Cache settings for 60 minutes
    } catch (error) {
        console.error("Error getting settings:", error);
        throw error;
    }
};

export const updateSettings = async (docId, data) => {
    try {
        const docRef = doc(db, "settings", docId);
        // Use setDoc with merge: true to create if not exists
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

export const uploadBannerImage = async (file) => {
    try {
        const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading banner:", error);
    }
};

// --- Notifications ---

export const sendBroadcastNotification = async (notifData) => {
    try {
        const docRef = await addDoc(collection(db, "broadcast_notifications"), {
            ...notifData,
            sentAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
};

export const getLatestBroadcastNotification = async () => {
    try {
        const q = query(
            collection(db, "broadcast_notifications"),
            orderBy("sentAt", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting latest notification:", error);
        return null;
    }
};

export const getRecentBroadcastNotifications = async (limitCount = 5) => {
    try {
        const q = query(
            collection(db, "broadcast_notifications"),
            orderBy("sentAt", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting notifications:", error);
        return [];
    }
};

export const deleteBroadcastNotification = async (id) => {
    try {
        await deleteDoc(doc(db, "broadcast_notifications", id));
    } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
};
