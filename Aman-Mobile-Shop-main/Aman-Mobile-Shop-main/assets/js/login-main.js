import { loginUser, registerUser, onAuthChange } from '../../firebase/auth.js';
import { showToast, showLoading, hideLoading } from './utils.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const showSignupBtn = document.getElementById('show-signup');
const pageTitle = document.querySelector('h1');
const pageSub = document.querySelector('p.text-gray-500');

let isLoginMode = true;

// Toggle Login/Signup
if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            pageTitle.textContent = 'Welcome Back';
            pageSub.textContent = 'Sign in to continue shopping';
            loginBtn.textContent = 'Sign In';
            showSignupBtn.textContent = 'Sign Up';
            document.querySelector('.mt-8 p').innerHTML = `Don't have an account? <a href="#" id="show-signup" class="text-blue-600 font-bold">Sign Up</a>`;
            // Re-attach listener because innerHTML replaced it (lazy way, better to toggle classes)
            // For better UX, let's just use separate page logic or cleaner toggle.
            // But for single file speed:
            window.location.reload(); // Simple reset for now or handle better.
        } else {
            pageTitle.textContent = 'Create Account';
            pageSub.textContent = 'Join ShopMax today';
            loginBtn.textContent = 'Sign Up';
            showSignupBtn.textContent = 'Sign In';
            showSignupBtn.previousSibling.textContent = 'Already have an account? ';
        }
    });
}

// Password Toggle
const togglePasswordBtn = document.getElementById('toggle-password');
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    const btnId = 'login-btn';

    try {
        showLoading(btnId);

        if (isLoginMode) {
            await loginUser(email, password);
            showToast('Welcome back!', 'success');
        } else {
            await registerUser(email, password, { name: email.split('@')[0] }); // Default name from email
            showToast('Account created successfully!', 'success');
            // Maybe redirect to profile setup?
        }

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading(btnId);
    }
});

// Redirect if already logged in
onAuthChange((user) => {
    if (user) {
        // Optional: Redirect if already logged in, but maybe they want to switch accounts.
        // window.location.href = 'index.html';
    }
});
