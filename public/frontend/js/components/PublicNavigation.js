/**
 * PublicNavigation Component
 * Reusable navigation component for all public user pages
 */

export class PublicNavigation {
    constructor(activeTab = '', userType = 'public') {
        this.activeTab = activeTab;
        this.userType = userType; // 'public', 'approved', 'premium'
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

        // Add subscription for all users
        baseStructure.push({
            id: 'subscription',
            label: 'Subscription',
            href: 'subscription.html',
            icon: 'fas fa-crown'
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
                                <div class="flex items-center space-x-4">
                                    <span id="userName" class="text-sm text-gray-700 hidden md:block"></span>
                                    <div class="relative">
                                        <button id="userMenuBtn" class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                            <i class="fas fa-user-circle text-2xl"></i>
                                        </button>
                                        <div id="userDropdown" class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                            <div class="py-1">
                                                <a href="edit_profile.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                    <i class="fas fa-user mr-2"></i>Edit Profile
                                                </a>
                                                <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
            
            return `<a href="${item.href}" class="${activeClasses} px-3 py-2 rounded-md text-sm font-medium">${item.label}</a>`;
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
            
            return `<a href="${item.href}" class="${activeClasses} block px-3 py-2 rounded-md text-base font-medium">${item.label}</a>`;
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

        // User menu dropdown
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        // Set username
        this.setUsername();

        // Initialize logout functionality
        this.initializeLogout();
    }

    /**
     * Sets the username from localStorage
     */
    setUsername() {
        const userNameSpan = document.getElementById('userName');
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        
        if (userData.name && userNameSpan) {
            userNameSpan.textContent = userData.name;
        }
    }

    /**
     * Initialize logout functionality
     */
    initializeLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            // Import apiFetch dynamically to avoid circular dependencies
            const { apiFetch } = await import('../api.js');
            
            // Call logout API
            await apiFetch('logout.php', {
                method: 'POST'
            });
            
            // Clear local storage and redirect
            localStorage.removeItem('user_session_token');
            localStorage.removeItem('user_data');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, clear local storage and redirect
            localStorage.removeItem('user_session_token');
            localStorage.removeItem('user_data');
            window.location.href = 'login.html';
        }
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
