/**
 * PublicNavigation Component
 * Reusable navigation component for all public user pages
 */

import { PublicProfileComponent } from './PublicProfileComponent.js';

export class PublicNavigation {
    constructor(activeTab = '', userType = 'public') {
        this.activeTab = activeTab;
        this.userType = userType; // 'public', 'approved', 'premium'
        this.profileComponent = new PublicProfileComponent();
        this.navigationStructure = this.getNavigationStructure();
    }

    /**
     * Gets navigation structure based on user type
     */
    getNavigationStructure() {
        const baseStructure = [
            { 
                id: 'dashboard', 
                label: 'Dashboard', 
                href: 'dashboard.html', 
                icon: 'fas fa-tachometer-alt' 
            },
            { 
                id: 'profile', 
                label: 'Profile', 
                href: 'edit_profile.html', 
                icon: 'fas fa-user' 
            }
        ];

        // Add subscription for all users (with feature control)
        baseStructure.push({
            id: 'subscription',
            label: 'Subscription',
            href: 'subscription.html',
            icon: 'fas fa-crown',
            dataFeature: 'subscriptions' // Add feature control
        });

        // Add invitations for approved and premium users
        if (this.userType === 'approved' || this.userType === 'premium') {
            baseStructure.push({
                id: 'invitations',
                label: 'Invitations',
                href: 'invitations.html',
                icon: 'fas fa-envelope'
            });
        }

        return baseStructure;
    }

    /**
     * Generates the complete navigation HTML structure
     */
    generateHTML() {
        return `
            <nav class="bg-white shadow-sm border-b border-gray-200">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <h1 class="text-xl font-bold text-gray-900">Registration Portal</h1>
                            </div>
                            <div class="hidden md:block ml-10">
                                <div class="flex items-baseline space-x-4">
                                    ${this.generateNavigationItems()}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <!-- Mobile menu button -->
                            <button id="mobileMenuBtn" class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                                <i class="fas fa-bars"></i>
                            </button>
                            
                            <!-- User menu -->
                            <div class="ml-3 relative">
                                <div id="publicProfileContainer"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile menu -->
                <div id="mobileMenu" class="hidden md:hidden">
                    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        ${this.generateMobileNavigationItems()}
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Generates desktop navigation items
     */
    generateNavigationItems() {
        return this.navigationStructure.map(item => {
            const isActive = this.activeTab === item.id;
            const activeClasses = isActive 
                ? 'bg-primary text-white' 
                : 'text-gray-500 hover:text-gray-700';
            
            const dataFeatureAttr = item.dataFeature ? ` data-feature="${item.dataFeature}"` : '';
            const cssClasses = item.dataFeature ? `${activeClasses} px-3 py-2 rounded-md text-sm font-medium inline` : `${activeClasses} px-3 py-2 rounded-md text-sm font-medium`;
            
            return `<a href="${item.href}" class="${cssClasses}"${dataFeatureAttr}>${item.label}</a>`;
        }).join('');
    }

    /**
     * Generates mobile navigation items
     */
    generateMobileNavigationItems() {
        return this.navigationStructure.map(item => {
            const isActive = this.activeTab === item.id;
            const activeClasses = isActive 
                ? 'bg-primary text-white' 
                : 'text-gray-500 hover:text-gray-700';
            
            const dataFeatureAttr = item.dataFeature ? ` data-feature="${item.dataFeature}"` : '';
            
            return `<a href="${item.href}" class="${activeClasses} block px-3 py-2 rounded-md text-base font-medium"${dataFeatureAttr}>${item.label}</a>`;
        }).join('');
    }

    /**
     * Renders the navigation into a target container
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.generateHTML();
            this.initializeEventListeners();
        } else {
            console.error(`Container with ID '${containerId}' not found`);
        }
    }

    /**
     * Injects navigation directly into the body as the first element
     */
    renderAsFirstElement() {
        const navHTML = this.generateHTML();
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        this.initializeEventListeners();
    }

    /**
     * Replaces existing navigation element
     */
    replaceExistingNav() {
        const existingNav = document.querySelector('nav');
        if (existingNav) {
            existingNav.outerHTML = this.generateHTML();
            this.initializeEventListeners();
        } else {
            this.renderAsFirstElement();
        }
    }

    /**
     * Initialize event listeners for navigation interactions
     */
    initializeEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Initialize public profile component
        this.profileComponent.render('publicProfileContainer');
    }



    /**
     * Updates navigation based on user type
     */
    updateNavigationForUserType(userType) {
        this.userType = userType;
        this.navigationStructure = this.getNavigationStructure();
        this.replaceExistingNav();
    }
}

/**
 * Generates a simple public header navigation for login/register pages
 */
export class PublicHeaderNavigation {
    constructor(showRegisterButton = true) {
        this.showRegisterButton = showRegisterButton;
    }

    generateHTML() {
        const registerButton = this.showRegisterButton ? `
            <a href="register.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Create Account
            </a>
        ` : '';

        return `
            <nav class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center">
                            <a href="index.html" class="text-2xl font-bold text-indigo-600">Registration Portal</a>
                        </div>
                        <div class="flex items-center space-x-4">
                            ${registerButton}
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    replaceExistingNav() {
        const existingNav = document.querySelector('nav');
        if (existingNav) {
            existingNav.outerHTML = this.generateHTML();
        } else {
            document.body.insertAdjacentHTML('afterbegin', this.generateHTML());
        }
    }
}

/**
 * Quick function to create and render public navigation
 * @param {string} activeTab - The currently active tab
 * @param {string} userType - User type: 'public', 'approved', 'premium'
 * @param {string} containerId - Optional container ID. If not provided, replaces existing nav
 */
export function createPublicNavigation(activeTab = '', userType = 'public', containerId = null) {
    const navigation = new PublicNavigation(activeTab, userType);
    
    if (containerId) {
        navigation.render(containerId);
    } else {
        navigation.replaceExistingNav();
    }
    
    return navigation;
}

/**
 * Quick function to create and render public header navigation for login/register pages
 */
export function createPublicHeaderNavigation(showRegisterButton = true) {
    const navigation = new PublicHeaderNavigation(showRegisterButton);
    navigation.replaceExistingNav();
    return navigation;
}
