/**
 * Shared Invitation Component
 * Reusable invitation management component for both admin and public users
 * 
 * Features:
 * - Unified API calls
 * - Role-based UI rendering
 * - Consistent styling
 * - Shared validation logic
 */

export class InvitationComponent {
    constructor(options = {}) {
        this.containerSelector = options.container || '#invitationContainer';
        this.apiBaseUrl = options.apiBaseUrl || '/regapp2/shared/backend';
        this.userInfo = null;
        this.currentPage = 1;
        this.currentFilters = {
            status: '',
            search: ''
        };
        this.invitations = [];
        
        // Initialize component
        this.init();
    }

    async init() {
        try {
            await this.loadUserInfo();
            this.renderUI();
            this.attachEventListeners();
            await this.loadInvitations();
        } catch (error) {
            console.error('Failed to initialize invitation component:', error);
            this.showError('Failed to initialize invitation system');
        }
    }

    async loadUserInfo() {
        // User info is loaded via the invitation list API call
        // This will be populated when loadInvitations is called
    }

    renderUI() {
        const container = document.querySelector(this.containerSelector);
        if (!container) {
            console.error('Invitation container not found:', this.containerSelector);
            return;
        }

        container.innerHTML = `
            <div class="invitation-component">
                <!-- Header Section -->
                <div class="invitation-header mb-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-envelope mr-3 text-indigo-600"></i>
                                Invitations Management
                            </h2>
                            <p class="mt-1 text-sm text-gray-600">Create and manage user invitations</p>
                        </div>
                        <div class="flex space-x-3">
                            <button id="compactViewBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                <i class="fas fa-compress-alt mr-2"></i>Compact View
                            </button>
                            <button id="copyAllLinksBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                <i class="fas fa-copy mr-2"></i>Copy All Links
                            </button>
                            <button id="createInvitationBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                <i class="fas fa-plus mr-2"></i>Create Invitation
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Access Notice (shown for non-authorized users) -->
                <div id="accessNotice" class="hidden bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                <strong>Note:</strong> Only approved members can create invitations. Please ensure your profile is complete and approved by an admin.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Filters Section -->
                <div class="bg-white shadow rounded-lg mb-6">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label for="statusFilter" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select id="statusFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="used">Used</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div>
                                <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <input type="text" id="searchInput" placeholder="Search by name or phone" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div class="flex items-end">
                                <button id="searchBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                    <i class="fas fa-search mr-2"></i>Search
                                </button>
                            </div>
                            <div class="flex items-end">
                                <button id="resetFiltersBtn" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                    <i class="fas fa-undo mr-2"></i>Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Invitations Table -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitation ID<br/>Invited By</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name<br/>Phone</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitation Code</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On<br/>Expires On / Used On</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody id="invitationsTableBody" class="bg-white divide-y divide-gray-200">
                                    <!-- Invitations will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <div class="mt-6 flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing <span id="showingStart">0</span> to <span id="showingEnd">0</span> of <span id="totalInvitations">0</span> invitations
                            </div>
                            <div class="flex space-x-2">
                                <button id="prevPageBtn" class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Previous
                                </button>
                                <span id="currentPage" class="px-3 py-2 text-sm text-gray-700">Page 1</span>
                                <button id="nextPageBtn" class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Create Invitation Modal -->
                <div id="invitationModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-medium text-gray-900">Create Invitation</h3>
                                <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <form id="invitationForm" class="space-y-4">
                                <div>
                                    <label for="inviteeName" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" id="inviteeName" name="invited_name" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                                </div>
                                <div>
                                    <label for="inviteePhone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number (10 digits)</label>
                                    <div class="flex">
                                        <select id="countryCode" name="country_code" 
                                                class="px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50">
                                            <option value="+91" selected>🇮🇳 +91</option>
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+44">🇬🇧 +44</option>
                                            <option value="+61">🇦🇺 +61</option>
                                            <option value="+81">🇯🇵 +81</option>
                                            <option value="+49">🇩🇪 +49</option>
                                            <option value="+33">🇫🇷 +33</option>
                                            <option value="+39">🇮🇹 +39</option>
                                            <option value="+34">🇪🇸 +34</option>
                                            <option value="+86">🇨🇳 +86</option>
                                        </select>
                                        <input type="tel" id="inviteePhone" name="phone" required maxlength="10"
                                               class="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                                               placeholder="9876543210">
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">Enter 10-digit phone number without country code</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Period</label>
                                    <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                                        <p class="text-sm text-gray-700">Invitation expires after <strong>72 hours</strong></p>
                                        <p class="text-xs text-gray-500 mt-1">Profile must be completed within this time or invitation expires</p>
                                    </div>
                                </div>
                                <div id="invitationError" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                                </div>
                                <div id="invitationSuccess" class="hidden bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                </div>
                                <div class="flex space-x-3">
                                    <button type="submit" id="createInviteBtn"
                                            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <span id="createInviteBtnText">Create Invitation</span>
                                        <i id="createInviteBtnSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                                    </button>
                                    <button type="button" id="cancelInviteBtn"
                                            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Loading indicator -->
                <div id="loadingIndicator" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6">
                        <div class="flex items-center">
                            <i class="fas fa-spinner fa-spin text-2xl text-indigo-600 mr-3"></i>
                            <span class="text-lg">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Filter and search events
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.currentFilters.status = document.getElementById('statusFilter').value;
            this.currentPage = 1;
            this.loadInvitations();
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.currentFilters.search = document.getElementById('searchInput').value.trim();
            this.currentPage = 1;
            this.loadInvitations();
        });

        document.getElementById('resetFiltersBtn').addEventListener('click', () => {
            document.getElementById('statusFilter').value = '';
            document.getElementById('searchInput').value = '';
            this.currentFilters = { status: '', search: '' };
            this.currentPage = 1;
            this.loadInvitations();
        });

        // Pagination events
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadInvitations();
            }
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            this.currentPage++;
            this.loadInvitations();
        });

        // Modal events
        document.getElementById('createInvitationBtn').addEventListener('click', () => {
            this.openCreateModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeCreateModal();
        });

        document.getElementById('cancelInviteBtn').addEventListener('click', () => {
            this.closeCreateModal();
        });

        document.getElementById('invitationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createInvitation();
        });

        // Other button events
        document.getElementById('copyAllLinksBtn').addEventListener('click', () => {
            this.copyAllInvitationLinks();
        });

        // Close modal when clicking outside
        document.getElementById('invitationModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('invitationModal')) {
                this.closeCreateModal();
            }
        });
    }

    async loadInvitations() {
        try {
            this.showLoading(true);

            const params = new URLSearchParams({
                page: this.currentPage,
                status: this.currentFilters.status,
                search: this.currentFilters.search
            });

            const response = await fetch(`${this.apiBaseUrl}/invitations.php?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getSessionToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.userInfo = data.user_info;
                this.invitations = data.invitations;
                this.updateUserInterface();
                this.displayInvitations(data.invitations);
                this.updatePagination(data.pagination);
            } else {
                throw new Error(data.error || 'Failed to load invitations');
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            this.showError('Failed to load invitations: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    updateUserInterface() {
        if (!this.userInfo) return;

        // Update access controls based on user permissions
        const createBtn = document.getElementById('createInvitationBtn');
        const accessNotice = document.getElementById('accessNotice');

        if (this.userInfo.can_create) {
            accessNotice.classList.add('hidden');
            createBtn.disabled = false;
            createBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            accessNotice.classList.remove('hidden');
            createBtn.disabled = true;
            createBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    displayInvitations(invitations) {
        const tbody = document.getElementById('invitationsTableBody');
        tbody.innerHTML = '';
        
        if (invitations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        No invitations found
                    </td>
                </tr>
            `;
            return;
        }

        invitations.forEach(invitation => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const statusClass = this.getStatusClass(invitation.status);
            const expiresDate = new Date(invitation.expires_at);
            const isExpired = expiresDate < new Date();
            
            // Generate the full invitation link
            const baseUrl = window.location.origin;
            const invitationLink = `${baseUrl}/regapp2/public/frontend/invitation.html?invitation=${invitation.invitation_code}`;

            // Determine the second date to show (expires/used)
            let secondDate = '';
            let secondDateLabel = '';
            
            if (invitation.status === 'used' && invitation.used_at) {
                secondDate = this.formatDate(invitation.used_at);
                secondDateLabel = 'Used on';
            } else {
                secondDate = this.formatDate(invitation.expires_at);
                secondDateLabel = 'Expires on';
            }

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">INV-${invitation.id}</div>
                    <div class="text-xs text-gray-500">by ${invitation.inviter_name || invitation.invited_by_type}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8">
                            <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                <span class="text-white font-medium text-xs">${invitation.invited_name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${invitation.invited_name}</div>
                            <div class="text-xs text-gray-500">${invitation.invited_phone || 'No phone'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="max-w-xs">
                        <div class="bg-gray-50 p-2 rounded border text-xs font-mono text-gray-900 break-all" title="${invitation.invitation_code}">
                            ${invitation.invitation_code.length > 16 ? invitation.invitation_code.substring(0, 16) + '...' : invitation.invitation_code}
                        </div>
                        <div class="flex space-x-2 mt-2">
                            <button onclick="invitationComponent.copyToClipboard('${invitation.invitation_code}')" class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                                <i class="fas fa-copy"></i> Copy Code
                            </button>
                            <button onclick="invitationComponent.copyToClipboard('${invitationLink}')" class="text-xs text-green-600 hover:text-green-800 hover:underline">
                                <i class="fas fa-link"></i> Copy Link
                            </button>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="text-sm text-gray-900">Created: ${this.formatDate(invitation.created_at)}</div>
                    <div class="text-xs ${isExpired && invitation.status === 'pending' ? 'text-red-500' : 'text-gray-500'}">
                        ${secondDateLabel}: ${secondDate}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex flex-col space-y-1">
                        ${this.renderActionButtons(invitation, isExpired)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="${statusClass}">${this.getStatusDisplayText(invitation.status)}</span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderActionButtons(invitation, isExpired) {
        let buttons = '';

        // Cancel button for pending invitations
        if (invitation.status === 'pending' && !isExpired) {
            buttons += `
                <button onclick="invitationComponent.cancelInvitation(${invitation.id})" class="text-orange-600 hover:text-orange-900 text-xs">
                    <i class="fas fa-ban"></i> Cancel
                </button>
            `;
        }

        // Resend button for expired invitations (admin only)
        if (invitation.status === 'expired' && this.userInfo && this.userInfo.can_manage_all) {
            buttons += `
                <button onclick="invitationComponent.resendInvitation(${invitation.id})" class="text-green-600 hover:text-green-900 text-xs">
                    <i class="fas fa-paper-plane"></i> Resend
                </button>
            `;
        }

        // Delete button (own invitations or admin)
        const canDelete = this.userInfo && (this.userInfo.can_manage_all || 
            (invitation.invited_by_type === this.userInfo.type && invitation.invited_by_id == this.userInfo.id));
        
        if (canDelete) {
            buttons += `
                <button onclick="invitationComponent.deleteInvitation(${invitation.id})" class="text-red-600 hover:text-red-900 text-xs">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        }

        return buttons;
    }

    updatePagination(pagination) {
        this.currentPage = pagination.current_page;
        
        document.getElementById('currentPage').textContent = `Page ${pagination.current_page}`;
        document.getElementById('showingStart').textContent = pagination.start;
        document.getElementById('showingEnd').textContent = pagination.end;
        document.getElementById('totalInvitations').textContent = pagination.total;
        
        document.getElementById('prevPageBtn').disabled = pagination.current_page <= 1;
        document.getElementById('nextPageBtn').disabled = pagination.current_page >= pagination.total_pages;
    }

    openCreateModal() {
        document.getElementById('invitationModal').classList.remove('hidden');
        document.getElementById('invitationForm').reset();
        document.getElementById('invitationError').classList.add('hidden');
        document.getElementById('inviteeName').focus();
    }

    closeCreateModal() {
        document.getElementById('invitationModal').classList.add('hidden');
        document.getElementById('invitationForm').reset();
        document.getElementById('invitationError').classList.add('hidden');
        
        // Also hide success message
        const successDiv = document.getElementById('invitationSuccess');
        if (successDiv) {
            successDiv.classList.add('hidden');
        }
    }

    async createInvitation() {
        const formElement = document.getElementById('invitationForm');
        const countryCodeElement = document.getElementById('countryCode');
        
        if (!formElement) {
            this.showFormError('Form not found. Please refresh the page and try again.');
            return;
        }
        
        if (!countryCodeElement) {
            this.showFormError('Country code selector not found. Please refresh the page and try again.');
            return;
        }
        
        const formData = new FormData(formElement);
        const countryCode = countryCodeElement.value;
        const phoneNumber = (formData.get('phone') || '').trim();
        
        // Debug: Log all form data
        console.log('=== Debug: Form Data Collection ===');
        console.log('Form element found:', !!document.getElementById('invitationForm'));
        console.log('Country code element found:', !!document.getElementById('countryCode'));
        console.log('Country code value:', countryCode);
        console.log('Phone from formData:', formData.get('phone'));
        console.log('Invited name from formData:', formData.get('invited_name'));
        
        // Log all form entries for debugging
        console.log('All FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: "${value}"`);
        }
        
        // Get and validate name
        const name = formData.get('invited_name')?.trim();
        if (!name) {
            this.showFormError('Please enter a name');
            return;
        }
        
        // Validate phone number (10 digits)
        if (!/^\d{10}$/.test(phoneNumber)) {
            this.showFormError('Please enter a valid 10-digit phone number');
            return;
        }
        
        const invitationData = {
            name: name,
            phone: countryCode + phoneNumber
        };
        
        // Debug: Log final invitation data
        console.log('Final invitation data:', invitationData);

        try {
            this.showLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/invitations.php`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getSessionToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invitationData)
            });

            const data = await response.json();

            if (data.success) {
                // Show inline success message in the modal first
                this.showFormSuccess(`Invitation created successfully for ${invitationData.invited_name}!`);
                
                // Then show toast notification
                this.showSuccess('Invitation created successfully!');
                
                // Close modal after a brief delay to show the success message
                setTimeout(() => {
                    this.closeCreateModal();
                }, 1500);
                
                // Reload invitations
                await this.loadInvitations();
            } else {
                this.showFormError(data.error || 'Failed to create invitation');
            }
        } catch (error) {
            console.error('Error creating invitation:', error);
            this.showFormError('Failed to create invitation. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async cancelInvitation(invitationId) {
        if (!confirm('Are you sure you want to cancel this invitation?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/invitations.php`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getSessionToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'cancel', 
                    invitation_id: invitationId 
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Invitation cancelled successfully');
                await this.loadInvitations();
            } else {
                this.showError(data.error || 'Failed to cancel invitation');
            }
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            this.showError('Failed to cancel invitation. Please try again.');
        }
    }

    async resendInvitation(invitationId) {
        if (!confirm('Are you sure you want to resend this invitation?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/invitations.php`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getSessionToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'resend', 
                    invitation_id: invitationId 
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Invitation resent successfully');
                await this.loadInvitations();
            } else {
                this.showError(data.error || 'Failed to resend invitation');
            }
        } catch (error) {
            console.error('Error resending invitation:', error);
            this.showError('Failed to resend invitation. Please try again.');
        }
    }

    async deleteInvitation(invitationId) {
        if (!confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/invitations.php`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getSessionToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    invitation_id: invitationId 
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Invitation deleted successfully');
                await this.loadInvitations();
            } else {
                this.showError(data.error || 'Failed to delete invitation');
            }
        } catch (error) {
            console.error('Error deleting invitation:', error);
            this.showError('Failed to delete invitation. Please try again.');
        }
    }

    async copyAllInvitationLinks() {
        if (this.invitations.length === 0) {
            this.showError('No invitations to copy');
            return;
        }

        const baseUrl = window.location.origin;
        const allLinks = this.invitations
            .filter(inv => inv.status === 'pending')
            .map(inv => `${inv.invited_name} (${inv.invited_phone || 'No phone'}): ${baseUrl}/regapp2/public/frontend/invitation.html?invitation=${inv.invitation_code}`)
            .join('\n\n');

        if (allLinks === '') {
            this.showError('No pending invitations to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(allLinks);
            this.showSuccess(`Copied ${this.invitations.filter(inv => inv.status === 'pending').length} invitation links to clipboard!`);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            this.showError('Failed to copy links to clipboard. Please try again.');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            this.showError('Failed to copy to clipboard');
        }
    }

    // Helper methods
    getStatusClass(status) {
        switch (status) {
            case 'used':
                return 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full';
            case 'expired':
                return 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full';
            case 'pending':
            default:
                return 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full';
        }
    }

    getStatusDisplayText(status) {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'used':
                return 'Used';
            case 'expired':
                return 'Expired';
            default:
                return status;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getSessionToken() {
        // Try admin token first, then user token
        return localStorage.getItem('admin_session_token') || localStorage.getItem('user_session_token');
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    showFormError(message) {
        const errorDiv = document.getElementById('invitationError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Hide success message if shown
        const successDiv = document.getElementById('invitationSuccess');
        if (successDiv) {
            successDiv.classList.add('hidden');
        }
    }

    showFormSuccess(message) {
        const successDiv = document.getElementById('invitationSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
        }
        
        // Hide error message if shown
        const errorDiv = document.getElementById('invitationError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    showSuccess(message) {
        // Try to use existing toast systems from the portals
        if (typeof window.showToast === 'function') {
            // Admin portal toast system
            window.showToast(message, 'success');
        } else if (window.adminModals && typeof window.adminModals.showToast === 'function') {
            // Admin portal via adminModals
            window.adminModals.showToast(message, 'success');
        } else if (window.publicModals && typeof window.publicModals.showToast === 'function') {
            // Public portal via publicModals
            window.publicModals.showToast(message, 'success');
        } else {
            // Fallback: create our own toast notification
            this.createToastNotification(message, 'success');
        }
    }

    showError(message) {
        // Try to use existing toast systems from the portals
        if (typeof window.showToast === 'function') {
            // Admin portal toast system
            window.showToast(message, 'error');
        } else if (window.adminModals && typeof window.adminModals.showToast === 'function') {
            // Admin portal via adminModals
            window.adminModals.showToast(message, 'error');
        } else if (window.publicModals && typeof window.publicModals.showToast === 'function') {
            // Public portal via publicModals
            window.publicModals.showToast(message, 'error');
        } else {
            // Fallback: create our own toast notification
            this.createToastNotification(message, 'error');
        }
    }

    /**
     * Fallback toast notification system for when portal-specific systems aren't available
     */
    createToastNotification(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('sharedToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'sharedToastContainer';
            toastContainer.className = 'fixed bottom-4 right-4 z-[1001] space-y-3';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'flex items-center w-full max-w-xs p-4 rounded-lg shadow-md text-gray-500 bg-white border';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        toast.style.transform = 'translateX(100%)';

        let iconClass = '';
        let textClass = '';
        let borderClass = '';

        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                textClass = 'text-green-800';
                borderClass = 'border-green-200';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle';
                textClass = 'text-red-800';
                borderClass = 'border-red-200';
                break;
            default:
                iconClass = 'fas fa-info-circle';
                textClass = 'text-blue-800';
                borderClass = 'border-blue-200';
        }

        toast.className += ` ${borderClass}`;
        toast.innerHTML = `
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${textClass.replace('text-', 'bg-').replace('-800', '-100')} rounded-lg">
                <i class="${iconClass} ${textClass}"></i>
            </div>
            <div class="ml-3 text-sm font-normal ${textClass}">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8" aria-label="Close">
                <i class="fas fa-times w-3 h-3"></i>
            </button>
        `;

        const closeButton = toast.querySelector('button');
        closeButton.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) toast.remove();
            });
        });

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.addEventListener('transitionend', () => {
                    if (toast.parentNode) toast.remove();
                });
            }
        }, 3000);
    }
}

// Global instance for onclick handlers
window.invitationComponent = null;
