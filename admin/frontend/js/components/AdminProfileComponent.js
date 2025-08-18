/**
 * AdminProfileComponent - Reusable Profile Icon with Dropdown
 * Handles user profile display, logout, and change password functionality
 */

import { apiFetch } from '../api.js';

export class AdminProfileComponent {
    constructor() {
        this.adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    }

    /**
     * Generate the profile component HTML
     */
    generateHTML() {
        return `
            <div class="relative">
                <div class="flex items-center space-x-4">
                    <span id="adminUsername" class="text-sm text-gray-700">${this.adminUser.username || 'Admin'}</span>
                    <div class="relative">
                        <button id="userMenuBtn" class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            <i class="fas fa-user-circle text-2xl"></i>
                        </button>
                        <div id="userDropdown" class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div class="py-1">
                                <a href="#" id="changePasswordBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                    <i class="fas fa-key mr-2"></i>Change Password
                                </a>
                                <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the profile component into a container
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.generateHTML();
            this.initializeEventListeners();
        } else {
            console.error(`AdminProfileComponent: Container with ID '${containerId}' not found`);
        }
    }

    /**
     * Initialize event listeners for profile interactions
     */
    initializeEventListeners() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        const changePasswordBtn = document.getElementById('changePasswordBtn');

        // Toggle dropdown
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdown && userMenuBtn && 
                !userMenuBtn.contains(e.target) && 
                !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (userDropdown) {
                    userDropdown.classList.add('hidden');
                }
                await this.handleLogout();
            });
        }

        // Change password functionality
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (userDropdown) {
                    userDropdown.classList.add('hidden');
                }
                this.showChangePasswordModal();
            });
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            // Show loading state (optional)
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                const originalText = logoutBtn.innerHTML;
                logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging out...';
                logoutBtn.classList.add('pointer-events-none', 'opacity-75');
            }

            // Call logout API
            await apiFetch('logout.php', {
                method: 'POST'
            });

            // Clear local storage and redirect
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_user');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Logout error:', error);
            
            // Even if API call fails, clear local storage and redirect
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_user');
            window.location.href = 'login.html';
        }
    }

    /**
     * Show change password modal
     */
    showChangePasswordModal() {
        const changePasswordModal = document.getElementById('changePasswordModal');
        
        if (changePasswordModal) {
            // Modal exists on this page, show it
            changePasswordModal.classList.remove('hidden');
            this.initializeChangePasswordModal();
        } else {
            // Modal doesn't exist, show info message
            if (window.showModal) {
                window.showModal('Info', 'Change password functionality is available on the dashboard page.');
            } else {
                alert('Change password functionality is available on the dashboard page.');
            }
        }
    }

    /**
     * Initialize change password modal if it exists
     */
    initializeChangePasswordModal() {
        const changePasswordModal = document.getElementById('changePasswordModal');
        const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        const changePasswordForm = document.getElementById('changePasswordForm');

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
        if (changePasswordModal) {
            changePasswordModal.addEventListener('click', (e) => {
                if (e.target === changePasswordModal) {
                    changePasswordModal.classList.add('hidden');
                }
            });
        }

        // Handle form submission
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleChangePassword();
            });
        }
    }

    /**
     * Handle password change
     */
    async handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
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
            const data = await apiFetch('admin_users.php', {
                method: 'PUT',
                body: JSON.stringify({
                    admin_id: this.adminUser.id,
                    action: 'change_password',
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (data.success) {
                if (window.showToast) {
                    window.showToast('Password changed successfully!', 'success');
                } else {
                    alert('Password changed successfully!');
                }
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
     * Update admin username display
     */
    updateUsername() {
        const adminUsernameSpan = document.getElementById('adminUsername');
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        if (adminUser.username && adminUsernameSpan) {
            adminUsernameSpan.textContent = adminUser.username;
            this.adminUser = adminUser;
        }
    }
}

/**
 * Quick function to create and render admin profile component
 */
export function createAdminProfile(containerId) {
    const profileComponent = new AdminProfileComponent();
    profileComponent.render(containerId);
    return profileComponent;
}
