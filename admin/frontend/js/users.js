// Users management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const sessionToken = localStorage.getItem('admin_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize variables for users tab
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {
        status: '',
        search: ''
    };

    // Initialize variables for reset requests tab
    let resetCurrentPage = 1;
    let resetTotalPages = 1;
    let resetCurrentFilters = {
        status: 'pending',
        search: ''
    };

    // Tab functionality
    initializeTabs();

    // DOM elements
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const usersTableBody = document.getElementById('usersTableBody');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageSpan = document.getElementById('currentPage');
    const showingStartSpan = document.getElementById('showingStart');
    const showingEndSpan = document.getElementById('showingEnd');
    const totalUsersSpan = document.getElementById('totalUsers');

    // Event listeners
    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        currentPage = 1;
        loadUsers();
    });

    searchBtn.addEventListener('click', function() {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadUsers();
    });

    resetFiltersBtn.addEventListener('click', function() {
        statusFilter.value = '';
        searchInput.value = '';
        currentFilters = { status: '', search: '' };
        currentPage = 1;
        loadUsers();
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadUsers();
        }
    });

    // Load users on page load
    loadUsers();

    // Load users function
    async function loadUsers() {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                status: currentFilters.status,
                search: currentFilters.search
            });

            const response = await fetch(`../backend/users.php?${params}`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('admin_session_token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to load users');
            }

            const data = await response.json();
            
            if (data.success) {
                displayUsers(data.users);
                updatePagination(data.pagination);
            } else {
                showError(data.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showError('Failed to load users. Please try again.');
        }
    }

    // Display users in table
    function displayUsers(users) {
        usersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const statusClass = getStatusClass(user.approval_status);
            const profileStatus = user.profile_completed ? 
                '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Complete</span>' :
                '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Incomplete</span>';
            
            const membershipStatus = getMembershipStatusBadge(user.membership_status);
            const referrerInfo = getReferrerInfo(user);

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                <span class="text-white font-medium">${user.email.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.email}</div>
                            <div class="text-sm text-gray-500">${user.enrollment_number || 'No enrollment'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${user.enrollment_number || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${getUserTypeBadge(user.user_type)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="${statusClass}">${user.approval_status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${profileStatus}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${membershipStatus}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${referrerInfo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(user.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${getUserActions(user)}
                </td>
            `;
            
            usersTableBody.appendChild(row);
        });
    }

    // Update pagination display
    function updatePagination(pagination) {
        currentPage = pagination.current_page;
        totalPages = pagination.total_pages;
        
        currentPageSpan.textContent = `Page ${currentPage}`;
        showingStartSpan.textContent = pagination.start;
        showingEndSpan.textContent = pagination.end;
        totalUsersSpan.textContent = pagination.total;
        
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // Get status class for styling
    function getStatusClass(status) {
        switch (status) {
            case 'approved':
                return 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full';
            case 'rejected':
                return 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full';
            case 'pending':
            default:
                return 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full';
        }
    }

    // Helper function to get membership status badge
    function getMembershipStatusBadge(status) {
        switch(status) {
            case 'Premium Member':
                return '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"><i class="fas fa-crown mr-1"></i>Premium</span>';
            case 'Subscription Pending':
                return '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"><i class="fas fa-clock mr-1"></i>Pending</span>';
            case 'Non-Subscriber':
            default:
                return '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"><i class="fas fa-user mr-1"></i>Regular</span>';
        }
    }

    // Helper function to get user type badge
    function getUserTypeBadge(userType) {
        switch(userType) {
            case 'Invited':
                return '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full"><i class="fas fa-envelope mr-1"></i>Invited</span>';
            case 'Registered':
                return '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"><i class="fas fa-user-plus mr-1"></i>Registered</span>';
            case 'Enrolled':
                return '<span class="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"><i class="fas fa-user-check mr-1"></i>Enrolled</span>';
            case 'Approved':
                return '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"><i class="fas fa-user-shield mr-1"></i>Approved</span>';
            case 'Member':
                return '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"><i class="fas fa-star mr-1"></i>Member</span>';
            default:
                return '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"><i class="fas fa-question mr-1"></i>Unknown</span>';
        }
    }

    // Helper function to get referrer information
    function getReferrerInfo(user) {
        if (!user.referred_by_name && !user.referrer_type) {
            return '<span class="text-gray-500">Direct signup</span>';
        }
        
        const referrerTypeBadge = user.referrer_type === 'admin' ? 
            '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mr-1"><i class="fas fa-user-shield mr-1"></i>Admin</span>' :
            '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-1"><i class="fas fa-user mr-1"></i>User</span>';
        
        return `
            <div class="flex flex-col">
                <div class="flex items-center mb-1">
                    ${referrerTypeBadge}
                </div>
                <div class="text-sm font-medium text-gray-900">${user.referred_by_name || 'Unknown'}</div>
                <div class="text-xs text-gray-500">${user.referred_by_email || ''}</div>
            </div>
        `;
    }

    // Helper function to get user actions based on user type
    function getUserActions(user) {
        if (user.user_type === 'Invited') {
            // For invited users, show invitation-specific actions
            const invitationId = user.id.replace('inv_', '');
            return `
                <button onclick="viewInvitationDetails('${invitationId}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="resendInvitation('${invitationId}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-paper-plane"></i> Resend
                </button>
                <button onclick="cancelInvitation('${invitationId}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-times"></i> Cancel
                </button>
            `;
        } else {
            // For registered users, show regular actions
            return `
                <button onclick="viewUserDetails(${user.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="updateUserStatus(${user.id}, '${user.approval_status}')" class="text-green-600 hover:text-green-900">
                    <i class="fas fa-edit"></i> Status
                </button>
            `;
        }
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Show error message
    function showError(message) {
        // You can implement a toast notification system here
        alert(message);
    }

    // Global functions for onclick handlers
    window.viewUserDetails = function(userId) {
        loadUserDetails(userId);
    };

    window.updateUserStatus = function(userId, currentStatus) {
        showStatusUpdateModal(userId, currentStatus);
    };

    // Load user details and show modal
    async function loadUserDetails(userId) {
        try {
            const response = await fetch(`../backend/user_details.php?id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load user details');
            }

            const data = await response.json();
            
            if (data.success) {
                displayUserDetails(data.user);
                document.getElementById('userDetailsModal').classList.remove('hidden');
            } else {
                showError(data.error || 'Failed to load user details');
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            showError('Failed to load user details');
        }
    }

    // Display user details in modal
    function displayUserDetails(user) {
        const content = document.getElementById('userDetailsContent');
        
        const statusBadge = getStatusClass(user.approval_status);
        const profileBadge = user.profile_completed ? 
            'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full' :
            'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full';
            
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div class="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span class="font-medium">Email:</span> ${user.email}</div>
                        <div><span class="font-medium">Full Name:</span> ${user.full_name || 'Not provided'}</div>
                        <div><span class="font-medium">User Number:</span> ${user.user_number || 'Not assigned'}</div>
                        <div><span class="font-medium">Enrollment:</span> ${user.enrollment_number || 'Not assigned'}</div>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Status</h4>
                    <div class="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span class="font-medium">Approval:</span> <span class="${statusBadge}">${user.approval_status}</span></div>
                        <div><span class="font-medium">Profile:</span> <span class="${profileBadge}">${user.profile_completed ? 'Complete' : 'Incomplete'}</span></div>
                        <div><span class="font-medium">Active:</span> ${user.is_active ? 'Yes' : 'No'}</div>
                    </div>
                </div>
                
                ${user.profile_completed ? `
                <div class="md:col-span-2">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Profile Details</h4>
                    <div class="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span class="font-medium">Date of Birth:</span> ${user.date_of_birth || 'Not provided'}</div>
                        <div><span class="font-medium">Phone:</span> ${user.phone || 'Not provided'}</div>
                        <div><span class="font-medium">Address:</span> ${user.address || 'Not provided'}</div>
                        <div><span class="font-medium">PIN Code:</span> ${user.pin_code || 'Not provided'}</div>
                    </div>
                </div>
                ` : ''}
                
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Subscription</h4>
                    <div class="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span class="font-medium">Status:</span> ${getMembershipStatusBadge(user.membership_status)}</div>
                        ${user.subscription_type ? `<div><span class="font-medium">Type:</span> ${user.subscription_type}</div>` : ''}
                        ${user.subscription_start ? `<div><span class="font-medium">Start:</span> ${formatDate(user.subscription_start)}</div>` : ''}
                        ${user.subscription_end ? `<div><span class="font-medium">End:</span> ${formatDate(user.subscription_end)}</div>` : ''}
                    </div>
                </div>
                
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Dates</h4>
                    <div class="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span class="font-medium">Created:</span> ${formatDate(user.created_at)}</div>
                        <div><span class="font-medium">Approved:</span> ${user.approved_at ? formatDate(user.approved_at) : 'Not approved'}</div>
                        <div><span class="font-medium">Last Login:</span> ${user.last_login ? formatDate(user.last_login) : 'Never'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show status update modal
    function showStatusUpdateModal(userId, currentStatus) {
        const modal = document.getElementById('approvalModal');
        const statusSelect = document.getElementById('approvalStatus');
        const userIdInput = document.getElementById('approvalUserId');
        
        // Store userId for form submission
        userIdInput.value = userId;
        statusSelect.value = currentStatus;
        
        modal.classList.remove('hidden');
    }

    // Close modals
    document.getElementById('closeUserModalBtn').addEventListener('click', function() {
        document.getElementById('userDetailsModal').classList.add('hidden');
    });

    document.getElementById('closeApprovalModalBtn').addEventListener('click', function() {
        document.getElementById('approvalModal').classList.add('hidden');
    });

    document.getElementById('cancelApprovalBtn').addEventListener('click', function() {
        document.getElementById('approvalModal').classList.add('hidden');
    });

    // Handle status update form
    document.getElementById('approvalForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('approvalUserId').value;
        const status = document.getElementById('approvalStatus').value;
        const notes = document.getElementById('approvalNotes').value;
        
        try {
            const response = await fetch('../backend/users.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    status: status,
                    notes: notes
                })
            });

            const data = await response.json();
            
            if (data.success) {
                document.getElementById('approvalModal').classList.add('hidden');
                loadUsers(); // Reload the users list
                showSuccess('User status updated successfully');
            } else {
                showError(data.error || 'Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            showError('Failed to update user status');
        }
    });

    // Success message function
    function showSuccess(message) {
        // Simple alert for now - you can enhance this with better notifications
        alert(message);
    }

    // Tab functionality
    function initializeTabs() {
        const usersTab = document.getElementById('usersTab');
        const resetRequestsTab = document.getElementById('resetRequestsTab');
        const usersTabContent = document.getElementById('usersTabContent');
        const resetRequestsTabContent = document.getElementById('resetRequestsTabContent');

        // Tab click handlers
        usersTab.addEventListener('click', function() {
            switchTab('users');
        });

        resetRequestsTab.addEventListener('click', function() {
            switchTab('resetRequests');
        });

        // Initialize with users tab active
        switchTab('users');

        // Initialize reset requests functionality
        initializeResetRequestsTab();
    }

    function switchTab(tabName) {
        const usersTab = document.getElementById('usersTab');
        const resetRequestsTab = document.getElementById('resetRequestsTab');
        const usersTabContent = document.getElementById('usersTabContent');
        const resetRequestsTabContent = document.getElementById('resetRequestsTabContent');

        // Reset all tabs
        usersTab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
        usersTab.classList.add('border-transparent', 'text-gray-500');
        resetRequestsTab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
        resetRequestsTab.classList.add('border-transparent', 'text-gray-500');

        usersTabContent.classList.add('hidden');
        resetRequestsTabContent.classList.add('hidden');

        // Activate selected tab
        if (tabName === 'users') {
            usersTab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
            usersTab.classList.remove('border-transparent', 'text-gray-500');
            usersTabContent.classList.remove('hidden');
            loadUsers();
        } else if (tabName === 'resetRequests') {
            resetRequestsTab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
            resetRequestsTab.classList.remove('border-transparent', 'text-gray-500');
            resetRequestsTabContent.classList.remove('hidden');
            loadPasswordResetRequests();
        }
    }

    // Password Reset Requests functionality
    function initializeResetRequestsTab() {
        const resetStatusFilter = document.getElementById('resetStatusFilter');
        const resetSearchInput = document.getElementById('resetSearchInput');
        const resetSearchBtn = document.getElementById('resetSearchBtn');

        // Event listeners for reset requests
        resetStatusFilter.addEventListener('change', function() {
            resetCurrentFilters.status = this.value;
            resetCurrentPage = 1;
            loadPasswordResetRequests();
        });

        resetSearchBtn.addEventListener('click', function() {
            resetCurrentFilters.search = resetSearchInput.value.trim();
            resetCurrentPage = 1;
            loadPasswordResetRequests();
        });

        // Reset link modal
        const closeResetLinkModalBtn = document.getElementById('closeResetLinkModalBtn');
        const copyResetLinkBtn = document.getElementById('copyResetLinkBtn');

        closeResetLinkModalBtn.addEventListener('click', function() {
            document.getElementById('resetLinkModal').classList.add('hidden');
        });

        copyResetLinkBtn.addEventListener('click', function() {
            const resetLinkInput = document.getElementById('resetLinkInput');
            resetLinkInput.select();
            document.execCommand('copy');
            
            // Show feedback
            const icon = copyResetLinkBtn.querySelector('i');
            const originalClass = icon.className;
            icon.className = 'fas fa-check text-green-500';
            
            setTimeout(() => {
                icon.className = originalClass;
            }, 2000);
        });
    }

    async function loadPasswordResetRequests() {
        try {
            const params = new URLSearchParams({
                page: resetCurrentPage,
                status: resetCurrentFilters.status,
                search: resetCurrentFilters.search
            });

            const response = await fetch(`../backend/password_reset_requests.php?${params}`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                displayPasswordResetRequests(data.requests);
                updateResetRequestsPagination(data.pagination);
                updatePendingCount(data.requests);
            } else {
                showError(data.error || 'Failed to load password reset requests');
            }
        } catch (error) {
            console.error('Error loading password reset requests:', error);
            showError('Failed to load password reset requests');
        }
    }

    function displayPasswordResetRequests(requests) {
        const tbody = document.getElementById('resetRequestsTableBody');
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No password reset requests found</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(request => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${request.full_name}</div>
                            <div class="text-sm text-gray-500">${request.email}</div>
                            <div class="text-xs text-gray-400">${request.enrollment_number}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${getUserTypeBadge(request.user_type)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${getResetStatusBadge(request.status)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>${formatDateTime(request.requested_at)}</div>
                    ${request.approved_at ? `<div class="text-xs">Approved: ${formatDateTime(request.approved_at)}</div>` : ''}
                    ${request.reset_token_expires ? `<div class="text-xs">Expires: ${formatDateTime(request.reset_token_expires)}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${getResetActionButtons(request)}
                </td>
            </tr>
        `).join('');
    }

    function getResetStatusBadge(status) {
        const badges = {
            'pending': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>',
            'approved': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>',
            'rejected': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>',
            'used': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Used</span>',
            'expired': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Expired</span>'
        };
        return badges[status] || status;
    }

    function getResetActionButtons(request) {
        if (request.status === 'pending') {
            return `
                <button onclick="handleResetAction(${request.id}, 'approve')" 
                        class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-check mr-1"></i>Approve
                </button>
                <button onclick="handleResetAction(${request.id}, 'reject')" 
                        class="text-red-600 hover:text-red-900">
                    <i class="fas fa-times mr-1"></i>Reject
                </button>
            `;
        } else if (request.status === 'approved') {
            return `
                <button onclick="viewResetLink('${request.reset_token}')" 
                        class="text-indigo-600 hover:text-indigo-900">
                    <i class="fas fa-link mr-1"></i>View Link
                </button>
            `;
        } else {
            return '<span class="text-gray-400">No actions available</span>';
        }
    }

    function updatePendingCount(requests) {
        const pendingCount = requests.filter(r => r.status === 'pending').length;
        const badge = document.getElementById('pendingResetCount');
        
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function updateResetRequestsPagination(pagination) {
        resetCurrentPage = pagination.current_page;
        resetTotalPages = pagination.total_pages;
        
        const paginationContainer = document.getElementById('resetRequestsPagination');
        
        if (pagination.total_pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        paginationContainer.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700">
                    Showing <span class="font-medium">${(pagination.current_page - 1) * pagination.per_page + 1}</span>
                    to <span class="font-medium">${Math.min(pagination.current_page * pagination.per_page, pagination.total_count)}</span>
                    of <span class="font-medium">${pagination.total_count}</span> requests
                </div>
                <div class="flex space-x-2">
                    <button onclick="loadResetRequestsPage(${pagination.current_page - 1})" 
                            ${pagination.current_page === 1 ? 'disabled' : ''}
                            class="px-3 py-1 border border-gray-300 rounded-md text-sm ${pagination.current_page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}">
                        Previous
                    </button>
                    <span class="px-3 py-1 text-sm text-gray-700">
                        Page ${pagination.current_page} of ${pagination.total_pages}
                    </span>
                    <button onclick="loadResetRequestsPage(${pagination.current_page + 1})" 
                            ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}
                            class="px-3 py-1 border border-gray-300 rounded-md text-sm ${pagination.current_page === pagination.total_pages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}">
                        Next
                    </button>
                </div>
            </div>
        `;
    }

    // Global functions for button handlers
    window.handleResetAction = async function(requestId, action) {
        try {
            const response = await fetch('../backend/password_reset_requests.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    request_id: requestId,
                    action: action
                })
            });

            const data = await response.json();
            
            if (data.success) {
                if (action === 'approve' && data.reset_link) {
                    showResetLink(data.reset_link, data.user_email);
                }
                loadPasswordResetRequests();
                showSuccess(data.message);
            } else {
                showError(data.error || `Failed to ${action} reset request`);
            }
        } catch (error) {
            console.error(`Error ${action}ing reset request:`, error);
            showError(`Failed to ${action} reset request`);
        }
    };

    window.viewResetLink = function(token) {
        const resetLink = `http://localhost/regapp2/public/frontend/reset_password.html?token=${token}`;
        showResetLink(resetLink, 'user');
    };

    window.loadResetRequestsPage = function(page) {
        if (page >= 1 && page <= resetTotalPages) {
            resetCurrentPage = page;
            loadPasswordResetRequests();
        }
    };

    function showResetLink(link, userEmail) {
        document.getElementById('resetUserEmail').textContent = userEmail;
        document.getElementById('resetLinkInput').value = link;
        document.getElementById('resetLinkModal').classList.remove('hidden');
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Global functions for invitation actions
    window.viewInvitationDetails = function(invitationId) {
        // Redirect to invitations page with the specific invitation
        window.location.href = `invitations.html?highlight=${invitationId}`;
    };

    window.resendInvitation = function(invitationId) {
        // This would integrate with the invitations API
        showSuccess('Invitation resend functionality would be implemented here');
    };

    window.cancelInvitation = function(invitationId) {
        if (confirm('Are you sure you want to cancel this invitation?')) {
            // This would integrate with the invitations API
            showSuccess('Invitation cancellation functionality would be implemented here');
        }
    };
}); 