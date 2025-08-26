import { apiFetch } from './api.js';
import { checkUserFlow } from './user-flow-middleware.js';

// Dashboard functionality
let sessionToken = ''; // This will eventually be removed as apiFetch handles it
let userData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check user flow first
    await checkUserFlow('dashboard', true);
    
    // Continue with dashboard initialization
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
    
    // Basic check - flow middleware handles comprehensive checks
    userData = JSON.parse(localStorage.getItem('user_data') || '{}');
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
    
    // Load groups and announcements if user is approved
    if (userData.approval_status === 'approved') {
        loadUserGroups();
        loadRecentAnnouncements();
        loadUpcomingEvents();
    }
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
            
            // Load groups and announcements if user is approved
            if (userData.approval_status === 'approved') {
                loadUserGroups();
                loadRecentAnnouncements();
                loadUpcomingEvents();
            }
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

// Load user groups
async function loadUserGroups() {
    try {
        const response = await apiFetch('user_groups.php?limit=6');
        if (response.success && response.data.length > 0) {
            displayUserGroups(response.data);
            document.getElementById('groupsSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading user groups:', error);
    }
}

function displayUserGroups(groups) {
    const container = document.getElementById('groupCards');
    container.innerHTML = groups.map(group => `
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onclick="viewGroup(${group.id})">
            <div class="flex items-center justify-between mb-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(group.type)}">
                    ${getGroupTypeIcon(group.type)} ${capitalizeFirst(group.type)}
                </span>
                ${group.unread_announcements > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">${group.unread_announcements}</span>` : ''}
            </div>
            <h4 class="text-lg font-medium text-gray-900 mb-1">${escapeHtml(group.name)}</h4>
            <p class="text-sm text-gray-600 mb-3">${escapeHtml(group.description || '').substring(0, 80)}${group.description && group.description.length > 80 ? '...' : ''}</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
                <span><i class="fas fa-users mr-1"></i>${group.member_count} members</span>
                <span><i class="fas fa-calendar mr-1"></i>${group.upcoming_events_count || 0} events</span>
            </div>
        </div>
    `).join('');
}

// Load recent announcements
async function loadRecentAnnouncements() {
    try {
        const response = await apiFetch('announcements.php?limit=3');
        if (response.success && response.data.length > 0) {
            displayRecentAnnouncements(response.data);
            document.getElementById('announcementsSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading recent announcements:', error);
    }
}

function displayRecentAnnouncements(announcements) {
    const container = document.getElementById('announcementCards');
    container.innerHTML = announcements.map(announcement => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="viewAnnouncement(${announcement.id})">
            <div class="flex items-start justify-between mb-2">
                <h4 class="text-lg font-medium text-gray-900 line-clamp-2">${escapeHtml(announcement.title)}</h4>
                ${announcement.is_pinned ? '<i class="fas fa-thumbtack text-yellow-500 ml-2"></i>' : ''}
                ${!announcement.user_viewed ? '<span class="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">New</span>' : ''}
            </div>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(announcement.content.substring(0, 120))}...</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
                <span>By ${escapeHtml(announcement.created_by_name || 'Unknown')}</span>
                <span>${formatTimeAgo(announcement.created_at)}</span>
            </div>
            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span><i class="fas fa-heart mr-1 ${announcement.user_liked ? 'text-red-500' : ''}"></i>${announcement.likes_count || 0}</span>
                <span><i class="fas fa-comment mr-1"></i>${announcement.comments_count || 0}</span>
                <span class="text-xs">${announcement.target_group_names.map(g => g.name).join(', ')}</span>
            </div>
        </div>
    `).join('');
}

