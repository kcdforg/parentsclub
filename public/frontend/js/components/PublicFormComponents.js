/**
 * PublicFormComponents
 * Reusable form components for public user pages
 */

export class PublicFormComponents {
    
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
            defaultCountry = '+91',
            helpText = 'Enter your 10-digit phone number without country code'
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
                <label for="${phoneInputId}" class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
                <div class="flex">
                    <select id="${countryCodeId}" name="country_code" 
                            class="px-3 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50">
                        ${countryOptions}
                    </select>
                    <input type="tel" id="${phoneInputId}" name="phone" ${required ? 'required' : ''} maxlength="10"
                           class="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                           placeholder="${placeholder}">
                </div>
                <p class="text-xs text-gray-500 mt-1">${helpText}</p>
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
            icon = null,
            size = 'default' // 'sm', 'default', 'lg'
        } = config;

        const sizeClasses = {
            sm: 'py-2 text-sm',
            default: 'py-3',
            lg: 'py-4 text-lg'
        };

        const iconHTML = icon ? `<i class="${icon} absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>` : '';
        const inputClass = icon 
            ? `w-full pl-10 pr-4 ${sizeClasses[size]} border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`
            : `w-full px-4 ${sizeClasses[size]} border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`;

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
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
            toggleId = `${id}Toggle`,
            size = 'default'
        } = config;

        const sizeClasses = {
            sm: 'py-2 text-sm',
            default: 'py-3',
            lg: 'py-4 text-lg'
        };

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
                <div class="relative">
                    <input type="password" id="${id}" name="${name}" ${required ? 'required' : ''}
                           placeholder="${placeholder}"
                           class="w-full pl-10 pr-12 ${sizeClasses[size]} border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
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
            placeholder = 'Select an option',
            helpText = ''
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
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
                <select id="${id}" name="${name}" ${required ? 'required' : ''}
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    ${optionsHTML}
                </select>
                ${helpText ? `<p class="text-xs text-gray-500 mt-1">${helpText}</p>` : ''}
            </div>
        `;
    }

    /**
     * Creates a textarea input
     */
    static createTextarea(config = {}) {
        const {
            id,
            name = id,
            label,
            placeholder = '',
            required = false,
            rows = 4,
            value = '',
            helpText = ''
        } = config;

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
                <textarea id="${id}" name="${name}" ${required ? 'required' : ''} rows="${rows}"
                          placeholder="${placeholder}"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical">${value}</textarea>
                ${helpText ? `<p class="text-xs text-gray-500 mt-1">${helpText}</p>` : ''}
            </div>
        `;
    }

    /**
     * Creates a checkbox input
     */
    static createCheckbox(config = {}) {
        const {
            id,
            name = id,
            label,
            required = false,
            checked = false,
            helpText = ''
        } = config;

        return `
            <div class="flex items-center">
                <input type="checkbox" id="${id}" name="${name}" ${required ? 'required' : ''} ${checked ? 'checked' : ''}
                       class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                <label for="${id}" class="ml-2 block text-sm text-gray-700">${label}</label>
            </div>
            ${helpText ? `<p class="text-xs text-gray-500 mt-1">${helpText}</p>` : ''}
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
            icon = null,
            size = 'default'
        } = config;

        const variantClasses = {
            primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
            success: 'bg-green-600 hover:bg-green-700 text-white',
            danger: 'bg-red-600 hover:bg-red-700 text-white',
            outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
        };

        const sizeClasses = {
            sm: 'py-2 px-3 text-sm',
            default: 'py-3 px-4',
            lg: 'py-4 px-6 text-lg'
        };

        const widthClass = fullWidth ? 'w-full' : '';
        const iconHTML = icon ? `<i class="${icon} mr-2"></i>` : '';

        return `
            <button type="submit" id="${id}"
                    class="${widthClass} ${variantClasses[variant]} ${sizeClasses[size]} font-medium rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
     * Creates an info message container
     */
    static createInfoContainer(id, variant = 'blue') {
        const variantClasses = {
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
        };

        return `
            <div id="${id}" class="hidden ${variantClasses[variant]} border px-4 py-3 rounded-lg">
                <i class="fas fa-info-circle mr-2"></i>
                <span id="${id}Text"></span>
            </div>
        `;
    }

    /**
     * Creates a progress indicator for multi-step forms
     */
    static createProgressIndicator(config = {}) {
        const {
            steps = [],
            currentStep = 0,
            containerId = 'progressIndicator'
        } = config;

        const stepsHTML = steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const stepNumber = index + 1;

            let stepClasses = 'flex items-center';
            let circleClasses = 'flex items-center justify-center w-8 h-8 rounded-full border-2';
            let lineClasses = 'flex-auto border-t-2';

            if (isCompleted) {
                circleClasses += ' bg-indigo-600 border-indigo-600 text-white';
                lineClasses += ' border-indigo-600';
            } else if (isCurrent) {
                circleClasses += ' border-indigo-600 text-indigo-600';
                lineClasses += ' border-gray-300';
            } else {
                circleClasses += ' border-gray-300 text-gray-500';
                lineClasses += ' border-gray-300';
            }

            const icon = isCompleted ? '<i class="fas fa-check text-sm"></i>' : stepNumber;
            const showLine = index < steps.length - 1;

            return `
                <div class="${stepClasses}">
                    <div class="${circleClasses}">
                        ${icon}
                    </div>
                    <div class="ml-4 min-w-0 flex-1">
                        <p class="text-sm font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}">${step.title}</p>
                        ${step.description ? `<p class="text-sm text-gray-500">${step.description}</p>` : ''}
                    </div>
                    ${showLine ? `<div class="${lineClasses} ml-4"></div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div id="${containerId}" class="mb-8">
                <nav aria-label="Progress">
                    <ol class="space-y-4 md:flex md:space-y-0 md:space-x-8">
                        ${stepsHTML}
                    </ol>
                </nav>
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
     * Shows an info message
     */
    static showInfo(containerId, message) {
        const container = document.getElementById(containerId);
        const textElement = document.getElementById(`${containerId}Text`);

        if (container) {
            container.classList.remove('hidden');
            if (textElement) {
                textElement.textContent = message;
            } else {
                container.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
            }
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
     * Validates password strength
     */
    static validatePasswordStrength(password, minLength = 6) {
        return {
            isValid: password.length >= minLength,
            length: password.length >= minLength,
            hasLowerCase: /[a-z]/.test(password),
            hasUpperCase: /[A-Z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSymbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
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

    /**
     * Creates a file upload input
     */
    static createFileInput(config = {}) {
        const {
            id,
            name = id,
            label,
            accept = '',
            required = false,
            multiple = false,
            helpText = ''
        } = config;

        return `
            <div>
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                    <div class="space-y-1 text-center">
                        <i class="fas fa-cloud-upload-alt text-gray-400 text-3xl mb-3"></i>
                        <div class="flex text-sm text-gray-600">
                            <label for="${id}" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                <span>Upload a file</span>
                                <input id="${id}" name="${name}" type="file" ${required ? 'required' : ''} ${multiple ? 'multiple' : ''} ${accept ? `accept="${accept}"` : ''} class="sr-only">
                            </label>
                            <p class="pl-1">or drag and drop</p>
                        </div>
                        ${helpText ? `<p class="text-xs text-gray-500">${helpText}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

// Auto-initialize password toggles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    PublicFormComponents.initializeAllPasswordToggles();
});
