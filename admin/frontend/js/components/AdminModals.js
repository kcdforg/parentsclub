/**
 * AdminModals Component
 * Reusable modal components for admin pages
 */

export class AdminModals {
    constructor() {
        this.modals = {};
    }

    /**
     * Generates the global modal HTML structure
     */
    generateGlobalModalHTML() {
        return `
            <div id="globalModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[1000]">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3 text-center">
                        <div id="globalModalIcon" class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <i class="fas fa-info-circle text-blue-600 text-xl"></i>
                        </div>
                        <h3 id="globalModalTitle" class="text-lg leading-6 font-medium text-gray-900 mb-2">Modal Title</h3>
                        <div class="mt-2 px-7 py-3">
                            <p id="globalModalMessage" class="text-sm text-gray-500">Modal Message</p>
                        </div>
                        <div class="items-center px-4 py-3 space-x-4">
                            <button id="globalModalConfirmBtn" class="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hidden">
                                OK
                            </button>
                            <button id="globalModalOkBtn" class="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                OK
                            </button>
                            <button id="globalModalCancelBtn" class="mt-3 px-4 py-2 bg-gray-200 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 hidden">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates the change password modal HTML structure
     */
    generateChangePasswordModalHTML() {
        return `
            <div id="changePasswordModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Change Password</h3>
                            <button id="closePasswordModalBtn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="changePasswordForm" class="space-y-4">
                            <div>
                                <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input type="password" id="currentPassword" name="current_password" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input type="password" id="newPassword" name="new_password" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input type="password" id="confirmPassword" name="confirm_password" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div id="passwordError" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                            </div>
                            <div class="flex space-x-3">
                                <button type="submit" id="changePasswordSubmitBtn"
                                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                    <span id="changePasswordBtnText">Change Password</span>
                                    <i id="changePasswordBtnSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                                </button>
                                <button type="button" id="cancelPasswordBtn"
                                        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
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
        
        // Add global modal
        body.insertAdjacentHTML('beforeend', this.generateGlobalModalHTML());
        
        // Add change password modal
        body.insertAdjacentHTML('beforeend', this.generateChangePasswordModalHTML());
        
        // Add toast container
        body.insertAdjacentHTML('beforeend', this.generateToastContainerHTML());
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for modal interactions
     */
    initializeEventListeners() {
        this.initializeChangePasswordModal();
    }

    /**
     * Initialize change password modal event listeners
     */
    initializeChangePasswordModal() {
        const changePasswordModal = document.getElementById('changePasswordModal');
        const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        const changePasswordForm = document.getElementById('changePasswordForm');
        
        if (!changePasswordModal) return;

        // Close modal event listeners
        if (closePasswordModalBtn) {
            closePasswordModalBtn.addEventListener('click', () => {
                changePasswordModal.classList.add('hidden');
            });
        }
        
        if (cancelPasswordBtn) {
            cancelPasswordBtn.addEventListener('click', () => {
                changePasswordModal.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) {
                changePasswordModal.classList.add('hidden');
            }
        });
        
        // Handle form submission
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleChangePassword();
            });
        }
    }

    /**
     * Handle change password form submission
     */
    async handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passwordError = document.getElementById('passwordError');
        const changePasswordSubmitBtn = document.getElementById('changePasswordSubmitBtn');
        const changePasswordBtnText = document.getElementById('changePasswordBtnText');
        const changePasswordBtnSpinner = document.getElementById('changePasswordBtnSpinner');
        
        // Validation
        if (newPassword !== confirmPassword) {
            this.showPasswordError('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showPasswordError('New password must be at least 6 characters long');
            return;
        }
        
        // Show loading state
        if (changePasswordBtnText) changePasswordBtnText.classList.add('hidden');
        if (changePasswordBtnSpinner) changePasswordBtnSpinner.classList.remove('hidden');
        if (changePasswordSubmitBtn) changePasswordSubmitBtn.disabled = true;
        if (passwordError) passwordError.classList.add('hidden');
        
        try {
            // Import apiFetch dynamically to avoid circular dependencies
            const { apiFetch } = await import('../api.js');
            const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
            
            const data = await apiFetch('admin_users.php', {
                method: 'PUT',
                body: JSON.stringify({
                    admin_id: adminUser.id,
                    action: 'change_password',
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            if (data.success) {
                this.showToast('Password changed successfully!', 'success');
                document.getElementById('changePasswordModal').classList.add('hidden');
                document.getElementById('changePasswordForm').reset();
            } else {
                this.showPasswordError(data.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showPasswordError('Failed to change password. Please try again.');
        } finally {
            // Hide loading state
            if (changePasswordBtnText) changePasswordBtnText.classList.remove('hidden');
            if (changePasswordBtnSpinner) changePasswordBtnSpinner.classList.add('hidden');
            if (changePasswordSubmitBtn) changePasswordSubmitBtn.disabled = false;
        }
    }

    /**
     * Show password error message
     */
    showPasswordError(message) {
        const passwordError = document.getElementById('passwordError');
        if (passwordError) {
            passwordError.textContent = message;
            passwordError.classList.remove('hidden');
        }
    }

    /**
     * Shows a custom modal dialog
     */
    showModal(title, message, isError = false, showCancel = false) {
        return new Promise((resolve) => {
            const modal = document.getElementById('globalModal');
            const modalTitle = document.getElementById('globalModalTitle');
            const modalMessage = document.getElementById('globalModalMessage');
            const modalIcon = document.getElementById('globalModalIcon');
            const modalOkBtn = document.getElementById('globalModalOkBtn');
            const modalConfirmBtn = document.getElementById('globalModalConfirmBtn');
            const modalCancelBtn = document.getElementById('globalModalCancelBtn');

            if (!modal) {
                console.error('Global modal not found. Make sure to call renderAllModals() first.');
                resolve(false);
                return;
            }

            modalTitle.textContent = title;
            modalMessage.textContent = message;

            // Set icon and background based on error state
            if (isError) {
                modalIcon.innerHTML = '<i class="fas fa-times-circle text-red-600 text-xl"></i>';
                modalIcon.classList.remove('bg-blue-100', 'bg-green-100');
                modalIcon.classList.add('bg-red-100');
            } else {
                modalIcon.innerHTML = '<i class="fas fa-info-circle text-blue-600 text-xl"></i>';
                modalIcon.classList.remove('bg-red-100', 'bg-green-100');
                modalIcon.classList.add('bg-blue-100');
            }

            // Show/hide buttons based on showCancel
            if (showCancel) {
                modalOkBtn.classList.add('hidden');
                modalConfirmBtn.classList.remove('hidden');
                modalCancelBtn.classList.remove('hidden');
            } else {
                modalOkBtn.classList.remove('hidden');
                modalConfirmBtn.classList.add('hidden');
                modalCancelBtn.classList.add('hidden');
            }

            // Clear previous listeners by cloning nodes
            const cloneOkBtn = modalOkBtn.cloneNode(true);
            modalOkBtn.parentNode.replaceChild(cloneOkBtn, modalOkBtn);

            const cloneConfirmBtn = modalConfirmBtn.cloneNode(true);
            modalConfirmBtn.parentNode.replaceChild(cloneConfirmBtn, modalConfirmBtn);

            const cloneCancelBtn = modalCancelBtn.cloneNode(true);
            modalCancelBtn.parentNode.replaceChild(cloneCancelBtn, modalCancelBtn);

            // Add new listeners
            cloneOkBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(true);
            });

            cloneConfirmBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(true);
            });

            cloneCancelBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(false);
            });

            modal.classList.remove('hidden');
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    resolve(false);
                }
            });
        });
    }

    /**
     * Shows a non-blocking toast notification
     */
    showToast(message, type = 'info') {
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
            case 'info':
            default:
                iconClass = 'fas fa-info-circle text-blue-500';
                textClass = 'text-blue-800';
                break;
        }

        toast.innerHTML = `
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${textClass.replace('text-', 'bg-')} rounded-lg">
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
        }, 3000);
    }

    /**
     * Show the change password modal
     */
    showChangePasswordModal() {
        const changePasswordModal = document.getElementById('changePasswordModal');
        
        if (changePasswordModal) {
            changePasswordModal.classList.remove('hidden');
        } else {
            console.error('Change password modal not found. Make sure to call renderAllModals() first.');
        }
    }
}

// Create a global instance
export const adminModals = new AdminModals();

// Expose methods globally for compatibility
window.showModal = (title, message, isError, showCancel) => adminModals.showModal(title, message, isError, showCancel);
window.showToast = (message, type) => adminModals.showToast(message, type);
window.showChangePasswordModal = () => adminModals.showChangePasswordModal();
