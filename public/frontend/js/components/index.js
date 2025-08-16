/**
 * Public Components Library Index
 * Central export file for all public components
 */

// Import all public components
export { PublicNavigation, PublicHeaderNavigation, createPublicNavigation, createPublicHeaderNavigation } from './PublicNavigation.js';
export { PublicModals, publicModals } from './PublicModals.js';
export { PublicFormComponents } from './PublicFormComponents.js';

/**
 * Initialize all public components on a page
 * This is a convenience function that sets up the most common components
 */
export function initializePublicPage(config = {}) {
    const {
        activeTab = '',
        userType = 'public',
        includeModals = true,
        navigationContainerId = null
    } = config;

    // Initialize navigation
    const navigation = createPublicNavigation(activeTab, userType, navigationContainerId);

    // Initialize modals if requested
    if (includeModals) {
        publicModals.renderAllModals();
    }

    // Initialize form components (password toggles, etc.)
    PublicFormComponents.initializeAllPasswordToggles();

    return {
        navigation,
        modals: includeModals ? publicModals : null
    };
}

/**
 * Quick setup for authenticated user pages (dashboard, profile, etc.)
 */
export function setupAuthenticatedPage(activeTab = 'dashboard', userType = 'public') {
    return initializePublicPage({
        activeTab,
        userType,
        includeModals: true
    });
}

/**
 * Quick setup for login/register pages
 */
export function setupAuthPage(showRegisterButton = true) {
    const headerNav = createPublicHeaderNavigation(showRegisterButton);
    publicModals.renderAllModals();
    PublicFormComponents.initializeAllPasswordToggles();
    
    return {
        navigation: headerNav,
        modals: publicModals
    };
}

/**
 * Quick setup for public form pages
 */
export function setupPublicFormPage(activeTab = '', userType = 'public') {
    return initializePublicPage({
        activeTab,
        userType,
        includeModals: true
    });
}

/**
 * Auto-detect user type from localStorage and setup appropriate navigation
 */
export function setupAutoDetectedPage(activeTab = '') {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    let userType = 'public';
    
    // Determine user type based on stored data
    if (userData.user_type === 'premium') {
        userType = 'premium';
    } else if (userData.status === 'approved') {
        userType = 'approved';
    }
    
    return initializePublicPage({
        activeTab,
        userType,
        includeModals: true
    });
}

/**
 * Component library information
 */
export const PUBLIC_COMPONENTS_INFO = {
    version: '1.0.0',
    components: [
        {
            name: 'PublicNavigation',
            description: 'Responsive navigation bar for public users with dynamic menu based on user type',
            features: ['User type-based menu items', 'Mobile responsive', 'User dropdown', 'Logout functionality']
        },
        {
            name: 'PublicHeaderNavigation',
            description: 'Simple header navigation for login/register pages',
            features: ['Clean design', 'Register button toggle', 'Brand linking']
        },
        {
            name: 'PublicModals',
            description: 'Collection of modal dialogs for public user actions',
            features: ['Forgot password modal', 'Confirmation dialogs', 'General purpose modal', 'Toast notifications']
        },
        {
            name: 'PublicFormComponents',
            description: 'Comprehensive form components with validation',
            features: [
                'Phone input with country codes',
                'Password toggle with strength validation',
                'File upload components',
                'Progress indicators',
                'Form validation helpers',
                'Loading states'
            ]
        }
    ]
};

/**
 * User type constants for easy reference
 */
export const USER_TYPES = {
    PUBLIC: 'public',
    APPROVED: 'approved',
    PREMIUM: 'premium'
};

/**
 * Navigation items configuration by user type
 */
export const NAVIGATION_CONFIG = {
    [USER_TYPES.PUBLIC]: ['dashboard', 'profile', 'subscription'],
    [USER_TYPES.APPROVED]: ['dashboard', 'profile', 'subscription', 'invitations'],
    [USER_TYPES.PREMIUM]: ['dashboard', 'profile', 'subscription', 'invitations']
};

// Make components available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.PublicComponents = {
        PublicNavigation,
        PublicHeaderNavigation,
        PublicModals,
        PublicFormComponents,
        createPublicNavigation,
        createPublicHeaderNavigation,
        publicModals,
        initializePublicPage,
        setupAuthenticatedPage,
        setupAuthPage,
        setupPublicFormPage,
        setupAutoDetectedPage,
        USER_TYPES,
        NAVIGATION_CONFIG
    };
}
