import { apiFetch } from './api.js';

// Admin dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();

    // Initialize dashboard
    loadDashboardData();
    initializeEventListeners();
});

// Global variables
let sessionToken = localStorage.getItem('admin_session_token'); // This will be removed once admin-nav.js handles it fully.
let currentAdmin = JSON.parse(localStorage.getItem('admin_user') || '{}');

function checkAuth() {
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }
    
    // Username display is now handled by admin-nav.js
    // No need to set it here as admin-nav.js will handle it
}

function initializeEventListeners() {
    // Navigation (user menu, mobile menu, logout, change password) is now handled by admin-nav.js
    // Only dashboard-specific functionality should be handled here

    // Create invitation modal
    const createInvitationBtn = document.getElementById('createInvitationBtn');
    const invitationModal = document.getElementById('invitationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelInviteBtn = document.getElementById('cancelInviteBtn');
    const invitationForm = document.getElementById('invitationForm');

    createInvitationBtn.addEventListener('click', function() {
        invitationModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', function() {
        invitationModal.classList.add('hidden');
        invitationForm.reset();
        hideInvitationError();
    });

    cancelInviteBtn.addEventListener('click', function() {
        invitationModal.classList.add('hidden');
        invitationForm.reset();
        hideInvitationError();
    });

    invitationForm.addEventListener('submit', handleCreateInvitation);
}

async function loadDashboardData() {
    try {
        const data = await apiFetch('dashboard.php', {
            method: 'GET'
        });
        
        if (data.success) {
            updateStats(data.stats);
            displayRecentUsers(data.recent_users);
            displayRecentInvitations(data.recent_invitations);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateStats(stats) {
    document.getElementById('totalUsers').textContent = stats.total_users || 0;
    document.getElementById('pendingApprovals').textContent = stats.pending_approvals || 0;
    document.getElementById('approvedUsers').textContent = stats.approved_users || 0;
    document.getElementById('activeSubscriptions').textContent = stats.active_subscriptions || 0;
}

function displayRecentUsers(users) {
    const container = document.getElementById('recentUsersContainer');
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No recent users</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="flex items-center justify-between py-2">
            <div class="flex-1">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <i class="fas fa-user text-gray-600 text-xs"></i>
                        </div>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">${user.full_name || 'N/A'}</p>
                        <p class="text-xs text-gray-500">${user.phone || 'No phone'}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(user.approval_status)}">
                    ${user.approval_status}
                </span>
            </div>
        </div>
    `).join('');
}

function displayRecentInvitations(invitations) {
    const container = document.getElementById('recentInvitationsContainer');
    
    if (!invitations || invitations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No recent invitations</p>';
        return;
    }

    container.innerHTML = invitations.map(invitation => `
        <div class="flex items-center justify-between py-2">
            <div class="flex-1">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <i class="fas fa-envelope text-indigo-600 text-xs"></i>
                        </div>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">${invitation.invited_name}</p>
                        <p class="text-xs text-gray-500">${invitation.invited_phone || 'No phone'}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInvitationStatusBadgeClass(invitation.status)}">
                    ${invitation.status}
                </span>
            </div>
        </div>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getInvitationStatusBadgeClass(status) {
    switch(status) {
        case 'pending':
            return 'bg-blue-100 text-blue-800';
        case 'used':
            return 'bg-green-100 text-green-800';
        case 'expired':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

async function handleCreateInvitation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name').trim();
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = formData.get('phone').trim();
    
    if (!name || !phoneNumber) {
        showInvitationError('Please fill in all fields');
        return;
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
        showInvitationError('Please enter a valid 10-digit phone number');
        return;
    }
    
    setInvitationLoading(true);
    hideInvitationError();
    
    try {
        const invitationData = { 
            name, 
            phone: countryCode + phoneNumber,
            expiry_days: 3 // 72 hours = 3 days
        };
        
        const data = await apiFetch('invitations.php', {
            method: 'POST',
            body: JSON.stringify(invitationData)
        });
        
        if (data.success) {
            document.getElementById('invitationModal').classList.add('hidden');
            document.getElementById('invitationForm').reset();
            showNotification('Invitation created successfully', 'success');
            loadDashboardData(); // Refresh data
        } else {
            showInvitationError(data.error || 'Failed to create invitation');
        }
    } catch (error) {
        console.error('Error creating invitation:', error);
        showInvitationError('Network error. Please try again.');
    } finally {
        setInvitationLoading(false);
    }
}

// Change password and logout functionality is now handled by admin-nav.js

// Helper functions
function showInvitationError(message) {
    const errorDiv = document.getElementById('invitationError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideInvitationError() {
    document.getElementById('invitationError').classList.add('hidden');
}

function setInvitationLoading(loading) {
    const btn = document.getElementById('createInviteBtn');
    const btnText = document.getElementById('createInviteBtnText');
    const spinner = document.getElementById('createInviteBtnSpinner');
    
    btn.disabled = loading;
    
    if (loading) {
        btnText.textContent = 'Creating...';
        spinner.classList.remove('hidden');
    } else {
        btnText.textContent = 'Create Invitation';
        spinner.classList.add('hidden');
    }
}



// Password-related helper functions are now handled by admin-nav.js

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 z-50`;
    
    const bgColor = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
    const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
    const iconColor = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas ${icon} ${iconColor}"></i>
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium ${textColor}">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="rounded-md inline-flex ${textColor} hover:${textColor} focus:outline-none" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
