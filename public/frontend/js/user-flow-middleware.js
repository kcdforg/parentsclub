/**
 * User Flow Middleware
 * Ensures users are at the correct step in their onboarding flow
 * Include this module on any page that requires completion checks
 */

import { apiFetch } from './api.js';

/**
 * Check if user should be on this page or redirected elsewhere
 * @param {string} currentPage - The current page identifier (dashboard, profile, etc.)
 * @param {boolean} requireCompleted - Whether this page requires full completion
 */
export async function checkUserFlow(currentPage = 'dashboard', requireCompleted = true) {
    const sessionToken = localStorage.getItem('user_session_token');
    
    if (!sessionToken) {
        // No session, redirect to login
        window.location.href = 'login.html';
        return;
    }

    try {
        // Get current user status
        const response = await apiFetch('account.php', {
            method: 'GET'
        });

        if (!response.success) {
            // Session invalid, redirect to login
            localStorage.removeItem('user_session_token');
            localStorage.removeItem('user_data');
            window.location.href = 'login.html';
            return;
        }

        const userData = response.user;
        
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Determine where user should be
        const nextStep = determineUserNextStep(userData);
        const shouldRedirect = shouldRedirectUser(currentPage, nextStep, requireCompleted);

        if (shouldRedirect) {
            redirectUserBasedOnStatus(nextStep, null, userData);
        }

    } catch (error) {
        console.error('User flow check error:', error);
        // On error, don't redirect (stay on current page)
    }
}

/**
 * Determine if user should be redirected from current page
 * @param {string} currentPage - Current page identifier
 * @param {string} nextStep - Where user should be according to their status
 * @param {boolean} requireCompleted - Whether current page requires completion
 * @returns {boolean} Whether to redirect
 */
function shouldRedirectUser(currentPage, nextStep, requireCompleted) {
    // If user needs intro or profile completion, always redirect (except if they're on those pages)
    if (nextStep === 'intro_required') {
        return currentPage !== 'intro';
    }
    
    if (nextStep === 'profile_required') {
        return currentPage !== 'profile_completion';
    }
    
    // If page requires completion but user isn't completed
    if (requireCompleted && nextStep !== 'completed' && nextStep !== 'dashboard') {
        return true;
    }
    
    return false;
}

/**
 * Get invitation code from storage or API
 * @returns {Promise<string|null>}
 */
async function getInvitationCodeFromStorage() {
    try {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        
        // If we have it stored, return it
        if (userData.invitation_code) {
            return userData.invitation_code;
        }
        
        // For existing sessions, we might not have it readily available
        // This could be enhanced with an API call if needed
        return null;
        
    } catch (error) {
        console.error('Error getting invitation code:', error);
        return null;
    }
}

/**
 * Determine the next step for a user based on their completion status
 * @param {object} userData - The user data object
 * @returns {string} The next step (intro_required, profile_required, completed, dashboard)
 */
function determineUserNextStep(userData) {
    // Check if user was created via invitation
    if (userData.created_via_invitation) {
        // Check intro completion
        if (!userData.intro_completed || !userData.questions_completed) {
            return 'intro_required';
        }
        
        // Check profile completion
        if (!userData.profile_completion_step || userData.profile_completion_step !== 'completed') {
            return 'profile_required';
        }
        
        // Everything completed
        return 'completed';
    }
    
    // For non-invitation users, use the old logic
    if (!userData.profile_completed) {
        return 'profile_required';
    }
    
    return 'dashboard';
}

/**
 * Redirect user based on their completion status
 * @param {string} nextStep - The next step for the user
 * @param {string|null} invitationCode - The invitation code if available
 * @param {object} userData - The user data object
 */
function redirectUserBasedOnStatus(nextStep, invitationCode, userData) {
    console.log('Redirecting user:', nextStep);
    
    switch (nextStep) {
        case 'intro_required':
            // User needs to complete intro questions
            window.location.href = 'getIntro.html';
            break;
            
        case 'profile_required':
            // User completed intro but needs to complete profile
            const currentStep = determineProfileStep(userData);
            window.location.href = `profile_completion.html?step=${currentStep}`;
            break;
            
        case 'completed':
        case 'dashboard':
        default:
            // User can access dashboard
            window.location.href = 'dashboard.html';
            break;
    }
}

/**
 * Determine which profile completion step the user should start from
 * @param {object} userData - The user data object
 * @returns {number} The step number to start from
 */
function determineProfileStep(userData) {
    if (userData.profile_completion_step) {
        switch (userData.profile_completion_step) {
            case 'intro':
            case 'questions':
            case 'member_details':
                return 1;
            case 'spouse_details':
                return 2;
            case 'children_details':
                return 3;
            case 'member_family_tree':
                return 4;
            case 'spouse_family_tree':
                return 5;
            case 'completed':
                return 1;
            default:
                return 1;
        }
    }
    
    return 1;
}

/**
 * Initialize flow check on page load
 * @param {string} currentPage - Current page identifier
 * @param {boolean} requireCompleted - Whether this page requires completion
 */
export function initializeFlowCheck(currentPage = 'dashboard', requireCompleted = true) {
    // Check flow when page loads
    document.addEventListener('DOMContentLoaded', () => {
        checkUserFlow(currentPage, requireCompleted);
    });
}

/**
 * Check flow on demand (useful for SPA navigation)
 * @param {string} currentPage - Current page identifier
 * @param {boolean} requireCompleted - Whether this page requires completion
 */
export function checkFlowOnDemand(currentPage = 'dashboard', requireCompleted = true) {
    checkUserFlow(currentPage, requireCompleted);
}
