import { onAuthChange, isAdmin, logoutUser } from '../../../firebase/auth.js';

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
        return;
    }

    const admin = await isAdmin(user.uid);
    if (!admin) {
        alert("Access Denied");
        await logoutUser();
        window.location.href = 'admin-login.html';
    }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await logoutUser();
        window.location.href = 'admin-login.html';
    });
}
