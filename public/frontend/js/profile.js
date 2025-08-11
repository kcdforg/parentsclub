// Profile completion functionality
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadExistingProfile();
    initializeEventListeners();
});

let sessionToken = localStorage.getItem('user_session_token');
let userData = JSON.parse(localStorage.getItem('user_data') || '{}');

function checkAuthentication() {
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }
    
    // Show enrollment number if available
    if (userData.enrollment_number) {
        document.getElementById('enrollmentNumber').value = userData.enrollment_number;
    }
}

async function loadExistingProfile() {
    try {
        const response = await fetch('../backend/profile.php', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.profile) {
                populateForm(data.profile);
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function populateForm(profile) {
    document.getElementById('fullName').value = profile.full_name || '';
    document.getElementById('dateOfBirth').value = profile.date_of_birth || '';
    
    // Handle phone number - extract number part without country code
    if (profile.phone) {
        const countryCodeSelect = document.getElementById('countryCode');
        let phoneNumber = profile.phone;
        
        // Detect country code from phone number
        if (phoneNumber.startsWith('+91')) {
            countryCodeSelect.value = '+91';
            phoneNumber = phoneNumber.substring(3); // Remove +91
        } else if (phoneNumber.startsWith('+1')) {
            countryCodeSelect.value = '+1';
            phoneNumber = phoneNumber.substring(2); // Remove +1
        } else if (phoneNumber.startsWith('+44')) {
            countryCodeSelect.value = '+44';
            phoneNumber = phoneNumber.substring(3); // Remove +44
        } else if (phoneNumber.startsWith('+61')) {
            countryCodeSelect.value = '+61';
            phoneNumber = phoneNumber.substring(3); // Remove +61
        } else if (phoneNumber.startsWith('+81')) {
            countryCodeSelect.value = '+81';
            phoneNumber = phoneNumber.substring(3); // Remove +81
        }
        
        document.getElementById('phone').value = phoneNumber;
        
        // Trigger country code change event to update validation
        const event = new Event('change');
        countryCodeSelect.dispatchEvent(event);
    } else {
        document.getElementById('phone').value = '';
    }
    
    document.getElementById('address').value = profile.address || '';
    document.getElementById('pinCode').value = profile.pin_code || '';
    
    if (profile.enrollment_number) {
        document.getElementById('enrollmentNumber').value = profile.enrollment_number;
    }
}

function initializeEventListeners() {
    const profileForm = document.getElementById('profileForm');
    const skipBtn = document.getElementById('skipBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const goToDashboard = document.getElementById('goToDashboard');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    console.log('Initializing event listeners, elements found:', {
        profileForm: !!profileForm,
        skipBtn: !!skipBtn,
        logoutBtn: !!logoutBtn,
        goToDashboard: !!goToDashboard,
        saveProfileBtn: !!saveProfileBtn
    });

    // Set default date to current date
    setDefaultDate();

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Form validation
    document.getElementById('pinCode').addEventListener('input', function(e) {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('phone').addEventListener('input', function(e) {
        // Only allow digits
        let value = e.target.value.replace(/\D/g, '');
        const countryCode = document.getElementById('countryCode').value;
        
        // Set appropriate length limits based on country code
        let maxLength = 10; // Default for India
        if (countryCode === '+1' || countryCode === '+44') {
            maxLength = 10;
        } else if (countryCode === '+61') {
            maxLength = 9;
        } else if (countryCode === '+81') {
            maxLength = 11;
        }
        
        // Limit digits based on country
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        e.target.value = value;
        
        // Real-time validation feedback
        if (value.length > 0) {
            if (countryCode === '+91') {
                // Indian validation: exactly 10 digits starting with 6-9
                if (value.length === 10 && /^[6-9]/.test(value)) {
                    e.target.classList.remove('border-red-300');
                    e.target.classList.add('border-green-300');
                } else {
                    e.target.classList.remove('border-green-300');
                    e.target.classList.add('border-red-300');
                }
            } else {
                // International validation: appropriate length for country
                if (value.length >= 7 && value.length <= maxLength) {
                    e.target.classList.remove('border-red-300');
                    e.target.classList.add('border-green-300');
                } else {
                    e.target.classList.remove('border-green-300');
                    e.target.classList.add('border-red-300');
                }
            }
        } else {
            e.target.classList.remove('border-red-300', 'border-green-300');
        }
    });

    document.getElementById('dateOfBirth').addEventListener('change', validateAge);

    // Country code change listener to update phone validation
    document.getElementById('countryCode').addEventListener('change', function(e) {
        const phoneInput = document.getElementById('phone');
        const phoneHelp = document.getElementById('phoneHelp');
        const countryCode = e.target.value;
        
        phoneInput.value = ''; // Clear phone when country changes
        phoneInput.classList.remove('border-red-300', 'border-green-300');
        
        // Update help text and max length based on country
        switch(countryCode) {
            case '+91':
                phoneHelp.textContent = '🇮🇳 Enter 10 digits starting with 6, 7, 8, or 9';
                phoneInput.maxLength = 10;
                phoneInput.placeholder = '9876543210';
                break;
            case '+1':
                phoneHelp.textContent = '🇺🇸 Enter 10 digits (area code + number)';
                phoneInput.maxLength = 10;
                phoneInput.placeholder = '2345678901';
                break;
            case '+44':
                phoneHelp.textContent = '🇬🇧 Enter 10 digits without leading 0';
                phoneInput.maxLength = 10;
                phoneInput.placeholder = '7123456789';
                break;
            case '+61':
                phoneHelp.textContent = '🇦🇺 Enter 9 digits without leading 0';
                phoneInput.maxLength = 9;
                phoneInput.placeholder = '412345678';
                break;
            case '+81':
                phoneHelp.textContent = '🇯🇵 Enter 10-11 digits';
                phoneInput.maxLength = 11;
                phoneInput.placeholder = '9012345678';
                break;
            default:
                phoneHelp.textContent = '📱 Enter phone number (7-15 digits)';
                phoneInput.maxLength = 15;
                phoneInput.placeholder = '1234567890';
        }
    });

    // DOB change validation
    const dobInput = document.getElementById('dateOfBirth');
    if (dobInput) {
        dobInput.addEventListener('change', function() {
            const dobHelp = document.getElementById('dobHelp');
            const today = new Date();
            const todayDateString = today.toISOString().split('T')[0];
            
            if (dobInput.value === todayDateString) {
                dobInput.classList.add('border-orange-500');
                dobInput.classList.remove('border-gray-300');
                if (dobHelp) {
                    dobHelp.textContent = '⚠️ Please enter your actual date of birth, not today\'s date';
                    dobHelp.className = 'text-orange-600 text-sm mt-1';
                }
            } else if (dobInput.value) {
                const dob = new Date(dobInput.value);
                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                
                dobInput.classList.remove('border-orange-500');
                dobInput.classList.add('border-gray-300');
                
                if (dobHelp) {
                    if (age < 18) {
                        dobHelp.textContent = `❌ Age: ${age} years (must be 18 or older)`;
                        dobHelp.className = 'text-red-600 text-sm mt-1';
                        dobInput.classList.add('border-red-500');
                        dobInput.classList.remove('border-gray-300');
                    } else {
                        dobHelp.textContent = `✅ Age: ${age} years`;
                        dobHelp.className = 'text-green-600 text-sm mt-1';
                        dobInput.classList.remove('border-red-500');
                        dobInput.classList.add('border-green-500');
                    }
                }
            }
        });
    }

    // Form submission
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmission);
        console.log('Form submit listener attached');
    } else {
        console.error('Profile form not found!');
    }
    
    // Also add click listener to button as fallback
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function(e) {
            console.log('Save button clicked');
            if (profileForm) {
                profileForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    // Skip button
    skipBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Profile redirect after completion
    goToDashboard.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });
}

function setDefaultDate() {
    const dobInput = document.getElementById('dateOfBirth');
    if (!dobInput.value) {
        // Set default to today's date - user can change to their actual birth date
        const today = new Date();
        dobInput.value = today.toISOString().split('T')[0];
        
        // Also set max date to today (can't be born in the future)
        dobInput.max = today.toISOString().split('T')[0];
        
        // Set min date to 100 years ago (reasonable limit)
        const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        dobInput.min = hundredYearsAgo.toISOString().split('T')[0];
    }
}

function validateAge() {
    const dobInput = document.getElementById('dateOfBirth');
    
    if (!dobInput.value) {
        dobInput.classList.add('border-red-500');
        dobInput.classList.remove('border-gray-300');
        showError('Please enter your date of birth');
        return false;
    }
    
    const dob = new Date(dobInput.value);
    const today = new Date();
    
    // Check if user is trying to submit today's date (the default)
    const dobDateString = dobInput.value;
    const todayDateString = today.toISOString().split('T')[0];
    
    if (dobDateString === todayDateString) {
        dobInput.classList.add('border-red-500');
        dobInput.classList.remove('border-gray-300');
        showError('Please enter your actual date of birth. You cannot use today\'s date.');
        return false;
    }
    
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    if (age < 18) {
        dobInput.classList.add('border-red-500');
        dobInput.classList.remove('border-gray-300');
        showError('You must be at least 18 years old to register');
        return false;
    } else {
        dobInput.classList.remove('border-red-500');
        dobInput.classList.add('border-gray-300');
        hideError();
        return true;
    }
}

async function handleProfileSubmission(e) {
    e.preventDefault();
    console.log('Profile form submitted');
    
    const formData = new FormData(e.target);
    const countryCode = document.getElementById('countryCode').value;
    let phoneNumber = formData.get('phone').trim();
    
    // Remove country code if it's already in the phone number to prevent duplication
    if (phoneNumber.startsWith(countryCode)) {
        phoneNumber = phoneNumber.substring(countryCode.length);
    }
    
    // Remove any non-digit characters from phone number
    phoneNumber = phoneNumber.replace(/\D/g, '');
    
    const profileData = {
        full_name: formData.get('full_name').trim(),
        date_of_birth: formData.get('date_of_birth'),
        phone: countryCode + phoneNumber,
        address: formData.get('address').trim(),
        pin_code: formData.get('pin_code').trim()
    };

    console.log('Profile data:', profileData);

    // Client-side validation
    if (!validateFormData(profileData)) {
        console.log('Validation failed');
        return;
    }
    
    console.log('Validation passed, submitting to API');

    setLoading(true);
    hideError();
    hideSuccess();

    try {
        const response = await fetch('../backend/profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (data.success) {
            // Update user data
            userData.profile_completed = true;
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Show completion modal
            document.getElementById('completionModal').classList.remove('hidden');
        } else {
            showError(data.error || 'Failed to save profile');
        }
    } catch (error) {
        console.error('Profile submission error:', error);
        showError('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
}

function validateFormData(data) {
    // Required fields check
    const requiredFields = ['full_name', 'date_of_birth', 'phone', 'address', 'pin_code'];
    for (const field of requiredFields) {
        if (!data[field]) {
            showError(`Please fill in the ${field.replace('_', ' ')} field`);
            return false;
        }
    }

    // Name validation
    if (data.full_name.length < 2) {
        showError('Full name must be at least 2 characters long');
        return false;
    }

    // Date validation
    if (!validateAge()) {
        return false;
    }

    // PIN code validation
    if (!/^\d{6}$/.test(data.pin_code)) {
        showError('PIN code must be exactly 6 digits');
        return false;
    }

    // Phone validation
    const countryCode = document.getElementById('countryCode').value;
    // Extract only the phone number part (without country code)
    const phoneNumber = data.phone.replace(countryCode, '').replace(/\D/g, '');
    
    if (countryCode === '+91') {
        // Indian phone number validation - exactly 10 digits starting with 6-9
        if (phoneNumber.length !== 10) {
            showError('Indian mobile number must be exactly 10 digits');
            return false;
        }
        if (!/^[6-9]/.test(phoneNumber)) {
            showError('Indian mobile number must start with 6, 7, 8, or 9');
            return false;
        }
    } else if (countryCode === '+1') {
        // US/Canada: 10 digits
        if (phoneNumber.length !== 10) {
            showError('US/Canada phone number must be exactly 10 digits');
            return false;
        }
    } else if (countryCode === '+44') {
        // UK: 10 digits
        if (phoneNumber.length !== 10) {
            showError('UK phone number must be exactly 10 digits');
            return false;
        }
    } else if (countryCode === '+61') {
        // Australia: 9 digits
        if (phoneNumber.length !== 9) {
            showError('Australian phone number must be exactly 9 digits');
            return false;
        }
    } else if (countryCode === '+81') {
        // Japan: 10-11 digits
        if (phoneNumber.length < 10 || phoneNumber.length > 11) {
            showError('Japanese phone number must be 10-11 digits');
            return false;
        }
    } else {
        // General international validation
        if (phoneNumber.length < 7 || phoneNumber.length > 15) {
            showError('Please enter a valid phone number (7-15 digits)');
            return false;
        }
    }

    // Address validation
    if (data.address.length < 10) {
        showError('Please provide a complete address');
        return false;
    }

    return true;
}

async function handleLogout() {
    // Prevent multiple clicks
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.disabled = true;
        const originalContent = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging out...';
    }

    try {
        const response = await fetch('../backend/logout.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        // Wait for response and check if successful
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Server logout successful, now clear local data
                localStorage.removeItem('user_session_token');
                localStorage.removeItem('user_data');
                
                // Redirect to login
                window.location.href = 'login.html';
                return;
            } else {
                throw new Error(data.error || 'Logout failed');
            }
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if server logout fails, clear local data and redirect
        // This ensures user isn't stuck in a loop
        localStorage.removeItem('user_session_token');
        localStorage.removeItem('user_data');
        window.location.href = 'login.html';
    }
}

// Helper functions
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successDiv.classList.remove('hidden');
}

function hideSuccess() {
    document.getElementById('successMessage').classList.add('hidden');
}

function setLoading(loading) {
    const saveBtn = document.getElementById('saveProfileBtn');
    const saveBtnText = document.getElementById('saveProfileBtnText');
    const saveBtnSpinner = document.getElementById('saveProfileBtnSpinner');
    
    saveBtn.disabled = loading;
    
    if (loading) {
        saveBtnText.textContent = 'Saving...';
        saveBtnSpinner.classList.remove('hidden');
    } else {
        saveBtnText.textContent = 'Complete Profile';
        saveBtnSpinner.classList.add('hidden');
    }
}
