/**
 * Location Utilities
 * Handles district and post office area functionality
 */

import { apiFetch } from './api.js';

// Cache for location data
let locationCache = {
    states: [],
    districts: new Map(),
    postOffices: new Map()
};

/**
 * Initialize location functionality for a form
 * @param {string} formSelector - CSS selector for the form
 */
export function initializeLocationFields(formSelector = 'form') {
    const form = document.querySelector(formSelector);
    if (!form) return;

    const stateSelect = form.querySelector('#state, [name="state"]');
    const districtSelect = form.querySelector('#district, [name="district"]');
    const pinCodeInput = form.querySelector('#pinCode, [name="pin_code"]');
    const postOfficeSelect = form.querySelector('#postOfficeArea, [name="post_office_area"]');

    if (stateSelect) {
        loadStates(stateSelect);
        stateSelect.addEventListener('change', () => {
            const selectedState = stateSelect.value;
            if (selectedState && districtSelect) {
                loadDistricts(selectedState, districtSelect);
            } else if (districtSelect) {
                clearSelect(districtSelect, 'Select District');
                districtSelect.disabled = true;
            }
        });
    }

    if (pinCodeInput && postOfficeSelect) {
        pinCodeInput.addEventListener('input', debounce(() => {
            const pinCode = pinCodeInput.value.trim();
            if (pinCode.length === 6) {
                loadPostOffices(pinCode, postOfficeSelect);
            } else {
                clearSelect(postOfficeSelect, 'Select Post Office Area');
                postOfficeSelect.disabled = true;
            }
        }, 500));
    }
}

/**
 * Load states into a select element
 * @param {HTMLSelectElement} selectElement 
 */
async function loadStates(selectElement) {
    if (locationCache.states.length > 0) {
        populateSelect(selectElement, locationCache.states.map(state => ({ value: state, text: state })));
        return;
    }

    try {
        const response = await apiFetch('districts.php');
        if (response.success) {
            locationCache.states = response.data;
            populateSelect(selectElement, response.data.map(state => ({ value: state, text: state })));
        }
    } catch (error) {
        console.error('Error loading states:', error);
        showLocationError('Failed to load states');
    }
}

/**
 * Load districts for a state into a select element
 * @param {string} state 
 * @param {HTMLSelectElement} selectElement 
 */
async function loadDistricts(state, selectElement) {
    const cacheKey = state;
    
    if (locationCache.districts.has(cacheKey)) {
        const districts = locationCache.districts.get(cacheKey);
        populateSelect(selectElement, districts.map(district => ({ value: district.name, text: district.name })));
        selectElement.disabled = false;
        return;
    }

    try {
        selectElement.disabled = true;
        clearSelect(selectElement, 'Loading districts...');
        
        const response = await apiFetch(`districts.php?state=${encodeURIComponent(state)}`);
        if (response.success) {
            locationCache.districts.set(cacheKey, response.data);
            populateSelect(selectElement, response.data.map(district => ({ value: district.name, text: district.name })));
            selectElement.disabled = false;
        }
    } catch (error) {
        console.error('Error loading districts:', error);
        clearSelect(selectElement, 'Failed to load districts');
        selectElement.disabled = true;
        showLocationError('Failed to load districts');
    }
}

/**
 * Load post offices for a PIN code into a select element
 * @param {string} pinCode 
 * @param {HTMLSelectElement} selectElement 
 */
async function loadPostOffices(pinCode, selectElement) {
    const cacheKey = pinCode;
    
    if (locationCache.postOffices.has(cacheKey)) {
        const postOffices = locationCache.postOffices.get(cacheKey);
        populatePostOfficesSelect(selectElement, postOffices);
        selectElement.disabled = false;
        return;
    }

    try {
        selectElement.disabled = true;
        clearSelect(selectElement, 'Loading post offices...');
        
        const response = await apiFetch(`post_offices.php?pin_code=${encodeURIComponent(pinCode)}`);
        if (response.success) {
            locationCache.postOffices.set(cacheKey, response.data);
            populatePostOfficesSelect(selectElement, response.data);
            selectElement.disabled = response.data.length === 0;
            
            if (response.data.length === 0) {
                clearSelect(selectElement, 'No post offices found for this PIN code');
            }
        }
    } catch (error) {
        console.error('Error loading post offices:', error);
        clearSelect(selectElement, 'Failed to load post offices');
        selectElement.disabled = true;
        showLocationError('Failed to load post offices');
    }
}

