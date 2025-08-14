// User login functionality
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    initializeEventListeners();
});

function checkExistingSession() {
    const userSessionToken = localStorage.getItem('user_session_token');
    const adminSessionToken = localStorage.getItem('admin_session_token');

    if (adminSessionToken) {
        // Admin is logged in, redirect to admin dashboard
        window.location.href = '../../admin/frontend/dashboard.html';
    } else if (userSessionToken) {
        // User is logged in, redirect to user dashboard
        window.location.href = 'dashboard.html';
    }
}

function initializeEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotModalBtn = document.getElementById('closeForgotModalBtn');
    const cancelResetBtn = document.getElementById('cancelResetBtn');
    const sendResetBtn = document.getElementById('sendResetBtn');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Handle form submission
    loginForm.addEventListener('submit', handleLogin);

    // Forgot password modal
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        forgotPasswordModal.classList.remove('hidden');
    });

    closeForgotModalBtn.addEventListener('click', function() {
        forgotPasswordModal.classList.add('hidden');
        resetForgotPasswordForm();
    });

    cancelResetBtn.addEventListener('click', function() {
        forgotPasswordModal.classList.add('hidden');
        resetForgotPasswordForm();
    });

    sendResetBtn.addEventListener('click', handlePasswordReset);

    // Auto-focus email field
    emailInput.focus();

    // Enter key handling
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = formData.get('phone').trim();
    const password = formData.get('password');

    // Basic validation
    if (!phoneNumber || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
        showError('Please enter a valid 10-digit phone number');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const response = await fetch('../backend/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: countryCode + phoneNumber,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Store session token and user data
            localStorage.setItem('user_session_token', data.session_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            // Redirect based on user status
            if (!data.user.profile_completed) {
                window.location.href = 'profile_completion.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
}

async function handlePasswordReset() {
    const countryCode = document.getElementById('resetCountryCode').value;
    const phoneNumber = document.getElementById('resetPhone').value.trim();
    
    if (!phoneNumber) {
        showResetError('Please enter your phone number');
        return;
    }

    if (!isValidPhone(phoneNumber)) {
        showResetError('Please enter a valid 10-digit phone number');
        return;
    }

    setResetLoading(true);
    hideResetError();
    hideResetSuccess();

    try {
        const response = await fetch('../backend/forgot_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: countryCode + phoneNumber
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Show success message
            showResetSuccess(data.message);
            document.getElementById('resetPhone').value = '';
            
            // Auto-close modal after 5 seconds to give user time to read
            setTimeout(() => {
                document.getElementById('forgotPasswordModal').classList.add('hidden');
                resetForgotPasswordForm();
            }, 5000);
        } else {
            showResetError(data.error || 'Failed to send reset request. Please try again.');
        }
        
    } catch (error) {
        console.error('Password reset error:', error);
        showResetError('Failed to send reset request. Please try again.');
    } finally {
        setResetLoading(false);
    }
}

// Helper functions
function isValidPhone(phone) {
    // Validate 10-digit phone number
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function setLoading(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');
    
    loginBtn.disabled = loading;
    
    if (loading) {
        loginBtnText.textContent = 'Signing In...';
        loginBtnSpinner.classList.remove('hidden');
    } else {
        loginBtnText.textContent = 'Sign In';
        loginBtnSpinner.classList.add('hidden');
    }
}

function showResetError(message) {
    const errorDiv = document.getElementById('resetError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideResetError() {
    document.getElementById('resetError').classList.add('hidden');
}

function showResetSuccess(message) {
    const successElement = document.getElementById('resetSuccess');
    if (message) {
        successElement.textContent = message;
    }
    successElement.classList.remove('hidden');
}

function hideResetSuccess() {
    document.getElementById('resetSuccess').classList.add('hidden');
}

function setResetLoading(loading) {
    const sendResetBtn = document.getElementById('sendResetBtn');
    const resetBtnText = document.getElementById('resetBtnText');
    const resetBtnSpinner = document.getElementById('resetBtnSpinner');
    
    sendResetBtn.disabled = loading;
    
    if (loading) {
        resetBtnText.textContent = 'Sending...';
        resetBtnSpinner.classList.remove('hidden');
    } else {
        resetBtnText.textContent = 'Send Instructions';
        resetBtnSpinner.classList.add('hidden');
    }
}

function resetForgotPasswordForm() {
    document.getElementById('resetPhone').value = '';
    hideResetError();
    hideResetSuccess();
    setResetLoading(false);
}
