// Admin dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();

    // Initialize dashboard
    loadDashboardData();
    initializeEventListeners();
});

// Global variables
let sessionToken = localStorage.getItem('admin_session_token');
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
        const response = await fetch('../backend/dashboard.php', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Session expired
                localStorage.removeItem('admin_session_token');
                localStorage.removeItem('admin_user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        
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
                        <p class="text-xs text-gray-500">${user.email}</p>
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
                        <p class="text-xs text-gray-500">${invitation.invited_email}</p>
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
    const email = formData.get('email').trim();
    
    if (!name || !email) {
        showInvitationError('Please fill in all fields');
        return;
    }
    
    setInvitationLoading(true);
    hideInvitationError();
    
    try {
        const response = await fetch('../backend/invitations.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ name, email })
        });
        
        const data = await response.json();
        
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
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
