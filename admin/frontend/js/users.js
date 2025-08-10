// Users management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const sessionToken = localStorage.getItem('admin_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize variables
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {
        status: '',
        search: ''
    };

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
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
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
                    <span class="${statusClass}">${user.approval_status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${profileStatus}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(user.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewUserDetails(${user.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button onclick="updateUserStatus(${user.id}, '${user.approval_status}')" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-edit"></i> Status
                    </button>
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
        // Implement user details modal
        console.log('View user details:', userId);
    };

    window.updateUserStatus = function(userId, currentStatus) {
        // Implement status update modal
        console.log('Update user status:', userId, currentStatus);
    };
}); 