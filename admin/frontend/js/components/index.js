/**
 * Admin Components Library Index
 * Central export file for all admin components
 */

// Import all admin components
export { AdminNavigation, createAdminNavigation } from './AdminNavigation.js';
export { AdminModals, adminModals } from './AdminModals.js';
export { AdminFormComponents } from './AdminFormComponents.js';
export { AdminStatsCards, createDefaultStatsCards, createCustomStatsCards } from './AdminStatsCards.js';

/**
 * Initialize all admin components on a page
 * This is a convenience function that sets up the most common components
 */
export function initializeAdminPage(config = {}) {
    const {
        activeTab = '',
        includeModals = true,
        includeStatsCards = false,
        statsCardsContainer = 'statsContainer'
    } = config;

    // Initialize navigation
    const navigation = createAdminNavigation(activeTab);

    // Initialize modals if requested
    if (includeModals) {
        adminModals.renderAllModals();
    }

    // Initialize stats cards if requested
    if (includeStatsCards) {
        createDefaultStatsCards(statsCardsContainer);
    }

    // Initialize form components (password toggles, etc.)
    AdminFormComponents.initializeAllPasswordToggles();

    return {
        navigation,
        modals: includeModals ? adminModals : null
    };
}

/**
 * Quick setup for admin dashboard pages
 */
export function setupAdminDashboard(activeTab = 'dashboard') {
    return initializeAdminPage({
        activeTab,
        includeModals: true,
        includeStatsCards: true
    });
}

/**
 * Quick setup for admin form pages
 */
export function setupAdminFormPage(activeTab = '') {
    return initializeAdminPage({
        activeTab,
        includeModals: true,
        includeStatsCards: false
    });
}

/**
 * Component library information
 */
export const ADMIN_COMPONENTS_INFO = {
    version: '1.0.0',
    components: [
        {
            name: 'AdminNavigation',
            description: 'Responsive navigation bar with user menu and mobile support',
            features: ['Active tab highlighting', 'Mobile menu', 'User dropdown', 'Logout functionality']
        },
        {
            name: 'AdminModals',
            description: 'Collection of modal dialogs for admin actions',
            features: ['Global modal', 'Change password modal', 'Toast notifications', 'Confirmation dialogs']
        },
        {
            name: 'AdminFormComponents',
            description: 'Reusable form elements and validation',
            features: ['Phone input with country codes', 'Password toggle', 'Form validation', 'Loading states']
        },
        {
            name: 'AdminStatsCards',
            description: 'Statistics cards for dashboard displays',
            features: ['Default dashboard cards', 'Custom cards', 'Animated values', 'Compact variants']
        }
    ]
};

// Make components available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.AdminComponents = {
        AdminNavigation,
        AdminModals,
        AdminFormComponents,
        AdminStatsCards,
        createAdminNavigation,
        adminModals,
        createDefaultStatsCards,
        createCustomStatsCards,
        initializeAdminPage,
        setupAdminDashboard,
        setupAdminFormPage
    };
}
