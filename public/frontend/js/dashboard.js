import { apiFetch } from './api.js';

// Dashboard functionality
let sessionToken = ''; // This will eventually be removed as apiFetch handles it
let userData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeEventListeners();
    loadUserData();
});

function checkAuthentication() {
    sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if profile is completed
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (!userData.profile_completed) {
        // Redirect to profile completion page
        window.location.href = 'profile_completion.html';
        return;
    }
}

function initializeEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // User dropdown and logout functionality is now handled by PublicProfileComponent

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshUserData);
    }
}

function loadUserData() {
    // Load user data from localStorage first
    const storedData = localStorage.getItem('user_data');
    if (storedData) {
        userData = JSON.parse(storedData);
        
        updateUI();
    }
    
    // Then fetch fresh data from server
    refreshUserData();
}

async function refreshUserData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIcon = refreshBtn?.querySelector('i');
    
    if (refreshIcon) {
        refreshIcon.classList.add('fa-spin');
    }

    try {
        const data = await apiFetch('account.php', {
            method: 'GET'
        });
        
        if (data.success) {
            userData = data.account;
            
            // Update localStorage with fresh data
            const currentUserData = JSON.parse(localStorage.getItem('user_data') || '{}');
            const updatedUserData = { ...currentUserData, ...userData };
            localStorage.setItem('user_data', JSON.stringify(updatedUserData));
            updateUI();
        } else {
            console.error('Failed to fetch user data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    } finally {
        if (refreshIcon) {
            refreshIcon.classList.remove('fa-spin');
        }
    }
}

function updateUI() {
    // Check if profile is completed
    if (!userData.profile_completed) {
        // Show profile completion notice and hide main content
        document.getElementById('profileCompletionNotice').classList.remove('hidden');
        document.querySelector('main').style.display = 'none';
        return;
    }
    
    // Hide profile completion notice and show main content
    document.getElementById('profileCompletionNotice').classList.add('hidden');
    document.querySelector('main').style.display = 'block';
    
    // Update navigation
    const userName = document.getElementById('userName');
    const welcomeName = document.getElementById('welcomeName');
    
    if (userName && userData.full_name) {
        userName.textContent = userData.full_name;
    }
    
    if (welcomeName && userData.full_name) {
        welcomeName.textContent = userData.full_name;
    }

    // Update account status
    updateAccountStatus();
    
    // Update user information
    updateUserInformation();
    
    // Update member since date
    updateMemberSince();
}

function updateAccountStatus() {
    const statusIcon = document.getElementById('statusIcon');
    const accountStatus = document.getElementById('accountStatus');
    const pendingNotice = document.getElementById('pendingNotice');
    const approvedNotice = document.getElementById('approvedNotice');
    
    if (!userData.approval_status) return;
    
    switch (userData.approval_status) {
        case 'approved':
            if (statusIcon) {
                statusIcon.className = 'w-8 h-8 bg-green-500 rounded-full flex items-center justify-center';
                statusIcon.innerHTML = '<i class="fas fa-check text-white"></i>';
            }
            if (accountStatus) {
                accountStatus.textContent = 'Approved';
                accountStatus.className = 'text-lg font-medium text-green-600';
            }
            if (pendingNotice) pendingNotice.classList.add('hidden');
            if (approvedNotice) approvedNotice.classList.remove('hidden');
            break;
            
        case 'rejected':
            if (statusIcon) {
                statusIcon.className = 'w-8 h-8 bg-red-500 rounded-full flex items-center justify-center';
                statusIcon.innerHTML = '<i class="fas fa-times text-white"></i>';
            }
            if (accountStatus) {
                accountStatus.textContent = 'Rejected';
                accountStatus.className = 'text-lg font-medium text-red-600';
            }
            if (pendingNotice) pendingNotice.classList.add('hidden');
            if (approvedNotice) approvedNotice.classList.add('hidden');
            break;
            
        case 'pending':
        default:
            if (statusIcon) {
                statusIcon.className = 'w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center';
                statusIcon.innerHTML = '<i class="fas fa-clock text-white"></i>';
            }
            if (accountStatus) {
                accountStatus.textContent = 'Pending Approval';
                accountStatus.className = 'text-lg font-medium text-yellow-600';
            }
            if (pendingNotice) pendingNotice.classList.remove('hidden');
            if (approvedNotice) approvedNotice.classList.add('hidden');
            break;
    }
}

function updateUserInformation() {
    const fields = {
        'fullName': userData.full_name || '-',
        'emailAddress': userData.email || '-',
        'enrollmentNumber': userData.enrollment_number || '-',
        'userNumber': userData.user_number || '-',
        'referredBy': userData.referred_by_display || 'Direct'
    };
    
    Object.entries(fields).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update user type with badge
    const userTypeElement = document.getElementById('userType');
    if (userTypeElement && userData.user_type) {
        userTypeElement.innerHTML = getUserTypeBadge(userData.user_type);
    }
}

function updateMemberSince() {
    const memberSince = document.getElementById('memberSince');
    if (memberSince && userData.created_at) {
        const date = new Date(userData.created_at);
        memberSince.textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Logout functionality is now handled by PublicProfileComponent

// Helper function to get user type badge
function getUserTypeBadge(userType) {
    const badges = {
        'Invited': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><i class="fas fa-envelope mr-1"></i>Invited</span>',
        'Registered': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><i class="fas fa-user-plus mr-1"></i>Registered</span>',
        'Enrolled': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"><i class="fas fa-user-check mr-1"></i>Enrolled</span>',
        'Approved': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-user-shield mr-1"></i>Approved</span>',
        'Member': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><i class="fas fa-star mr-1"></i>Member</span>'
    };
    return badges[userType] || '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><i class="fas fa-question mr-1"></i>Unknown</span>';
}

// Helper function to show notifications
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}
