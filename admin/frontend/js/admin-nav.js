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
        // Get navigation elements
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const adminUsernameSpan = document.getElementById('adminUsername');
        
        // Set admin username from localStorage
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        if (adminUser.username && adminUsernameSpan) {
            adminUsernameSpan.textContent = adminUser.username;
        }
        
        // Toggle user dropdown menu
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (userDropdown && userMenuBtn && 
                !userMenuBtn.contains(e.target) && 
                !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
        
        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                await handleLogout();
            });
        }
        
        // Change password functionality
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (userDropdown) {
                    userDropdown.classList.add('hidden');
                }
                showChangePasswordModal();
            });
        }
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
        const sessionToken = localStorage.getItem('admin_session_token');
        
        try {
            // Call logout API
            await fetch('../backend/logout.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with logout even if API call fails
        }
        
        // Clear local storage and redirect
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
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
            alert('Change password functionality is available on the dashboard page.');
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
            const sessionToken = localStorage.getItem('admin_session_token');
            const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
            
            const response = await fetch('../backend/admin_users.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    admin_id: adminUser.id,
                    action: 'change_password',
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Password changed successfully!');
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
    
    // Expose logout function globally for any page that might need it
    window.adminLogout = handleLogout;
    
})();
