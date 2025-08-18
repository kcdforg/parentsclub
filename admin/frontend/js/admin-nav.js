import { apiFetch } from './api.js';

// Common admin navigation functionality
// This script should be included in all admin pages for consistent navigation behavior

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeAdminNavigation();
    });
    
    function initializeAdminNavigation() {
        // Check authentication first
        // The apiFetch function will handle redirection on 401, so explicit check here is less critical
        // But we keep it for immediate client-side redirection if token is missing from localStorage
        const sessionToken = localStorage.getItem('admin_session_token');
        if (!sessionToken) {
            window.location.href = 'login.html';
            return;
        }
        
        // Initialize navigation elements
        initializeUserMenu();
        initializeMobileMenu();
    }
    
    function initializeUserMenu() {
        // User menu functionality is now handled by AdminProfileComponent
        // This function is kept for backward compatibility but may be removed in future
        console.log('User menu initialization is now handled by AdminProfileComponent');
    }
    
    function initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
    
    async function handleLogout() {
        try {
            // Call logout API using apiFetch
            await apiFetch('logout.php', {
                method: 'POST'
            });
            
            // Clear local storage and redirect only if apiFetch didn't already redirect (e.g. 401 handled by apiFetch)
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_user');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, attempt to clear local storage and redirect to prevent being stuck
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
        }
    }
    
    function showChangePasswordModal() {
        // Check if change password modal exists on this page
        const changePasswordModal = document.getElementById('changePasswordModal');
        
        if (changePasswordModal) {
            // Modal exists on this page, show it
            changePasswordModal.classList.remove('hidden');
            initializeChangePasswordModal();
        } else {
            // Modal doesn't exist, redirect to dashboard where it's available
            showModal('Info', 'Change password functionality is available on the dashboard page.');
            window.location.href = 'dashboard.html#change-password';
        }
    }
    
    function initializeChangePasswordModal() {
        const changePasswordModal = document.getElementById('changePasswordModal');
        const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        const changePasswordForm = document.getElementById('changePasswordForm');
        
        // Close modal event listeners
        if (closePasswordModalBtn) {
            closePasswordModalBtn.addEventListener('click', function() {
                changePasswordModal.classList.add('hidden');
            });
        }
        
        if (cancelPasswordBtn) {
            cancelPasswordBtn.addEventListener('click', function() {
                changePasswordModal.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside
        if (changePasswordModal) {
            changePasswordModal.addEventListener('click', function(e) {
                if (e.target === changePasswordModal) {
                    changePasswordModal.classList.add('hidden');
                }
            });
        }
        
        // Handle form submission
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                await handleChangePassword();
            });
        }
    }
    
    async function handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passwordError = document.getElementById('passwordError');
        const changePasswordSubmitBtn = document.getElementById('changePasswordSubmitBtn');
        const changePasswordBtnText = document.getElementById('changePasswordBtnText');
        const changePasswordBtnSpinner = document.getElementById('changePasswordBtnSpinner');
        
        // Validation
        if (newPassword !== confirmPassword) {
            showPasswordError('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            showPasswordError('New password must be at least 6 characters long');
            return;
        }
        
        // Show loading state
        if (changePasswordBtnText) changePasswordBtnText.classList.add('hidden');
        if (changePasswordBtnSpinner) changePasswordBtnSpinner.classList.remove('hidden');
        if (changePasswordSubmitBtn) changePasswordSubmitBtn.disabled = true;
        if (passwordError) passwordError.classList.add('hidden');
        
        try {
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
                showToast('Password changed successfully!', 'success');
                document.getElementById('changePasswordModal').classList.add('hidden');
                document.getElementById('changePasswordForm').reset();
            } else {
                showPasswordError(data.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            showPasswordError('Failed to change password. Please try again.');
        } finally {
            // Hide loading state
            if (changePasswordBtnText) changePasswordBtnText.classList.remove('hidden');
            if (changePasswordBtnSpinner) changePasswordBtnSpinner.classList.add('hidden');
            if (changePasswordSubmitBtn) changePasswordSubmitBtn.disabled = false;
        }
    }
    
    function showPasswordError(message) {
        const passwordError = document.getElementById('passwordError');
        if (passwordError) {
            passwordError.textContent = message;
            passwordError.classList.remove('hidden');
        }
    }
    
    /**
     * Shows a custom modal dialog.
     * @param {string} title - The title of the modal.
     * @param {string} message - The message content of the modal.
     * @param {boolean} isError - If true, styles as an error modal.
     */
    function showModal(title, message, isError = false, showCancel = false) {
        return new Promise((resolve) => {
            const modal = document.getElementById('globalModal');
            const modalTitle = document.getElementById('globalModalTitle');
            const modalMessage = document.getElementById('globalModalMessage');
            const modalIcon = document.getElementById('globalModalIcon');
            const modalOkBtn = document.getElementById('globalModalOkBtn');
            const modalConfirmBtn = document.getElementById('globalModalConfirmBtn');
            const modalCancelBtn = document.getElementById('globalModalCancelBtn');

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

            // Clear previous listeners
            const cloneOkBtn = modalOkBtn.cloneNode(true);
            modalOkBtn.parentNode.replaceChild(cloneOkBtn, modalOkBtn);

            const cloneConfirmBtn = modalConfirmBtn.cloneNode(true);
            modalConfirmBtn.parentNode.replaceChild(cloneConfirmBtn, modalConfirmBtn);

            const cloneCancelBtn = modalCancelBtn.cloneNode(true);
            modalCancelBtn.parentNode.replaceChild(cloneCancelBtn, modalCancelBtn);
            
            console.log(`showModal called: Title="${title}", Message="${message}", isError=${isError}, showCancel=${showCancel}`);

            // Add new listeners
            cloneOkBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(true); // For simple OK modals
            });

            cloneConfirmBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(true); // For confirmation, resolves true for "Confirm"
            });

            cloneCancelBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                resolve(false); // For confirmation, resolves false for "Cancel"
            });

            modal.classList.remove('hidden');
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    resolve(false); // If clicked outside, treat as cancel for confirmation modals
                }
            });
        });
    }

    /**
     * Shows a non-blocking toast notification.
     * @param {string} message - The message content of the toast.
     * @param {'success' | 'error' | 'info'} type - The type of toast (e.g., 'success', 'error', 'info').
     */
    function showToast(message, type = 'info') {
        console.log(`showToast called: Message="${message}", Type="${type}"`);
        const toastContainer = document.getElementById('toastContainer');

        if (!toastContainer) {
            console.error('Toast container not found. Cannot show toast:', message);
            // Fallback to alert if toast container is not available
            // alert(`Toast: ${message}`);
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'flex items-center w-full max-w-xs p-4 rounded-lg shadow-md text-gray-500 bg-white';
        toast.style.opacity = '0'; // Start invisible
        toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        toast.style.transform = 'translateX(100%)'; // Start off-screen

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

    // Expose modal/toast functions globally for any page that might need them
    // Logout is now handled by AdminProfileComponent
    window.showModal = showModal;
    window.showToast = showToast;

    // Call this if the change password modal is on the current page
    // This will only be called if the element with id 'changePasswordModal' exists.
    // Ensure this is called AFTER the DOM is fully loaded.
    document.addEventListener('DOMContentLoaded', () => {
        initializeChangePasswordModal();
    });
    
})();
