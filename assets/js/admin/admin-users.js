import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { db } from '../../../firebase/firebase-config.js';
import { formatDate, showToast } from '../utils.js';

const usersList = document.getElementById('users-list');

const loadUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers(users);
    } catch (error) {
        showToast('Failed to load users: ' + error.message, 'error');
        usersList.innerHTML = `<p class="text-center text-red-500 py-10">Error loading users.</p>`;
    }
};

const renderUsers = (users) => {
    if (users.length === 0) {
        usersList.innerHTML = `<p class="text-center text-gray-400 py-10">No users found.</p>`;
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 text-sm">${user.name || 'User'}</h3>
                    <p class="text-xs text-gray-500">${user.email}</p>
                </div>
                <div class="ml-auto">
                     <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}">
                        ${user.role || 'User'}
                    </span>
                </div>
            </div>

            <div class="flex justify-between items-center border-t border-gray-50 pt-3">
                <p class="text-[10px] text-gray-400">Joined: ${formatDate(user.createdAt)}</p>
                
                ${user.role !== 'admin' ? `
                     <button onclick="toggleUserStatus('${user.id}', '${user.status || 'active'}')" class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${user.status === 'blocked' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}">
                        ${user.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                ` : ''}
            </div>
             ${user.status === 'blocked' ? '<div class="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 pointer-events-none"><span class="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">BLOCKED</span></div>' : ''}
        </div>
    `).join('');
};

window.toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
        await updateDoc(doc(db, "users", userId), { status: newStatus });
        showToast(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}`);
        loadUsers();
    } catch (error) {
        showToast('Action failed', 'error');
    }
};

document.addEventListener('DOMContentLoaded', loadUsers);
