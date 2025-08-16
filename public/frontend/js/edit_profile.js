import { parsePhoneNumber } from './utils.js';
import { apiFetch } from './api.js';

// Define countries and states data
const countries = [
    { name: 'India', code: 'IN' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Australia', code: 'AU' },
    { name: 'Japan', code: 'JP' },
    { name: 'Germany', code: 'DE' },
    { name: 'France', code: 'FR' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'China', code: 'CN' },
    // Add more countries as needed
];

const indianStates = [
    'Tamil Nadu',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'BENGALURU',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
].sort(); // Sort alphabetically

// Move Tamil Nadu to the top
const tamilNaduIndex = indianStates.indexOf('Tamil Nadu');
if (tamilNaduIndex > -1) {
    const tamilNadu = indianStates.splice(tamilNaduIndex, 1)[0];
    indianStates.unshift(tamilNadu);
}

function populateCountries() {
    const countrySelect = document.getElementById('country');
    if (!countrySelect) return;

    // Clear existing options
    countrySelect.innerHTML = '';

    // Sort countries alphabetically, put India at the top
    const sortedCountries = [...countries].sort((a, b) => {
        if (a.name === 'India') return -1;
        if (b.name === 'India') return 1;
        return a.name.localeCompare(b.name);
    });

    sortedCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });

    // Set India as default selected
    countrySelect.value = 'India';

    // Add event listener for country change
    countrySelect.addEventListener('change', function() {
        populateStates(this.value);
    });
}

function populateStates(selectedCountry) {
    const stateSelect = document.getElementById('state');
    if (!stateSelect) return;

    stateSelect.innerHTML = ''; // Clear existing options

    if (selectedCountry === 'India') {
        indianStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    } else {
        // For non-Indian countries, provide a generic input or disable/hide state field
        const option = document.createElement('option');
        option.value = 'N/A';
        option.textContent = 'N/A (Not applicable for this country)';
        stateSelect.appendChild(option);
        stateSelect.disabled = true; // Disable state field for non-Indian countries
    }
    // Ensure state field is enabled for India
    if (selectedCountry === 'India') {
        stateSelect.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadExistingProfile(); // This should be specific to new completion flow
    initializeEventListeners();
});

let sessionToken = localStorage.getItem('user_session_token');
let userData = JSON.parse(localStorage.getItem('user_data') || '{}');
let initialFormState = {}; // Store initial form state to detect changes
let hasChanges = false; // Flag to track if changes have been made

function checkAuthentication() {
    if (!sessionToken) {
        window.location.href = 'login.php';
        return;
    }
    
    // Show enrollment number if available
    if (userData.enrollment_number) {
        document.getElementById('enrollmentNumber').value = userData.enrollment_number;
    }
}

async function loadExistingProfile() {
    try {
        const data = await apiFetch('profile.php', {
            method: 'GET'
        });

        console.log('API response data in loadExistingProfile (Edit Profile flow):', data);
        
        if (data.success && data.profile) {
            console.log('Profile data to populate (Edit Profile flow):', data.profile);
            populateForm(data.profile);
            // Store initial form state after populating
            initialFormState = getFormCurrentState();
            setHasChanges(false);
        }
    } catch (error) {
        console.error('Error loading profile (Add Personal Info flow):', error);
    }
}

