/**
 * PublicModals Component
 * Reusable modal components for public user pages
 */

export class PublicModals {
    constructor() {
        this.modals = {};
    }

    /**
     * Generates the forgot password modal HTML structure
     */
    generateForgotPasswordModalHTML() {
        return `
            <div id="forgotPasswordModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Reset Password</h3>
                            <button id="closeForgotModalBtn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="mb-4">
                            <p class="text-sm text-gray-600 mb-4">
                                Enter your phone number and we'll send you instructions to reset your password.
                            </p>
                            <div class="space-y-4">
                                <div>
                                    <label for="resetPhone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div class="flex">
                                        <select id="resetCountryCode" name="reset_country_code" 
                                                class="px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50">
                                            <option value="+91" selected>🇮🇳 +91</option>
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+44">🇬🇧 +44</option>
                                            <option value="+61">🇦🇺 +61</option>
                                            <option value="+81">🇯🇵 +81</option>
                                            <option value="+49">🇩🇪 +49</option>
                                            <option value="+33">🇫🇷 +33</option>
                                            <option value="+39">🇮🇹 +39</option>
                                            <option value="+34">🇪🇸 +34</option>
                                            <option value="+86">🇨🇳 +86</option>
                                        </select>
                                        <input type="tel" id="resetPhone" name="reset_phone" required maxlength="10"
                                               class="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                                               placeholder="9876543210">
                                    </div>
                                </div>
                                <div id="resetError" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                                </div>
                                <div id="resetSuccess" class="hidden bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                    Password reset instructions have been sent to your email.
                                </div>
                                <div class="flex space-x-3">
                                    <button id="sendResetBtn"
                                            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <span id="resetBtnText">Send Instructions</span>
                                        <i id="resetBtnSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                                    </button>
                                    <button id="cancelResetBtn"
                                            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates a confirmation modal HTML structure
     */
    generateConfirmationModalHTML() {
        return `
            <div id="confirmationModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3 text-center">
                        <div id="confirmationModalIcon" class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                        </div>
                        <h3 id="confirmationModalTitle" class="text-lg leading-6 font-medium text-gray-900 mb-2">Confirm Action</h3>
                        <div class="mt-2 px-7 py-3">
                            <p id="confirmationModalMessage" class="text-sm text-gray-500">Are you sure you want to proceed?</p>
                        </div>
                        <div class="items-center px-4 py-3 space-y-3">
                            <button id="confirmationModalConfirmBtn" class="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                Confirm
                            </button>
                            <button id="confirmationModalCancelBtn" class="px-4 py-2 bg-gray-200 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates a general purpose modal HTML structure
     */
    generateGeneralModalHTML() {
        return `
            <div id="generalModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 id="generalModalTitle" class="text-lg font-medium text-gray-900">Modal Title</h3>
                            <button id="closeGeneralModalBtn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div id="generalModalContent" class="mb-4">
                            <!-- Dynamic content will be inserted here -->
                        </div>
                        <div id="generalModalActions" class="flex justify-end space-x-3">
                            <button id="generalModalCloseBtn" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates the toast container HTML structure
     */
    generateToastContainerHTML() {
        return `
            <div id="toastContainer" class="fixed bottom-4 right-4 z-[1001] space-y-3">
                <!-- Toasts will be appended here -->
            </div>
        `;
    }

    /**
     * Renders all modal components to the page
     */
    renderAllModals() {
        const body = document.body;
        
        // Add forgot password modal
        body.insertAdjacentHTML('beforeend', this.generateForgotPasswordModalHTML());
        
        // Add confirmation modal
        body.insertAdjacentHTML('beforeend', this.generateConfirmationModalHTML());
        
        // Add general modal
        body.insertAdjacentHTML('beforeend', this.generateGeneralModalHTML());
        
        // Add toast container
        body.insertAdjacentHTML('beforeend', this.generateToastContainerHTML());
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for modal interactions
     */
    initializeEventListeners() {
        this.initializeForgotPasswordModal();
        this.initializeConfirmationModal();
        this.initializeGeneralModal();
    }

    /**
     * Initialize forgot password modal event listeners
     */
    initializeForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        const closeBtn = document.getElementById('closeForgotModalBtn');
        const cancelBtn = document.getElementById('cancelResetBtn');
        const sendBtn = document.getElementById('sendResetBtn');
        
        if (!modal) return;

        // Close modal events
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    this.resetForgotPasswordForm();
                });
            }
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                this.resetForgotPasswordForm();
            }
        });

        // Send reset button
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.handleForgotPassword();
            });
        }
    }

    /**
     * Initialize confirmation modal event listeners
     */
    initializeConfirmationModal() {
        const modal = document.getElementById('confirmationModal');
        
        if (!modal) return;

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    /**
     * Initialize general modal event listeners
     */
    initializeGeneralModal() {
        const modal = document.getElementById('generalModal');
        const closeBtn = document.getElementById('closeGeneralModalBtn');
        const closeActionBtn = document.getElementById('generalModalCloseBtn');
        
        if (!modal) return;

        // Close modal events
        [closeBtn, closeActionBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    /**
     * Handle forgot password form submission
     */
    async handleForgotPassword() {
        const phoneInput = document.getElementById('resetPhone');
        const countryCodeSelect = document.getElementById('resetCountryCode');
        const errorDiv = document.getElementById('resetError');
        const successDiv = document.getElementById('resetSuccess');
        const sendBtn = document.getElementById('sendResetBtn');
        const btnText = document.getElementById('resetBtnText');
        const btnSpinner = document.getElementById('resetBtnSpinner');

        if (!phoneInput || !countryCodeSelect) return;

        const phone = phoneInput.value.trim();
        const countryCode = countryCodeSelect.value;

        // Validation
        if (!phone || phone.length !== 10) {
            this.showResetError('Please enter a valid 10-digit phone number');
            return;
        }

        // Show loading state
        if (btnText) btnText.textContent = 'Sending...';
        if (btnSpinner) btnSpinner.classList.remove('hidden');
        if (sendBtn) sendBtn.disabled = true;
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');

        try {
            // Import apiFetch dynamically to avoid circular dependencies
            const { apiFetch } = await import('../api.js');
            
            const data = await apiFetch('forgot_password.php', {
                method: 'POST',
                body: JSON.stringify({
                    phone: countryCode + phone
                })
            });

            if (data.success) {
                if (successDiv) successDiv.classList.remove('hidden');
                phoneInput.value = '';
            } else {
                this.showResetError(data.error || 'Failed to send reset instructions');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showResetError(error.message || 'Failed to send reset instructions. Please try again.');
        } finally {
            // Hide loading state
            if (btnText) btnText.textContent = 'Send Instructions';
            if (btnSpinner) btnSpinner.classList.add('hidden');
            if (sendBtn) sendBtn.disabled = false;
        }
    }

    /**
     * Show reset error message
     */
    showResetError(message) {
        const errorDiv = document.getElementById('resetError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    /**
     * Reset forgot password form
     */
    resetForgotPasswordForm() {
        const phoneInput = document.getElementById('resetPhone');
        const errorDiv = document.getElementById('resetError');
        const successDiv = document.getElementById('resetSuccess');

        if (phoneInput) phoneInput.value = '';
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
    }

    /**
     * Shows the forgot password modal
     */
    showForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetForgotPasswordForm();
        } else {
            console.error('Forgot password modal not found. Make sure to call renderAllModals() first.');
        }
    }

    /**
     * Shows a confirmation dialog
     */
    showConfirmationModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmationModal');
            const titleElement = document.getElementById('confirmationModalTitle');
            const messageElement = document.getElementById('confirmationModalMessage');
            const confirmBtn = document.getElementById('confirmationModalConfirmBtn');
            const cancelBtn = document.getElementById('confirmationModalCancelBtn');

            if (!modal) {
                console.error('Confirmation modal not found. Make sure to call renderAllModals() first.');
                resolve(false);
                return;
            }

            // Set content
            if (titleElement) titleElement.textContent = title;
            if (messageElement) messageElement.textContent = message;
            if (confirmBtn) confirmBtn.textContent = confirmText;
            if (cancelBtn) cancelBtn.textContent = cancelText;

            // Clear previous listeners by cloning nodes
            const newConfirmBtn = confirmBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            // Add new listeners
            newConfirmBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(true);
            });

            newCancelBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(false);
            });

            modal.classList.remove('hidden');
        });
    }

    /**
     * Shows a general purpose modal
     */
    showGeneralModal(title, content, actions = []) {
        const modal = document.getElementById('generalModal');
        const titleElement = document.getElementById('generalModalTitle');
        const contentElement = document.getElementById('generalModalContent');
        const actionsElement = document.getElementById('generalModalActions');

        if (!modal) {
            console.error('General modal not found. Make sure to call renderAllModals() first.');
            return;
        }

        // Set content
        if (titleElement) titleElement.textContent = title;
        if (contentElement) contentElement.innerHTML = content;

        // Set actions
        if (actionsElement && actions.length > 0) {
            actionsElement.innerHTML = actions.map(action => 
                `<button id="${action.id}" class="${action.class || 'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700'}">${action.text}</button>`
            ).join('');
            
            // Add event listeners for custom actions
            actions.forEach(action => {
                const btn = document.getElementById(action.id);
                if (btn && action.onclick) {
                    btn.addEventListener('click', action.onclick);
                }
            });
        }

        modal.classList.remove('hidden');
    }

    /**
     * Shows a non-blocking toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');

        if (!toastContainer) {
            console.error('Toast container not found. Make sure to call renderAllModals() first.');
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'flex items-center w-full max-w-xs p-4 rounded-lg shadow-md text-gray-500 bg-white';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        toast.style.transform = 'translateX(100%)';

        let iconClass = '';
        let textClass = '';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle text-green-500';
                textClass = 'text-green-800';
                break;
            case 'error':
                iconClass = 'fas fa-times-circle text-red-500';
                textClass = 'text-red-800';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle text-yellow-500';
                textClass = 'text-yellow-800';
                break;
            case 'info':
            default:
                iconClass = 'fas fa-info-circle text-blue-500';
                textClass = 'text-blue-800';
                break;
        }

        toast.innerHTML = `
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${textClass.replace('text-', 'bg-').replace('-800', '-100')} rounded-lg">
                <i class="${iconClass}"></i>
            </div>
            <div class="ml-3 text-sm font-normal text-gray-900">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8" aria-label="Close">
                <span class="sr-only">Close</span>
                <i class="fas fa-times"></i>
            </button>
        `;

        const closeButton = toast.querySelector('button');
        closeButton.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.addEventListener('transitionend', () => toast.remove());
        });

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto-hide
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }
}

// Create a global instance
export const publicModals = new PublicModals();

// Expose methods globally for compatibility
window.showToast = (message, type, duration) => publicModals.showToast(message, type, duration);
window.showConfirmationModal = (title, message, confirmText, cancelText) => publicModals.showConfirmationModal(title, message, confirmText, cancelText);
window.showGeneralModal = (title, content, actions) => publicModals.showGeneralModal(title, content, actions);
window.showForgotPasswordModal = () => publicModals.showForgotPasswordModal();
