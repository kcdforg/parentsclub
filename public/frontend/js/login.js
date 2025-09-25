import { apiFetch } from './api.js';

// User login functionality
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    checkInvitationUsedMessage();
    initializeEventListeners();
});

async function checkExistingSession() {
    const userSessionToken = localStorage.getItem('user_session_token');
    const adminSessionToken = localStorage.getItem('admin_session_token');

    if (adminSessionToken) {
        // Admin is logged in, redirect to admin dashboard
        window.location.href = '../../admin/frontend/dashboard.html';
        return;
    } 
    
    if (userSessionToken) {
        // User is logged in, check their completion status
        try {
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            
            // Validate session and get latest user status
            const response = await apiFetch('account.php', {
                method: 'GET'
            });
            
            if (response.success) {
                // Update stored user data
                localStorage.setItem('user_data', JSON.stringify(response.user));
                console.log('Login: User data from account.php in checkExistingSession:', response.user);
                
                // Determine next step based on user status
                const nextStep = determineUserNextStep(response.user);
                
                if (nextStep !== 'dashboard') {
                    // User needs to complete something, redirect appropriately
                    redirectUserBasedOnStatus(nextStep, null, response.user);
                    return;
                }
            }
            
            // Default redirect to dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('Session check error:', error);
            // If there's an error checking session, just go to dashboard
            window.location.href = 'dashboard.html';
        }
    }
}

function checkInvitationUsedMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message === 'invitation_used') {
        // Show helpful message about invitation already being used
        showInfoMessage('This invitation has already been used to create an account. Please log in with your phone number and password.');
        
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function initializeEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const phoneInput = document.getElementById('phone');
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

    // Auto-focus phone field
    phoneInput.focus();

    // Enter key handling
    phoneInput.addEventListener('keypress', function(e) {
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
        const data = await apiFetch('login.php', {
            method: 'POST',
            body: JSON.stringify({
                phone: countryCode + phoneNumber,
                password: password
            })
        });

        if (data.success) {
            // Store session token and user data
            localStorage.setItem('user_session_token', data.session_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            console.log('Login: User data from login.php in handleLogin:', data.user);
            
            // Redirect based on completion status
            redirectUserBasedOnStatus(data.next_step, null, data.user);
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
        const data = await apiFetch('forgot_password.php', {
            method: 'POST',
            body: JSON.stringify({
                phone: countryCode + phoneNumber
            })
        });

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

function showInfoMessage(message) {
    // Create or show info message element
    let infoDiv = document.getElementById('infoMessage');
    if (!infoDiv) {
        // Create info message element if it doesn't exist
        infoDiv = document.createElement('div');
        infoDiv.id = 'infoMessage';
        infoDiv.className = 'bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4';
        infoDiv.innerHTML = '<i class="fas fa-info-circle mr-2"></i><span id="infoText"></span>';
        
        // Insert after the header but before the form
        const loginForm = document.getElementById('loginForm');
        loginForm.parentNode.insertBefore(infoDiv, loginForm);
    }
    
    const infoText = document.getElementById('infoText');
    infoText.textContent = message;
    infoDiv.classList.remove('hidden');
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        infoDiv.classList.add('hidden');
    }, 10000);
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

/**
 * Redirect user based on their completion status
 * @param {string} nextStep - The next step for the user (intro_required, profile_required, completed, dashboard)
 * @param {string|null} invitationCode - The invitation code if user was created via invitation
 * @param {object} userData - The user data object
 */
function redirectUserBasedOnStatus(nextStep, invitationCode, userData) {
    console.log('User next step:', nextStep);
    
    switch (nextStep) {
        case 'intro_required':
            // User needs to complete intro questions (no invitation code needed after login)
            window.location.href = 'getIntro.html';
            break;
            
        case 'profile_required':
            // User completed intro but needs to complete profile
            const currentStep = determineProfileStep(userData);
            window.location.href = `profile_completion.html?step=${currentStep}`;
            break;
            
        case 'completed':
            // User has completed everything, go to dashboard
            window.location.href = 'dashboard.html';
            break;
            
        case 'dashboard':
        default:
            // Default case - go to dashboard
            window.location.href = 'dashboard.html';
            break;
    }
}

/**
 * Determine which profile completion step the user should start from
 * @param {object} userData - The user data object
 * @returns {number} The step number to start from
 */
function determineProfileStep(userData) {
    // If user has a specific completion step, use it
    if (userData.profile_completion_step) {
        switch (userData.profile_completion_step) {
            case 'intro':
            case 'questions':
            case 'member_details':
                return 1; // Member details
            case 'spouse_details':
                return 2; // Spouse details
            case 'children_details':
                return 3; // Children details
            case 'member_family_tree':
                return 4; // Member family tree
            case 'spouse_family_tree':
                return 5; // Spouse family tree
            case 'completed':
                return 1; // Should not reach here, but default to step 1
            default:
                return 1;
        }
    }
    
    // Default to step 1 if no specific step is set
    return 1;
}

/**
 * Determine the next step for a user based on their completion status
 * @param {object} userData - The user data object
 * @returns {string} The next step (intro_required, profile_required, completed, dashboard)
 */
function determineUserNextStep(userData) {
    // Check if user was created via invitation
    if (userData.created_via_invitation) {
        // Check intro completion
        if (!userData.intro_completed || !userData.questions_completed) {
            return 'intro_required';
        }
        
        // Check profile completion
        if (!userData.profile_completion_step || userData.profile_completion_step !== 'completed') {
            return 'profile_required';
        }
        
        // Everything completed
        return 'completed';
    }
    
    // For non-invitation users, use the old logic
    if (!userData.profile_completed) {
        return 'profile_required';
    }
    
    return 'dashboard';
}

/**
 * Get invitation code for a user (helper function for existing session check)
 * @param {number} userId - The user ID
 * @returns {Promise<string|null>} The invitation code or null
 */
async function getInvitationCode(userId) {
    try {
        // This would require a new API endpoint or we can get it from user data
        // For now, return null as it's not critical for existing sessions
        return null;
    } catch (error) {
        console.error('Error getting invitation code:', error);
        return null;
    }
}