function populateForm(profile) {
    console.log('Inside populateForm (Edit Profile flow), profile object:', profile);
    const fullName = profile.full_name || '';
    const [first, ...rest] = fullName.trim().split(' ');
    document.getElementById('firstName').value = first || '';
    document.getElementById('secondName').value = rest.join(' ') || '';
    document.getElementById('gender').value = profile.gender || ''; // Populate gender
    // Treat '0000-00-00' as empty for date of birth
    document.getElementById('dateOfBirth').value = (profile.date_of_birth === '0000-00-00' || !profile.date_of_birth) ? '' : profile.date_of_birth;
    
    let phoneToUse = profile.phone || userData.phone || '';
    
    if (profile.email) {
        document.getElementById('email').value = profile.email;
        document.getElementById('email').readOnly = true; // Email can be pre-filled and read-only if it came from registration
    } else {
        document.getElementById('email').value = userData.email || ''; // Use user_data email if no profile email
        document.getElementById('email').readOnly = false;
    }

    if (phoneToUse) {
        const { countryCode, phoneNumber } = parsePhoneNumber(phoneToUse);
        const countryCodeSelect = document.getElementById('countryCode');
        if (countryCodeSelect) countryCodeSelect.value = countryCode || '';
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = phoneNumber;
            // In completion flow, phone might be pre-filled and readonly
            phoneInput.readOnly = true;
            phoneInput.classList.remove('hidden');
        }
        const event = new Event('change');
        if (countryCodeSelect && phoneToUse) {
            // No longer dispatching, as this clears the field. Validation will be handled by input event.
        }
    } else {
        document.getElementById('phone').value = '';
    }
    
    // Handle new address fields
    const address = profile.address || '';
    const addressParts = address.split(', ').map(part => part.trim());
    
    document.getElementById('addressLine1').value = addressParts[0] || '';
    document.getElementById('addressLine2').value = addressParts[1] || '';
    document.getElementById('city').value = addressParts[2] || '';
    
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    
    if (countrySelect) {
        const savedCountry = addressParts[4] || 'India'; // Default to India
        countrySelect.value = savedCountry;
        populateStates(savedCountry); // Populate states based on saved country
    }
    
    if (stateSelect) {
        const savedState = addressParts[3] || '';
        stateSelect.value = savedState;
    }
    
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
    const cancelBtn = document.getElementById('cancelBtn');

    console.log('Initializing event listeners (edit flow), elements found:', {
        profileForm: !!profileForm,
        skipBtn: !!skipBtn,
        logoutBtn: !!logoutBtn,
        goToDashboard: !!goToDashboard,
        saveProfileBtn: !!saveProfileBtn,
        cancelBtn: !!cancelBtn
    });

    setDefaultDate();
    populateCountries();
    populateStates('India'); // Default to Indian states

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // User dropdown toggle (copied from dashboard.js)
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }

    // Populate username in header
    const userName = document.getElementById('userName');
    if (userName && userData.full_name) {
        userName.textContent = userData.full_name;
    }

    // Add event listeners to all form fields to detect changes
    const formElements = profileForm.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('input', () => setHasChanges(true));
        element.addEventListener('change', () => setHasChanges(true)); // For select and date inputs
    });

    document.getElementById('firstName').addEventListener('input', validateFirstName);
    const secondNameInput = document.getElementById('secondName');
    if (secondNameInput) secondNameInput.addEventListener('input', validateSecondName);
    
    document.getElementById('email').addEventListener('input', validateEmail); // Add listener for email validation
    
    document.getElementById('pinCode').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        const countryCode = document.getElementById('countryCode').value;
        
        let maxLength = 10; // Default for India
        if (countryCode === '+1' || countryCode === '+44') {
            maxLength = 10;
        } else if (countryCode === '+61') {
            maxLength = 9;
        } else if (countryCode === '+81') {
            maxLength = 11;
        }
        
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        e.target.value = value;
        
        if (value.length > 0) {
            if (countryCode === '+91') {
                if (value.length === 10 && /^[6-9]/.test(value)) {
                    e.target.classList.remove('border-red-300');
                    e.target.classList.add('border-green-300');
                } else {
                    e.target.classList.remove('border-green-300');
                    e.target.classList.add('border-red-300');
                }
            } else {
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

    document.getElementById('countryCode').addEventListener('change', function(e) {
        const phoneInput = document.getElementById('phone');
        const phoneHelp = document.getElementById('phoneHelp');
        const countryCode = e.target.value;
        
        // Only clear phone input if it's not read-only (i.e., not pre-populated)
        if (!phoneInput.readOnly) {
            phoneInput.value = ''; 
        }
        phoneInput.classList.remove('border-red-300', 'border-green-300');
        
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

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmission);
        console.log('Form submit listener attached');
    } else {
        console.error('Profile form not found!');
    }
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function(e) {
            console.log('Save button clicked');
            if (profileForm) {
                profileForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // If there are changes, prompt user before navigating
            if (hasChanges && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
            window.location.reload(); // Reloads the current page to revert changes
        });
    }

    logoutBtn.addEventListener('click', handleLogout);

    goToDashboard.addEventListener('click', function() {
        window.location.href = 'edit_profile.php';
    });
}

function getFormCurrentState() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    const state = {};
    for (let [key, value] of formData.entries()) {
        state[key] = value;
    }
    return JSON.stringify(state);
}

function setHasChanges(changed) {
    hasChanges = changed;
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        if (hasChanges) {
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
    }
}

