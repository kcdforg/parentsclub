/**
 * AdminNavigation Component
 * Reusable navigation component for all admin pages
 */

import { AdminProfileComponent } from './AdminProfileComponent.js';

export class AdminNavigation {
    constructor(activeTab = '') {
        this.activeTab = activeTab;
        this.profileComponent = new AdminProfileComponent();
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
                id: 'groups', 
                label: 'Groups', 
                href: 'groups.html', 
                icon: 'fas fa-layer-group' 
            },
            { 
                id: 'announcements', 
                label: 'Announcements', 
                href: 'announcements.html', 
                icon: 'fas fa-bullhorn' 
            },
            { 
                id: 'events', 
                label: 'Events', 
                href: 'events.html', 
                icon: 'fas fa-calendar-alt' 
            },
            { 
                id: 'help-posts', 
                label: 'Help Posts', 
                href: 'help_posts.html', 
                icon: 'fas fa-question-circle' 
            },
            { 
                id: 'admin-users', 
                label: 'Admin Users', 
                href: 'admin-users.html', 
                icon: 'fas fa-user-shield' 
            },
            {
                id: 'settings',
                label: 'Settings',
                icon: 'fas fa-cog',
                isDropdown: true,
                submenu: [
                    {
                        id: 'feature-switches',
                        label: 'Feature Switches',
                        href: 'feature-switches.html',
                        icon: 'fas fa-toggle-on'
                    },
                    {
                        id: 'form-values',
                        label: 'Form Values List',
                        href: 'form-values.html',
                        icon: 'fas fa-list-ul'
                    },
                    {
                        id: 'database-setup',
                        label: 'Database Setup',
                        href: 'database-setup.html',
                        icon: 'fas fa-database'
                    }
                ]
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
                                <div id="adminProfileContainer"></div>
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
            if (item.isDropdown) {
                return this.generateDropdownItem(item);
            }
            
            const isActive = this.activeTab === item.id;
            const activeClasses = isActive 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700';
            
            return `<a href="${item.href}" class="${activeClasses} px-3 py-2 rounded-md text-sm font-medium">${item.label}</a>`;
        }).join('');
    }

    /**
     * Generates dropdown navigation item
     */
    generateDropdownItem(item) {
        const isActive = this.isDropdownActive(item);
        const activeClasses = isActive 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'text-gray-500 hover:text-gray-700';
        
        const submenuItems = item.submenu.map(subItem => {
            const isSubmenuActive = this.activeTab === subItem.id;
            const submenuActiveClass = isSubmenuActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100';
            return `<a href="${subItem.href}" class="block px-4 py-2 text-sm ${submenuActiveClass} transition-colors duration-150">
                <i class="${subItem.icon} mr-2"></i>${subItem.label}
            </a>`;
        }).join('');

        return `
            <div class="relative dropdown-container">
                <button class="${activeClasses} px-3 py-2 rounded-md text-sm font-medium flex items-center dropdown-trigger" 
                        data-dropdown-id="${item.id}">
                    <i class="${item.icon} mr-2"></i>${item.label}
                    <i class="fas fa-chevron-down ml-1"></i>
                </button>
                <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 hidden dropdown-menu border border-gray-200" 
                     id="dropdown-${item.id}"
                     style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                    ${submenuItems}
                </div>
            </div>
        `;
    }

    /**
     * Check if dropdown is active (any submenu item is active)
     */
    isDropdownActive(item) {
        if (!item.submenu) return false;
        return item.submenu.some(subItem => this.activeTab === subItem.id);
    }

    /**
     * Generates mobile navigation items
     */
    generateMobileNavigationItems() {
        return this.navigationStructure.map(item => {
            if (item.isDropdown) {
                return this.generateMobileDropdownItem(item);
            }
            
            const isActive = this.activeTab === item.id;
            const activeClasses = isActive 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700';
            
            return `<a href="${item.href}" class="${activeClasses} block px-3 py-2 rounded-md text-base font-medium">${item.label}</a>`;
        }).join('');
    }

    /**
     * Generates mobile dropdown navigation item
     */
    generateMobileDropdownItem(item) {
        const submenuItems = item.submenu.map(subItem => {
            const isActive = this.activeTab === subItem.id;
            const activeClasses = isActive 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700';
            
            return `<a href="${subItem.href}" class="${activeClasses} block px-6 py-2 rounded-md text-base font-medium">
                <i class="${subItem.icon} mr-2"></i>${subItem.label}
            </a>`;
        }).join('');

        return submenuItems; // In mobile, just show submenu items directly
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

        // Initialize admin profile component
        this.profileComponent.render('adminProfileContainer');
        
        // Initialize dropdown menus
        this.initializeDropdowns();
    }



    /**
     * Initialize dropdown menu behavior
     */
    initializeDropdowns() {
        // Get all dropdown triggers
        const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
        const dropdownMenus = document.querySelectorAll('.dropdown-menu');
        
        dropdownTriggers.forEach(trigger => {
            const dropdownId = trigger.getAttribute('data-dropdown-id');
            const dropdown = document.getElementById(`dropdown-${dropdownId}`);
            const container = trigger.closest('.dropdown-container');
            
            if (!dropdown || !container) return;
            
            let hideTimeout;
            
            // Show dropdown on mouseenter (hover)
            container.addEventListener('mouseenter', () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                // Hide all other dropdowns first
                dropdownMenus.forEach(menu => {
                    if (menu !== dropdown) {
                        menu.classList.add('hidden');
                    }
                });
                dropdown.classList.remove('hidden');
            });
            
            // Hide dropdown on mouseleave with delay
            container.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => {
                    dropdown.classList.add('hidden');
                }, 150); // Small delay to allow moving to dropdown
            });
            
            // Also show/hide on click for touch devices
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isHidden = dropdown.classList.contains('hidden');
                
                // Hide all other dropdowns
                dropdownMenus.forEach(menu => {
                    menu.classList.add('hidden');
                });
                
                // Toggle current dropdown
                if (isHidden) {
                    dropdown.classList.remove('hidden');
                } else {
                    dropdown.classList.add('hidden');
                }
            });
        });
        
        // Close all dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const isDropdownElement = e.target.closest('.dropdown-container');
            if (!isDropdownElement) {
                dropdownMenus.forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
        
        // Close dropdowns on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownMenus.forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
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
