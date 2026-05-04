import { getNotifications, markAllNotificationsRead, formatDate } from './utils.js';

const container = document.getElementById('notifications-list');
const emptyState = document.getElementById('empty-state');
const clearBtn = document.getElementById('clear-all-btn');

const loadNotifications = () => {
    const list = getNotifications();

    if (list.length === 0) {
        container.style.display = 'none';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }

    container.innerHTML = list.map(n => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-l-4 ${n.read ? 'border-l-gray-300 border-gray-100' : 'border-l-blue-500 border-blue-100'} relative">
            <div class="flex gap-3">
                <div class="w-10 h-10 rounded-full ${n.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center flex-shrink-0">
                    <i class="fas ${getIcon(n.type)}"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-gray-800 text-sm ${n.read ? 'text-gray-600' : ''}">${n.title}</h3>
                    <p class="text-xs text-gray-500 mt-1 leading-relaxed">${n.message}</p>
                    <span class="text-[10px] text-gray-400 mt-2 block">${formatDate(n.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
};

const getIcon = (type) => {
    switch (type) {
        case 'success': return 'fa-check';
        case 'error': return 'fa-exclamation';
        default: return 'fa-info';
    }
};

clearBtn.addEventListener('click', () => {
    markAllNotificationsRead();
    loadNotifications();
    clearBtn.innerText = "All read";
    clearBtn.disabled = true;
    clearBtn.classList.add('text-gray-400');
});

// Load on start
loadNotifications();
