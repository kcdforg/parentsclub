/**
 * Feature Switches Management
 * Admin interface for controlling platform features
 */

import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    initializeFeatureSwitches();
});

let featureSwitches = [];

async function initializeFeatureSwitches() {
    try {
        await loadFeatureSwitches();
    } catch (error) {
        console.error('Failed to initialize feature switches:', error);
        showError('Failed to load feature switches. Please refresh the page.');
    }
}

async function loadFeatureSwitches() {
    try {
        const data = await apiFetch('feature_switches.php', {
            method: 'GET'
        });

        if (data.success) {
            featureSwitches = data.switches;
            renderFeatureSwitches(data.grouped_switches);
        } else {
            throw new Error(data.error || 'Failed to load feature switches');
        }
    } catch (error) {
        console.error('Error loading feature switches:', error);
        showError('Failed to load feature switches: ' + error.message);
    }
}

function renderFeatureSwitches(groupedSwitches) {
    const container = document.getElementById('featureSwitchesContainer');
    const loadingState = document.getElementById('loadingState');
    
    // Hide loading state (if it exists)
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Render switches grouped by category
    const categoriesHTML = Object.entries(groupedSwitches).map(([category, switches]) => {
        const categoryName = getCategoryDisplayName(category);
        const switchesHTML = switches.map(renderFeatureSwitch).join('');
        
        return `
            <div class="bg-white shadow rounded-lg mb-6">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-medium text-gray-900 flex items-center">
                        <i class="${getCategoryIcon(category)} mr-3 text-indigo-600"></i>
                        ${categoryName}
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">${getCategoryDescription(category)}</p>
                </div>
                <div class="divide-y divide-gray-200">
                    ${switchesHTML}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = categoriesHTML;
}

function renderFeatureSwitch(featureSwitch) {
    const isEnabled = featureSwitch.is_enabled;
    const lastUpdated = featureSwitch.updated_at ? 
        new Date(featureSwitch.updated_at).toLocaleString() : 'Never';
    const updatedBy = featureSwitch.updated_by_username || 'System';
    
    return `
        <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center">
                        <h3 class="text-sm font-medium text-gray-900">${featureSwitch.feature_name}</h3>
                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${featureSwitch.description}</p>
                    <div class="flex items-center text-xs text-gray-500 mt-2">
                        <i class="fas fa-clock mr-1"></i>
                        Last updated: ${lastUpdated} by ${updatedBy}
                    </div>
                </div>
                <div class="ml-6 flex items-center space-x-4">
                    <div class="flex items-center space-x-3">
                        <span class="text-sm text-gray-700">Off</span>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   ${isEnabled ? 'checked' : ''} 
                                   onchange="toggleFeature('${featureSwitch.feature_key}', this.checked)"
                                   data-feature-key="${featureSwitch.feature_key}">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="text-sm text-gray-700">On</span>
                    </div>
                </div>
            </div>
            ${renderFeatureImpact(featureSwitch)}
        </div>
    `;
}

function renderFeatureImpact(featureSwitch) {
    const impacts = getFeatureImpacts(featureSwitch.feature_key);
    if (impacts.length === 0) return '';
    
    return `
        <div class="mt-3 pt-3 border-t border-gray-100">
            <h4 class="text-xs font-medium text-gray-700 mb-2">When enabled, affects:</h4>
            <div class="flex flex-wrap gap-2">
                ${impacts.map(impact => `
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                        <i class="fas fa-arrow-right mr-1"></i>${impact}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}

async function toggleFeature(featureKey, isEnabled) {
    const toggle = document.querySelector(`input[data-feature-key="${featureKey}"]`);
    
    try {
        // Disable the toggle during the request
        toggle.disabled = true;
        
        const data = await apiFetch('feature_switches.php', {
            method: 'PUT',
            body: JSON.stringify({
                feature_key: featureKey,
                is_enabled: isEnabled
            })
        });

        if (data.success) {
            showSuccess(data.message);
            // Reload to show updated timestamp and user
            await loadFeatureSwitches();
        } else {
            // Revert the toggle state
            toggle.checked = !isEnabled;
            showError(data.error || 'Failed to update feature switch');
        }
    } catch (error) {
        console.error('Error toggling feature:', error);
        // Revert the toggle state
        toggle.checked = !isEnabled;
        showError('Failed to update feature switch: ' + error.message);
    } finally {
        // Re-enable the toggle
        toggle.disabled = false;
    }
}

// Helper functions for display
function getCategoryDisplayName(category) {
    const categories = {
        'user_features': 'User Features',
        'security': 'Security & Access',
        'general': 'General Settings',
        'payment': 'Payment & Billing',
        'communication': 'Communication'
    };
    return categories[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getCategoryIcon(category) {
    const icons = {
        'user_features': 'fas fa-users',
        'security': 'fas fa-shield-alt',
        'general': 'fas fa-cogs',
        'payment': 'fas fa-credit-card',
        'communication': 'fas fa-envelope'
    };
    return icons[category] || 'fas fa-toggle-on';
}

function getCategoryDescription(category) {
    const descriptions = {
        'user_features': 'Features that affect user functionality and experience',
        'security': 'Security-related features and access controls',
        'general': 'General platform settings and configurations',
        'payment': 'Payment processing and billing features',
        'communication': 'Email and notification features'
    };
    return descriptions[category] || 'Platform feature settings';
}

function getFeatureImpacts(featureKey) {
    const impacts = {
        'subscriptions': [
            'Subscription page visibility',
            'Payment processing',
            'Subscription management',
            'Navigation menu item'
        ],
        'user_invitations': [
            'User invitation creation',
            'Invitation management page',
            'Referral system'
        ],
        'user_profiles': [
            'Profile editing features',
            'User information updates',
            'Profile completion flows'
        ],
        'password_reset': [
            'Forgot password functionality',
            'Password reset emails',
            'Reset password page'
        ],
        'user_registration': [
            'New user signup process',
            'Registration forms',
            'Account creation'
        ]
    };
    return impacts[featureKey] || [];
}

// Message functions
function showSuccess(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        showMessage(message, 'success');
    }
}

function showError(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'error');
    } else {
        showMessage(message, 'error');
    }
}

function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? 'fa-check' : 'fa-exclamation-triangle';
    
    messageDiv.className = `${bgColor} text-white px-4 py-3 rounded shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
    messageDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Expose functions globally for onclick handlers
window.toggleFeature = toggleFeature;