// Helper functions
function getGroupTypeColor(type) {
    switch (type) {
        case 'district': return 'bg-blue-100 text-blue-800';
        case 'area': return 'bg-green-100 text-green-800';
        case 'custom': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getGroupTypeIcon(type) {
    switch (type) {
        case 'district': return '<i class="fas fa-building mr-1"></i>';
        case 'area': return '<i class="fas fa-map-marker-alt mr-1"></i>';
        case 'custom': return '<i class="fas fa-users mr-1"></i>';
        default: return '<i class="fas fa-circle mr-1"></i>';
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Global functions for onclick handlers
window.viewGroup = function(groupId) {
    window.location.href = `group.html?id=${groupId}`;
};

window.viewAnnouncement = function(announcementId) {
    window.location.href = `announcement.html?id=${announcementId}`;
};

// Load upcoming events
async function loadUpcomingEvents() {
    try {
        const response = await apiFetch('events.php?date_filter=upcoming&limit=3');
        if (response.success && response.data.length > 0) {
            displayUpcomingEvents(response.data);
            document.getElementById('eventsSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading upcoming events:', error);
    }
}

function displayUpcomingEvents(events) {
    const container = document.getElementById('eventCards');
    container.innerHTML = events.map(event => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="viewEvent(${event.id})">
            <div class="flex items-start justify-between mb-2">
                <h4 class="text-lg font-medium text-gray-900 line-clamp-2">${escapeHtml(event.title)}</h4>
                ${!event.user_viewed ? '<span class="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">New</span>' : ''}
            </div>
            
            <div class="flex items-center text-sm text-gray-600 mb-2">
                <i class="fas fa-calendar mr-2 text-primary"></i>
                ${formatEventDateTime(event.event_date, event.event_time)}
            </div>
            
            ${event.location ? `
                <div class="flex items-center text-sm text-gray-600 mb-2">
                    <i class="fas fa-map-marker-alt mr-2 text-primary"></i>
                    ${escapeHtml(event.location)}
                </div>
            ` : ''}
            
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(event.description.substring(0, 120))}...</p>
            
            <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>By ${escapeHtml(event.created_by_name || 'Unknown')}</span>
                <span>${formatTimeAgo(event.created_at)}</span>
            </div>
            
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 text-sm">
                    <span class="text-green-600"><i class="fas fa-check mr-1"></i>${event.attending_count || 0}</span>
                    <span class="text-red-600"><i class="fas fa-times mr-1"></i>${event.not_attending_count || 0}</span>
                    <span class="text-yellow-600"><i class="fas fa-question mr-1"></i>${event.maybe_count || 0}</span>
                </div>
                <div class="flex items-center space-x-2">
                    ${event.user_rsvp_status ? `
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRSVPColor(event.user_rsvp_status)}">
                            ${getRSVPIcon(event.user_rsvp_status)} ${capitalizeFirst(event.user_rsvp_status.replace('_', ' '))}
                        </span>
                    ` : `
                        <span class="text-xs text-gray-500">No RSVP</span>
                    `}
                </div>
            </div>
            
            <div class="text-xs text-gray-500 mt-2">
                ${event.target_group_names.map(g => g.name).join(', ')}
            </div>
        </div>
    `).join('');
}

function formatEventDateTime(dateString, timeString) {
    const date = new Date(dateString);
    const time = timeString.split(':');
    const hour = parseInt(time[0]);
    const minute = time[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateDisplay;
    if (date.toDateString() === today.toDateString()) {
        dateDisplay = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        dateDisplay = 'Tomorrow';
    } else {
        dateDisplay = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    return `${dateDisplay} at ${displayHour}:${minute} ${ampm}`;
}

function getRSVPColor(status) {
    switch (status) {
        case 'attending': return 'bg-green-100 text-green-800';
        case 'not_attending': return 'bg-red-100 text-red-800';
        case 'maybe': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getRSVPIcon(status) {
    switch (status) {
        case 'attending': return '<i class="fas fa-check mr-1"></i>';
        case 'not_attending': return '<i class="fas fa-times mr-1"></i>';
        case 'maybe': return '<i class="fas fa-question mr-1"></i>';
        default: return '';
    }
}

window.viewEvent = function(eventId) {
    window.location.href = `event.html?id=${eventId}`;
};
