import { apiFetch } from './api.js';
import { createAdminNavigation } from './components/AdminNavigation.js';

// Admin dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation component
    createAdminNavigation('dashboard', 'navigationContainer');
    
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
    
    // No additional event listeners needed for the current dashboard
}

async function loadDashboardData() {
    try {
        const data = await apiFetch('dashboard.php', {
            method: 'GET'
        });
        
        if (data.success) {
            // Dashboard data loaded successfully
            console.log('Dashboard data loaded');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}





// Change password and logout functionality is now handled by admin-nav.js

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

// Handle section card clicks
function handleSectionClick(section) {
    // For now, show a notification that the feature is coming soon
    // Later, these can be replaced with actual navigation to dedicated pages
    switch(section) {
        case 'announce':
            showNotification('Announce management coming soon!', 'info');
            break;
        case 'gallery':
            showNotification('Gallery management coming soon!', 'info');
            break;
        case 'events':
            showNotification('Events management coming soon!', 'info');
            break;
        case 'calendar':
            showNotification('Calendar management coming soon!', 'info');
            break;
        case 'poll':
            showNotification('Poll management coming soon!', 'info');
            break;
        case 'answer':
            showNotification('Answer management coming soon!', 'info');
            break;
        default:
            showNotification('Feature coming soon!', 'info');
    }
}

// Make the function globally available
window.handleSectionClick = handleSectionClick;
