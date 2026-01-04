import { db } from "../../firebase/firebase-config.js";
import { collection, doc, setDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const fileInput = document.getElementById('json-file');
const fileNameDisplay = document.getElementById('file-name');
const uploadBtn = document.getElementById('upload-btn');
const statusLog = document.getElementById('status-log');
const logContent = document.getElementById('log-content');
const collectionsContainer = document.getElementById('collections-container');
const collectionsList = document.getElementById('collections-list');

let parsedData = null;

// Helper: Log messages
function log(message, type = 'info') {
    const div = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    div.innerHTML = `<span class="opacity-50">[${timestamp}]</span> ${message}`;
    if (type === 'error') div.classList.add('text-red-400');
    if (type === 'success') div.classList.add('text-green-400');
    if (type === 'warning') div.classList.add('text-yellow-400');
    logContent.appendChild(div);
    logContent.scrollTop = logContent.scrollHeight;
}

// 1. File Selection & Parsing
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        fileNameDisplay.textContent = `Selected: ${file.name}`;
        fileNameDisplay.classList.remove('hidden');

        // Reset UI
        collectionsList.innerHTML = '<div class="text-gray-500 text-xs p-2">Parsing...</div>';
        collectionsContainer.classList.remove('hidden');
        uploadBtn.disabled = true;
        uploadBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        uploadBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                parsedData = JSON.parse(event.target.result);
                generateCollectionOptions(parsedData);
            } catch (err) {
                console.error(err);
                collectionsList.innerHTML = `<div class="text-red-500 text-xs p-2">Error parsing JSON: ${err.message}</div>`;
            }
        };
        reader.readAsText(file);
    }
});

// 2. Generate Checkboxes
function generateCollectionOptions(data) {
    collectionsList.innerHTML = '';
    let foundKeys = [];

    if (Array.isArray(data)) {
        // Handle Array (Single Collection)
        foundKeys.push({ key: 'items', count: data.length, type: 'Array' });
        // Restore manual input? For now, let's just default to 'items' or 'uploaded_data'
        // Or we can treat it as a single checkable item.
    } else if (typeof data === 'object' && data !== null) {
        // Handle Object (Multiple Collections)
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                const count = Array.isArray(value) ? value.length : Object.keys(value).length;
                foundKeys.push({ key: key, count: count, type: 'Object' });
            }
        }
    }

    if (foundKeys.length === 0) {
        collectionsList.innerHTML = '<div class="text-gray-500 text-xs p-2">No valid collections found.</div>';
        return;
    }

    foundKeys.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="checkbox" id="col-${item.key}" value="${item.key}" class="collection-checkbox w-4 h-4 text-blue-600 rounded focus:ring-blue-500" checked>
                <label for="col-${item.key}" class="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    ${item.key}
                </label>
            </div>
            <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">${item.count} items</span>
        `;
        collectionsList.appendChild(div);
    });

    // Enable Upload Button
    uploadBtn.disabled = false;
    uploadBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
    uploadBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
}

// 3. Upload Logic
uploadBtn.addEventListener('click', async () => {
    if (!parsedData) return;

    const checkboxes = document.querySelectorAll('.collection-checkbox:checked');
    if (checkboxes.length === 0) {
        alert("Please select at least one collection to import.");
        return;
    }

    const selectedKeys = Array.from(checkboxes).map(cb => cb.value);

    statusLog.classList.remove('hidden');
    logContent.innerHTML = '';

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';

    let totalSuccess = 0;
    let totalErrors = 0;

    for (const collectionName of selectedKeys) {
        log(`--- Processing Collection: "${collectionName}" ---`, 'warning');

        let dataToUpload = [];
        let rawData = Array.isArray(parsedData) ? parsedData : parsedData[collectionName];
        let useSetDoc = false;

        // Prepare Data
        if (Array.isArray(rawData)) {
            dataToUpload = rawData.map(item => ({ data: item }));
        } else {
            // Object map (ID -> Data)
            useSetDoc = true;
            for (const [id, val] of Object.entries(rawData)) {
                dataToUpload.push({ id: id, data: val });
            }
        }

        log(`Queueing ${dataToUpload.length} documents...`);

        // Batch processing to avoid UI freeze? 
        // Firestore batch is limited to 500. We'll stick to loop for simplicity/progress feedback.
        let colSuccess = 0;

        for (const item of dataToUpload) {
            try {
                if (useSetDoc && item.id) {
                    await setDoc(doc(db, collectionName, item.id), item.data);
                } else {
                    await addDoc(collection(db, collectionName), item.data);
                }
                colSuccess++;
                totalSuccess++;
            } catch (err) {
                console.error(err);
                log(`Failed to save ${item.id || 'item'}: ${err.message}`, 'error');
                totalErrors++;
            }

            // UI Update every 10 items
            if (colSuccess % 10 === 0) {
                // Optional: Update progress text somewhere
            }
        }
        log(`Completed "${collectionName}": ${colSuccess} added.`, 'success');
    }

    log('--- All Imports Finished ---');
    log(`Total Success: ${totalSuccess}`, 'success');
    log(`Total Errors: ${totalErrors}`, totalErrors > 0 ? 'error' : 'info');

    uploadBtn.disabled = false;
    uploadBtn.innerHTML = 'Import Selected Data <i class="fas fa-file-import"></i>';
});