/**
 * Populate a select element with options
 * @param {HTMLSelectElement} selectElement 
 * @param {Array} options - Array of {value, text} objects
 */
function populateSelect(selectElement, options) {
    // Keep the first option (placeholder)
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(firstOption);
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectElement.appendChild(optionElement);
    });
}

/**
 * Populate post offices select with detailed information
 * @param {HTMLSelectElement} selectElement 
 * @param {Array} postOffices 
 */
function populatePostOfficesSelect(selectElement, postOffices) {
    // Keep the first option (placeholder)
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(firstOption);
    
    postOffices.forEach(office => {
        const optionElement = document.createElement('option');
        optionElement.value = office.office_name;
        optionElement.textContent = `${office.office_name} (${office.office_type})`;
        optionElement.dataset.district = office.district;
        optionElement.dataset.state = office.state;
        selectElement.appendChild(optionElement);
    });
}

/**
 * Clear a select element and set placeholder text
 * @param {HTMLSelectElement} selectElement 
 * @param {string} placeholderText 
 */
function clearSelect(selectElement, placeholderText) {
    selectElement.innerHTML = `<option value="">${placeholderText}</option>`;
}

/**
 * Show location-related error message
 * @param {string} message 
 */
function showLocationError(message) {
    console.error('Location Error:', message);
    // You can implement a toast notification here if needed
}

/**
 * Debounce function to limit API calls
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get selected post office details
 * @param {HTMLSelectElement} postOfficeSelect 
 * @returns {Object|null}
 */
export function getSelectedPostOfficeDetails(postOfficeSelect) {
    const selectedOption = postOfficeSelect.options[postOfficeSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) return null;
    
    return {
        office_name: selectedOption.value,
        district: selectedOption.dataset.district,
        state: selectedOption.dataset.state
    };
}

/**
 * Auto-populate district based on post office selection
 * @param {HTMLSelectElement} postOfficeSelect 
 * @param {HTMLSelectElement} districtSelect 
 * @param {HTMLSelectElement} stateSelect 
 */
export function autoPopulateFromPostOffice(postOfficeSelect, districtSelect, stateSelect) {
    const details = getSelectedPostOfficeDetails(postOfficeSelect);
    if (!details) return;
    
    // Auto-populate state if it's not already set
    if (stateSelect && !stateSelect.value && details.state) {
        stateSelect.value = details.state;
        // Trigger change event to load districts
        stateSelect.dispatchEvent(new Event('change'));
        
        // Wait for districts to load, then set district
        setTimeout(() => {
            if (districtSelect && !districtSelect.value && details.district) {
                districtSelect.value = details.district;
            }
        }, 1000);
    } else if (districtSelect && !districtSelect.value && details.district) {
        districtSelect.value = details.district;
    }
}

/**
 * Pre-populate location fields with existing data
 * @param {Object} data - Object containing state, district, post_office_area
 * @param {string} formSelector - CSS selector for the form
 */
export async function prePopulateLocationFields(data, formSelector = 'form') {
    const form = document.querySelector(formSelector);
    if (!form) return;

    const stateSelect = form.querySelector('#state, [name="state"]');
    const districtSelect = form.querySelector('#district, [name="district"]');
    const postOfficeSelect = form.querySelector('#postOfficeArea, [name="post_office_area"]');

    // Set state first
    if (stateSelect && data.state) {
        await loadStates(stateSelect);
        stateSelect.value = data.state;
        
        // Load and set district
        if (districtSelect && data.district) {
            await loadDistricts(data.state, districtSelect);
            districtSelect.value = data.district;
        }
    }

    // Set post office area if available
    if (postOfficeSelect && data.post_office_area && data.pin_code) {
        await loadPostOffices(data.pin_code, postOfficeSelect);
        postOfficeSelect.value = data.post_office_area;
    }
}