function setDefaultDate() {
    const dobInput = document.getElementById('dateOfBirth');
    if (!dobInput.value) {
        const today = new Date();
        dobInput.value = today.toISOString().split('T')[0];
        
        dobInput.max = today.toISOString().split('T')[0];
        
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

function validateFirstName() {
    const input = document.getElementById('firstName');
    const val = input.value.trim();
    if (val && val.length < 2) {
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
    } else {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
    }
}

function validateSecondName() {
    const input = document.getElementById('secondName');
    const val = input.value.trim();
    if (val && val.length < 2) { // Second name is optional, but if entered, should be at least 2 chars
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
    } else {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
    }
}

// New helper function for email validation (from register.js, now needed here)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

async function handleProfileSubmission(e) {
    e.preventDefault();
    console.log('Profile form submitted');
    
    const formData = new FormData(e.target);
    const countryCode = document.getElementById('countryCode').value;
    let phoneNumber = formData.get('phone').trim();
    
    if (phoneNumber.startsWith(countryCode)) {
        phoneNumber = phoneNumber.substring(countryCode.length);
    }
    
    phoneNumber = phoneNumber.replace(/\D/g, '');
    
    const addressLine1 = (formData.get('address_line1') || '').trim();
    const addressLine2 = (formData.get('address_line2') || '').trim();
    const city = (formData.get('city') || '').trim();
    const state = (formData.get('state') || '').trim();
    const country = (formData.get('country') || '').trim();
    
    // Combine address parts into a single string for the backend
    const fullAddress = [addressLine1, addressLine2, city, state, country].filter(Boolean).join(', ');
    
    const profileData = {
        full_name: [
            (formData.get('first_name') || '').trim(),
            (formData.get('second_name') || '').trim()
        ].filter(Boolean).join(' ').trim(),
        date_of_birth: formData.get('date_of_birth'),
        email: (formData.get('email') || '').trim(), // Capture email from form
        phone: countryCode + phoneNumber,
        address: fullAddress, // Use the combined address string
        pin_code: formData.get('pin_code').trim(),
        gender: formData.get('gender') // Added gender to profileData
    };

    console.log('Profile data being sent:', profileData);

    if (!validateFormData(profileData)) {
        console.log('Validation failed');
        return;
    }
    
    console.log('Validation passed, submitting to API');

    setLoading(true);
    hideError();
    hideSuccess();

    try {
        const data = await apiFetch('profile.php', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        console.log('Profile API response:', data);

        if (data.success) {
            userData.profile_completed = true;
            // Update userData with new email if changed
            userData.email = profileData.email;
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Show success message and reload page after a delay
            showSuccess('Profile updated successfully!');
            setTimeout(() => {
                window.location.reload(); // Reloads the current page
            }, 1500);
        } else {
            showError(data.error || 'Failed to save profile');
        }
    } catch (error) {
        console.error('Profile submission error:', error);
        showError('Network error. Please try again.');
    } finally {
        setLoading(false);
        // After successful save, reset hasChanges flag
        if (data.success) {
            initialFormState = getFormCurrentState();
            setHasChanges(false);
        }
    }
}

function validateFormData(data) {
    const requiredFields = ['full_name', 'date_of_birth', 'pin_code', 'addressLine1', 'city', 'state', 'country', 'gender'];
    
    // Email or Phone is required
    if (!data.email && !data.phone) {
        showError('Please provide either an email address or phone number.');
        return false;
    }

    for (const field of requiredFields) {
        // Use a more robust check for address components which are now separate
        if (['addressLine1', 'city', 'state', 'country'].includes(field)) {
            if (!document.getElementById(field).value.trim()) {
                showError(`Please fill in the ${field.replace('_', ' ')} field`);
                return false;
            }
        } else if (!data[field]) {
            showError(`Please fill in the ${field.replace('_', ' ')} field`);
            return false;
        }
    }

    const firstName = document.getElementById('firstName').value.trim();
    if (firstName.length < 2) {
        showError('First name must be at least 2 characters long');
        return false;
    }
    const secondName = document.getElementById('secondName').value.trim();
    if (secondName && secondName.length < 2) {
        showError('Second name, if provided, must be at least 2 characters long');
        return false;
    }

    if (data.email && !isValidEmail(data.email)) {
        showError('Please enter a valid email address.');
        return false;
    }

    // Only validate phone if it's present
    if (data.phone) {
        const countryCode = document.getElementById('countryCode').value;
        const phoneNumber = data.phone.replace(countryCode, '').replace(/\D/g, '');
        
        if (countryCode === '+91') {
            if (phoneNumber.length !== 10) {
                showError('Indian mobile number must be exactly 10 digits');
                return false;
            }
            if (!/^[6-9]/.test(phoneNumber)) {
                showError('Indian mobile number must start with 6, 7, 8, or 9');
                return false;
            }
        } else if (countryCode === '+1') {
            if (phoneNumber.length !== 10) {
                showError('US/Canada phone number must be exactly 10 digits');
                return false;
            }
        } else if (countryCode === '+44') {
            if (phoneNumber.length !== 10) {
                showError('UK phone number must be exactly 10 digits');
                return false;
            }
        } else if (countryCode === '+61') {
            if (phoneNumber.length !== 9) {
                showError('Australian phone number must be exactly 9 digits');
                return false;
            }
        } else if (countryCode === '+81') {
            if (phoneNumber.length < 10 || phoneNumber.length > 11) {
                showError('Japanese phone number must be 10-11 digits');
                return false;
            }
        } else { // Generic international validation
            if (phoneNumber.length < 7 || phoneNumber.length > 15) {
                showError('Please enter a valid phone number (7-15 digits)');
                return false;
            }
        }
    }

    if (!validateAge()) {
        return false;
    }

    if (!/^\d{6}$/.test(data.pin_code)) {
        showError('PIN code must be exactly 6 digits');
        return false;
    }

    return true;
}

async function handleLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.disabled = true;
        const originalContent = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging out...';
    }

    try {
        await apiFetch('logout.php', {
            method: 'POST'
        });

        localStorage.removeItem('user_session_token');
        localStorage.removeItem('user_data');
        
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Logout error:', error);
        
        localStorage.removeItem('user_session_token');
        localStorage.removeItem('user_data');
        window.location.href = 'login.html';
    }
}

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
        saveBtnText.textContent = 'Save';
        saveBtnSpinner.classList.add('hidden');
    }
}
