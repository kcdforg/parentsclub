// User login functionality
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    initializeEventListeners();
});

function checkExistingSession() {
    const sessionToken = localStorage.getItem('user_session_token');
    if (sessionToken) {
        // User is already logged in, redirect to dashboard
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
    const email = formData.get('email').trim();
    const password = formData.get('password');

    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
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
                email: email,
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
                window.location.href = 'profile.html';
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
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showResetError('Please enter your email address');
        return;
    }

    if (!isValidEmail(email)) {
        showResetError('Please enter a valid email address');
        return;
    }

    setResetLoading(true);
    hideResetError();
    hideResetSuccess();

    try {
        // Simulate password reset request
        // In a real application, this would call a password reset API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success message
        showResetSuccess();
        document.getElementById('resetEmail').value = '';
        
        // Auto-close modal after 3 seconds
        setTimeout(() => {
            document.getElementById('forgotPasswordModal').classList.add('hidden');
            resetForgotPasswordForm();
        }, 3000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        showResetError('Failed to send reset instructions. Please try again.');
    } finally {
        setResetLoading(false);
    }
}

// Helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

function showResetSuccess() {
    document.getElementById('resetSuccess').classList.remove('hidden');
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
    document.getElementById('resetEmail').value = '';
    hideResetError();
    hideResetSuccess();
    setResetLoading(false);
}
