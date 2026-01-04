import { loginUser, isAdmin } from '../../../firebase/auth.js';
import { showToast, showLoading, hideLoading } from '../utils.js';

const loginForm = document.getElementById('admin-login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        const btnId = 'login-btn';

        try {
            showLoading(btnId);
            const user = await loginUser(email, password);
            const adminStatus = await isAdmin(user.uid);

            if (adminStatus) {
                showToast('Welcome Admin', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                showToast('Access Denied: Not an Admin', 'error');
            }
        } catch (error) {
            console.error(error);
            alert("Login Failed: " + error.message);
            showToast(error.message, 'error');
        } finally {
            hideLoading(btnId);
        }
    });
}
