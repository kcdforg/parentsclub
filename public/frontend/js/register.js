// Registration functionality
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    checkInvitation();
    initializeEventListeners();
});

function checkExistingSession() {
    const sessionToken = localStorage.getItem('user_session_token');
    if (sessionToken) {
        // User is already logged in, redirect to main page
        window.location.href = 'index.html';
    }
}

async function checkInvitation() {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationCode = urlParams.get('invitation');
    
    if (!invitationCode) {
        // No invitation code provided, show invitation required message
        showInvitationRequired();
        return;
    }
    
    try {
        const response = await fetch(`../backend/invitation.php?code=${encodeURIComponent(invitationCode)}`);
        const data = await response.json();
        
        if (data.success) {
            // Valid invitation - show registration form and prepopulate fields
            showRegistrationForm(data.invitation);
        } else {
            // Invalid invitation
            showError(data.error || 'Invalid invitation link');
            showInvitationRequired();
            // Remove invitation parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (error) {
        console.error('Error checking invitation:', error);
        showError('Failed to validate invitation');
        showInvitationRequired();
    }
}

function showInvitationRequired() {
    // Hide registration form and show invitation required message
    document.getElementById('invitationRequired').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    
    // Update page title and subtitle
    document.getElementById('pageTitle').textContent = 'Invitation Required';
    document.getElementById('pageSubtitle').textContent = 'You need an invitation to register';
}

function showRegistrationForm(invitation) {
    // Hide invitation required message and show registration form
    const invitationRequired = document.getElementById('invitationRequired');
    const registerForm = document.getElementById('registerForm');
    
    // Force hide invitation required message
    if (invitationRequired) {
        invitationRequired.style.display = 'none';
        invitationRequired.classList.add('hidden');
    }
    
    // Force show registration form
    if (registerForm) {
        registerForm.style.display = 'block';
        registerForm.classList.remove('hidden');
    }
    
    // Set invitation code
    document.getElementById('invitationCode').value = invitation.invitation_code;
    
    // Prepopulate name and email fields
    document.getElementById('fullName').value = invitation.invited_name;
    // Allow name editing, but make email readonly
    document.getElementById('email').value = invitation.invited_email;
    document.getElementById('email').readOnly = true;
    
    // Show invitation info
    const invitationInfo = document.getElementById('invitationInfo');
    const invitedBy = document.getElementById('invitedBy');
    invitationInfo.classList.remove('hidden');
    invitedBy.textContent = invitation.invited_by_display;
    
    // Update page title and subtitle
    document.getElementById('pageTitle').textContent = 'Complete Your Registration';
    document.getElementById('pageSubtitle').textContent = `Welcome, ${invitation.invited_name}!`;
}

function initializeEventListeners() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('fullName');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Real-time validation
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    emailInput.addEventListener('input', validateEmail);
    nameInput.addEventListener('input', validateName);

    // Handle form submission
    registerForm.addEventListener('submit', handleRegistration);
    
    // Success modal - proceed to profile
    document.getElementById('proceedToProfile').addEventListener('click', function() {
        window.location.href = 'profile.html';
    });
}

function validateEmail() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    if (email && !isValidEmail(email)) {
        emailInput.classList.add('border-red-500');
        emailInput.classList.remove('border-gray-300');
    } else {
        emailInput.classList.remove('border-red-500');
        emailInput.classList.add('border-gray-300');
    }
}

function validateName() {
    const nameInput = document.getElementById('fullName');
    const name = nameInput.value.trim();
    
    if (name && name.length < 2) {
        nameInput.classList.add('border-red-500');
        nameInput.classList.remove('border-gray-300');
    } else {
        nameInput.classList.remove('border-red-500');
        nameInput.classList.add('border-gray-300');
    }
}

function validatePassword() {
    const passwordInput = document.getElementById('password');
    const password = passwordInput.value;
    
    if (password && password.length < 6) {
        passwordInput.classList.add('border-red-500');
        passwordInput.classList.remove('border-gray-300');
    } else {
        passwordInput.classList.remove('border-red-500');
        passwordInput.classList.add('border-gray-300');
    }
    
    // Also validate password match
    validatePasswordMatch();
}

function validatePasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.classList.add('border-red-500');
        confirmPasswordInput.classList.remove('border-gray-300');
    } else {
        confirmPasswordInput.classList.remove('border-red-500');
        confirmPasswordInput.classList.add('border-gray-300');
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const fullName = formData.get('full_name').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    const termsAccepted = formData.get('terms');
    const invitationCode = formData.get('invitation_code');

    // Client-side validation
    if (!fullName || !email || !password || !confirmPassword) {
        showError('Please fill in all required fields');
        return;
    }

    if (fullName.length < 2) {
        showError('Name must be at least 2 characters long');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (!termsAccepted) {
        showError('Please accept the Terms of Service and Privacy Policy');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const requestBody = {
            full_name: fullName,
            email: email,
            password: password,
            invitation_code: invitationCode
        };

        const response = await fetch('../backend/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
            // Store session token
            localStorage.setItem('user_session_token', data.session_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            // Show success modal
            document.getElementById('successModal').classList.remove('hidden');
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Network error. Please try again.');
    } finally {
        setLoading(false);
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
    
    // Scroll to error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function setLoading(loading) {
    const registerBtn = document.getElementById('registerBtn');
    const registerBtnText = document.getElementById('registerBtnText');
    const registerBtnSpinner = document.getElementById('registerBtnSpinner');
    
    registerBtn.disabled = loading;
    
    if (loading) {
        registerBtnText.textContent = 'Creating Account...';
        registerBtnSpinner.classList.remove('hidden');
    } else {
        registerBtnText.textContent = 'Create Account';
        registerBtnSpinner.classList.add('hidden');
    }
}
