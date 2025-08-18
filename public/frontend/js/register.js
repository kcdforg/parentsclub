import { apiFetch } from './api.js';

// Registration functionality
// import { parsePhoneNumber } from './utils.js'; // No longer needed as phone is not taken directly on this page
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    checkInvitation();
    initializeEventListeners();
});

function checkExistingSession() {
    const userSessionToken = localStorage.getItem('user_session_token');
    const adminSessionToken = localStorage.getItem('admin_session_token');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invitationCode = urlParams.get('invitation');

    // If an invitation code is present, defer to checkInvitation() later.
    if (invitationCode) {
        return;
    }

    // If there's an admin session, redirect to admin dashboard
    if (adminSessionToken) {
        window.location.href = '../../admin/frontend/dashboard.html';
    } else if (userSessionToken) {
        // User is already logged in, redirect to user dashboard
        window.location.href = 'dashboard.html';
    }
}

async function checkInvitation() {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationCode = urlParams.get('invitation');
    
    console.log('checkInvitation called, invitation code:', invitationCode);
    
    if (!invitationCode) {
        // No invitation code provided, show invitation required message
        console.log('No invitation code found, showing invitation required');
        showInvitationRequired();
        return;
    }
    
    try {
        console.log('Making API request to validate invitation...');
        const data = await apiFetch(`invitation.php?code=${encodeURIComponent(invitationCode)}`, {
            method: 'GET'
        });
        
        console.log('Invitation check response:', data);
        
        if (data.success) {
            // Valid invitation - show registration form and prepopulate fields
            console.log('Invitation is valid, showing registration form');
            showRegistrationForm(data.invitation);
        } else {
            // Invalid invitation
            console.log('Invitation is invalid:', data.error);
            
            const loginRedirectMessage = 'This invitation has already been used to register an account. Please log in.';
            const expiredRedirectMessage = 'This invitation has expired. Please request a new invitation.';

            if (data.error === loginRedirectMessage) {
                // If invitation is already used, redirect to login page
                window.location.href = 'login.html';
            } else if (data.error === expiredRedirectMessage) {
                // If invitation is expired, show error and invitation required message
                showError(data.error);
                showInvitationRequired();
            } else {
                // Generic invalid invitation error
                showError(data.error || 'Invalid invitation link');
                showInvitationRequired();
            }
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
    console.log('showRegistrationForm called with invitation:', invitation);
    
    // Hide invitation required message and show registration form
    const invitationRequired = document.getElementById('invitationRequired');
    const registerForm = document.getElementById('registerForm');
    
    console.log('Elements found:', {
        invitationRequired: !!invitationRequired,
        registerForm: !!registerForm
    });
    
    // Force hide invitation required message
    if (invitationRequired) {
        invitationRequired.style.display = 'none';
        invitationRequired.classList.add('hidden');
        console.log('Hidden invitation required message');
    }
    
    // Force show registration form
    if (registerForm) {
        registerForm.style.display = 'block';
        registerForm.classList.remove('hidden');
        console.log('Showed registration form');
    }
    
    // Set invitation code
    document.getElementById('invitationCode').value = invitation.invitation_code;
    
    // Log invitation code setting for debugging
    console.log('Setting invitation code:', invitation.invitation_code);
    
    // Only display invited name and relevant info, no pre-population of input fields
    // The actual email/phone for registration comes from the invitation itself.

    // Show invitation info
    const invitationInfo = document.getElementById('invitationInfo');
    const invitedBy = document.getElementById('invitedBy');
    invitationInfo.classList.remove('hidden');
    invitedBy.textContent = invitation.invited_by_display;
    
    // Update page title and subtitle
    document.getElementById('pageTitle').textContent = 'Create Your Password'; // Changed title
    document.getElementById('pageSubtitle').textContent = `Welcome, ${invitation.invited_name}! Please set your password.`; // Updated subtitle
}

function initializeEventListeners() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    // const emailInput = document.getElementById('email'); // Removed
    // const firstNameInput = document.getElementById('firstName'); // Removed
    // const secondNameInput = document.getElementById('secondName'); // Removed

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Real-time validation - only for passwords
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    // emailInput.addEventListener('input', validateEmail); // Removed
    // firstNameInput.addEventListener('input', validateFirstName); // Removed
    // if (secondNameInput) secondNameInput.addEventListener('input', validateSecondName); // Removed

    // Removed phone number input and country code change validation
    // document.getElementById('phone').addEventListener('input', function(e) { /* ... */ });
    // document.getElementById('countryCode').addEventListener('change', function(e) { /* ... */ });

    // Handle form submission
    registerForm.addEventListener('submit', handleRegistration);
    
    // Success modal - proceed to profile
    document.getElementById('proceedToProfile').addEventListener('click', function() {
        window.location.href = 'profile_completion.html';
    });
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
    // Removed name, email, phone from form data as they are no longer on this page
    // const firstName = (formData.get('first_name') || '').trim();
    // const secondName = (formData.get('second_name') || '').trim();
    // const fullName = [firstName, secondName].filter(Boolean).join(' ').trim();
    // const email = formData.get('email').trim();
    // const phone = formData.get('phone').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    const termsAccepted = formData.get('terms');
    const invitationCode = formData.get('invitation_code');
    
    // Simplified log as fewer fields are collected here
    console.log('Form data - Invitation code:', invitationCode);

    // Client-side validation - simplified to only passwords and invitation code
    if (!password || !confirmPassword) {
        showError('Please enter and confirm your password');
        return;
    }
    
    if (!invitationCode) {
        showError('Invitation code is missing. Please refresh the page and try again.');
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
            password: password,
            invitation_code: invitationCode
        };
        
        console.log('Sending registration request:', { ...requestBody, password: '[HIDDEN]' });

        const data = await apiFetch('register.php', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
        
        console.log('Registration response:', data);

        if (data.success) {
            // Store session token if available
            if (data.session_token) {
                localStorage.setItem('user_session_token', data.session_token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }
            
            // Log user type for debugging
            console.log('User registered successfully with type:', data.user.user_type);
            
            // Show success modal
            document.getElementById('successModal').classList.remove('hidden');
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Network error. Please try again. Error details: ' + error.message);
    } finally {
        setLoading(false);
    }
}

// Helper functions - removed unused isValidEmail
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
