import { apiFetch } from './api.js';

// Admin login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    console.log('loginForm element:', loginForm); // Added for debugging
    console.log('DOMContentLoaded event fired in login.js');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const errorText = document.getElementById('errorText');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        console.log('Form submit event fired.');
        e.preventDefault();
        console.log('e.preventDefault() called.');
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }

        setLoading(true);
        hideError();

        try {
            const data = await apiFetch('login.php', {
                method: 'POST',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (data.success) {
                // Redirect to dashboard
                window.location.href = 'dashboard.php';
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Helper functions
    function showError(message) {
        errorText.textContent = message;
        loginError.classList.remove('hidden');
    }

    function hideError() {
        loginError.classList.add('hidden');
    }

    function setLoading(loading) {
        loginBtn.disabled = loading;
        
        if (loading) {
            loginBtnText.textContent = 'Signing In...';
            loginBtnSpinner.classList.remove('hidden');
        } else {
            loginBtnText.textContent = 'Sign In';
            loginBtnSpinner.classList.add('hidden');
        }
    }

    // Auto-focus username field
    usernameInput.focus();

    // Enter key handling
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
});
