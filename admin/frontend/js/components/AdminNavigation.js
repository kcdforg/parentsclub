/**
 * AdminNavigation Component
 * Reusable navigation component for all admin pages
 */

export class AdminNavigation {
    constructor(activeTab = '') {
        this.activeTab = activeTab;
        this.navigationStructure = [
            { 
                id: 'dashboard', 
                label: 'Dashboard', 
                href: 'dashboard.html', 
                icon: 'fas fa-tachometer-alt' 
            },
            { 
                id: 'users', 
                label: 'Users', 
                href: 'users.html', 
                icon: 'fas fa-users' 
            },
            { 
                id: 'invitations', 
                label: 'Invitations', 
                href: 'invitations.html', 
                icon: 'fas fa-envelope' 
            },
            { 
                id: 'admin-users', 
                label: 'Admin Users', 
                href: 'admin-users.html', 
                icon: 'fas fa-user-shield' 
            }
        ];
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
                                <h1 class="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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
                                    <span id="adminUsername" class="text-sm text-gray-700"></span>
                                    <div class="relative">
                                        <button id="userMenuBtn" class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                            <i class="fas fa-user-circle text-2xl"></i>
                                        </button>
                                        <div id="userDropdown" class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                            <div class="py-1">
                                                <a href="#" id="changePasswordBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Change Password</a>
                                                <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
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
                    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
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
                ? 'bg-indigo-100 text-indigo-700' 
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
                ? 'bg-indigo-100 text-indigo-700' 
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

        // Set admin username
        this.setAdminUsername();
    }

    /**
     * Sets the admin username from localStorage
     */
    setAdminUsername() {
        const adminUsernameSpan = document.getElementById('adminUsername');
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        if (adminUser.username && adminUsernameSpan) {
            adminUsernameSpan.textContent = adminUser.username;
        }
    }
}

/**
 * Quick function to create and render admin navigation
 * @param {string} activeTab - The currently active tab
 * @param {string} containerId - Optional container ID. If not provided, replaces existing nav
 */
export function createAdminNavigation(activeTab = '', containerId = null) {
    const navigation = new AdminNavigation(activeTab);
    
    if (containerId) {
        navigation.render(containerId);
    } else {
        navigation.replaceExistingNav();
    }
    
    return navigation;
}
