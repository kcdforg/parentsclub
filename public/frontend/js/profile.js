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
    document.getElementById('phone').value = profile.phone || '';
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

    // Form validation
    document.getElementById('pinCode').addEventListener('input', function(e) {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('phone').addEventListener('input', function(e) {
        // Format phone number
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 10) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        e.target.value = value;
    });

    document.getElementById('dateOfBirth').addEventListener('change', validateAge);

    // Form submission
    profileForm.addEventListener('submit', handleProfileSubmission);

    // Skip button
    skipBtn.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Dashboard redirect
    goToDashboard.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });
}

function validateAge() {
    const dobInput = document.getElementById('dateOfBirth');
    const dob = new Date(dobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
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
    
    const formData = new FormData(e.target);
    const profileData = {
        full_name: formData.get('full_name').trim(),
        date_of_birth: formData.get('date_of_birth'),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        pin_code: formData.get('pin_code').trim()
    };

    // Client-side validation
    if (!validateFormData(profileData)) {
        return;
    }

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
    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        showError('Please enter a valid phone number');
        return false;
    }

    // Address validation
    if (data.address.length < 10) {
        showError('Please provide a complete address');
        return false;
    }

    return true;
}

async function handleLogout() {
    try {
        await fetch('../backend/logout.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('user_session_token');
    localStorage.removeItem('user_data');
    
    // Redirect to login
    window.location.href = 'login.html';
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
