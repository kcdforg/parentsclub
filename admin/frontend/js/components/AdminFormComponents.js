/**
 * AdminFormComponents
 * Reusable form components for admin pages
 */

export class AdminFormComponents {
    
    /**
     * Creates a country code selector with phone input
     */
    static createPhoneInput(config = {}) {
        const {
            countryCodeId = 'countryCode',
            phoneInputId = 'phone',
            label = 'Phone Number (10 digits)',
            placeholder = '9876543210',
            required = true,
            defaultCountry = '+91'
        } = config;

        const countries = [
            { code: '+91', flag: '🇮🇳', label: 'India' },
            { code: '+1', flag: '🇺🇸', label: 'USA' },
            { code: '+44', flag: '🇬🇧', label: 'UK' },
            { code: '+61', flag: '🇦🇺', label: 'Australia' },
            { code: '+81', flag: '🇯🇵', label: 'Japan' },
            { code: '+49', flag: '🇩🇪', label: 'Germany' },
            { code: '+33', flag: '🇫🇷', label: 'France' },
            { code: '+39', flag: '🇮🇹', label: 'Italy' },
            { code: '+34', flag: '🇪🇸', label: 'Spain' },
            { code: '+86', flag: '🇨🇳', label: 'China' }
        ];

        const countryOptions = countries.map(country => {
            const selected = country.code === defaultCountry ? 'selected' : '';
            return `<option value="${country.code}" ${selected}>${country.flag} ${country.code}</option>`;
        }).join('');

        return `
            <div>
                <label for="${phoneInputId}" class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                <div class="flex">
                    <select id="${countryCodeId}" name="country_code"
                            class="px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50">
                        ${countryOptions}
                    </select>
                    <input type="tel" id="${phoneInputId}" name="phone" ${required ? 'required' : ''} maxlength="10"
                           class="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="${placeholder}">
                </div>
                <p class="text-xs text-gray-500 mt-1">Enter 10-digit phone number without country code</p>
            </div>
        `;
    }

    /**
     * Creates a standard text input field
     */
    static createTextInput(config = {}) {
        const {
            id,
            name = id,
            label,
            placeholder = '',
            required = false,
            type = 'text',
            value = '',
            helpText = '',
            icon = null
        } = config;

        const iconHTML = icon ? `<i class="${icon} absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>` : '';
        const inputClass = icon 
            ? 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500'
            : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500';

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                <div class="relative">
                    <input type="${type}" id="${id}" name="${name}" ${required ? 'required' : ''} 
                           value="${value}" placeholder="${placeholder}"
                           class="${inputClass}">
                    ${iconHTML}
                </div>
                ${helpText ? `<p class="text-xs text-gray-500 mt-1">${helpText}</p>` : ''}
            </div>
        `;
    }

    /**
     * Creates a password input with toggle visibility
     */
    static createPasswordInput(config = {}) {
        const {
            id,
            name = id,
            label = 'Password',
            placeholder = 'Enter your password',
            required = true,
            toggleId = `${id}Toggle`
        } = config;

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                <div class="relative">
                    <input type="password" id="${id}" name="${name}" ${required ? 'required' : ''}
                           placeholder="${placeholder}"
                           class="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    <i class="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <button type="button" id="${toggleId}" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Creates a select dropdown
     */
    static createSelect(config = {}) {
        const {
            id,
            name = id,
            label,
            options = [],
            required = false,
            defaultValue = '',
            placeholder = 'Select an option'
        } = config;

        const optionsHTML = [
            placeholder ? `<option value="">${placeholder}</option>` : '',
            ...options.map(option => {
                if (typeof option === 'string') {
                    const selected = option === defaultValue ? 'selected' : '';
                    return `<option value="${option}" ${selected}>${option}</option>`;
                } else {
                    const selected = option.value === defaultValue ? 'selected' : '';
                    return `<option value="${option.value}" ${selected}>${option.label}</option>`;
                }
            })
        ].join('');

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                <select id="${id}" name="${name}" ${required ? 'required' : ''}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    ${optionsHTML}
                </select>
            </div>
        `;
    }

    /**
     * Creates a submit button with loading state
     */
    static createSubmitButton(config = {}) {
        const {
            id,
            text = 'Submit',
            loadingText = 'Processing...',
            variant = 'primary',
            fullWidth = true,
            icon = null
        } = config;

        const variantClasses = {
            primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
            success: 'bg-green-600 hover:bg-green-700 text-white',
            danger: 'bg-red-600 hover:bg-red-700 text-white'
        };

        const widthClass = fullWidth ? 'w-full' : '';
        const iconHTML = icon ? `<i class="${icon} mr-2"></i>` : '';

        return `
            <button type="submit" id="${id}"
                    class="${widthClass} ${variantClasses[variant]} font-medium py-2 px-4 rounded-md transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                ${iconHTML}
                <span id="${id}Text">${text}</span>
                <i id="${id}Spinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
            </button>
        `;
    }

    /**
     * Creates an error message container
     */
    static createErrorContainer(id) {
        return `
            <div id="${id}" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span id="${id}Text"></span>
            </div>
        `;
    }

    /**
     * Creates a success message container
     */
    static createSuccessContainer(id) {
        return `
            <div id="${id}" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <i class="fas fa-check-circle mr-2"></i>
                <span id="${id}Text"></span>
            </div>
        `;
    }

    /**
     * Shows/hides loading state for a button
     */
    static toggleButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        const buttonText = document.getElementById(`${buttonId}Text`);
        const buttonSpinner = document.getElementById(`${buttonId}Spinner`);

        if (!button) return;

        button.disabled = isLoading;
        
        if (buttonText) {
            buttonText.classList.toggle('hidden', isLoading);
        }
        
        if (buttonSpinner) {
            buttonSpinner.classList.toggle('hidden', !isLoading);
        }
    }

    /**
     * Shows an error message
     */
    static showError(containerId, message) {
        const container = document.getElementById(containerId);
        const textElement = document.getElementById(`${containerId}Text`);

        if (container) {
            container.classList.remove('hidden');
            if (textElement) {
                textElement.textContent = message;
            } else {
                container.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
            }
        }
    }

    /**
     * Hides an error message
     */
    static hideError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
        }
    }

    /**
     * Shows a success message
     */
    static showSuccess(containerId, message) {
        const container = document.getElementById(containerId);
        const textElement = document.getElementById(`${containerId}Text`);

        if (container) {
            container.classList.remove('hidden');
            if (textElement) {
                textElement.textContent = message;
            } else {
                container.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
            }
        }
    }

    /**
     * Hides a success message
     */
    static hideSuccess(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
        }
    }

    /**
     * Validates phone number format
     */
    static validatePhoneNumber(phoneNumber) {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phoneNumber);
    }

    /**
     * Validates email format
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Initializes password toggle functionality
     */
    static initializePasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = document.getElementById(toggleId);

        if (!passwordInput || !toggleButton) return;

        toggleButton.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }

    /**
     * Auto-initializes all password toggles on the page
     */
    static initializeAllPasswordToggles() {
        const toggleButtons = document.querySelectorAll('[id$="Toggle"]');
        
        toggleButtons.forEach(button => {
            const toggleId = button.id;
            const inputId = toggleId.replace('Toggle', '');
            this.initializePasswordToggle(inputId, toggleId);
        });
    }
}

// Auto-initialize password toggles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AdminFormComponents.initializeAllPasswordToggles();
});
