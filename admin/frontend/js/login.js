import { apiFetch } from './api.js';

// Admin login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    console.log('loginForm element:', loginForm); // Added for debugging
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');

    // Check if already logged in
    const sessionToken = localStorage.getItem('admin_session_token');
    if (sessionToken) {
        // Verify token with server
        verifySession(sessionToken);
    }

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
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
                // Store session token
                localStorage.setItem('admin_session_token', data.session_token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
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
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
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

    async function verifySession(token) {
        try {
            const data = await apiFetch('dashboard.php', {
                method: 'GET'
            });

            if (data.success) {
                // Token is valid, redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('admin_session_token');
                localStorage.removeItem('admin_user');
            }
        } catch (error) {
            console.error('Session verification error:', error);
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_user');
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
