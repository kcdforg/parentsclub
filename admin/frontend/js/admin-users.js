import { apiFetch } from './api.js';

// Admin users management functionality
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
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageSpan = document.getElementById('currentPage');
    const showingStartSpan = document.getElementById('showingStart');
    const showingEndSpan = document.getElementById('showingEnd');
    const totalAdminUsersSpan = document.getElementById('totalAdminUsers');
    
    // Modal elements
    const createAdminBtn = document.getElementById('createAdminBtn');
    const createAdminModal = document.getElementById('createAdminModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const createAdminForm = document.getElementById('createAdminForm');
    const createAdminSubmitBtn = document.getElementById('createAdminSubmitBtn');
    const createAdminBtnText = document.getElementById('createAdminBtnText');
    const createAdminBtnSpinner = document.getElementById('createAdminBtnSpinner');
    const createAdminError = document.getElementById('createAdminError');
    const cancelCreateAdminBtn = document.getElementById('cancelCreateAdminBtn');
    
    const editAdminModal = document.getElementById('editAdminModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const editAdminForm = document.getElementById('editAdminForm');
    const editAdminSubmitBtn = document.getElementById('editAdminSubmitBtn');
    const editAdminBtnText = document.getElementById('editAdminBtnText');
    const editAdminBtnSpinner = document.getElementById('editAdminBtnSpinner');
    const editAdminError = document.getElementById('editAdminError');
    const cancelEditAdminBtn = document.getElementById('cancelEditAdminBtn');

    // Event listeners
    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        currentPage = 1;
        loadAdminUsers();
    });

    searchBtn.addEventListener('click', function() {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadAdminUsers();
    });

    resetFiltersBtn.addEventListener('click', function() {
        statusFilter.value = '';
        searchInput.value = '';
        currentFilters = { status: '', search: '' };
        currentPage = 1;
        loadAdminUsers();
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadAdminUsers();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadAdminUsers();
        }
    });

    // Modal event listeners
    createAdminBtn.addEventListener('click', function() {
        createAdminModal.classList.remove('hidden');
        createAdminForm.reset();
        createAdminError.classList.add('hidden');
    });

    closeModalBtn.addEventListener('click', function() {
        createAdminModal.classList.add('hidden');
    });

    cancelCreateAdminBtn.addEventListener('click', function() {
        createAdminModal.classList.add('hidden');
    });

    closeEditModalBtn.addEventListener('click', function() {
        editAdminModal.classList.add('hidden');
    });

    cancelEditAdminBtn.addEventListener('click', function() {
        editAdminModal.classList.add('hidden');
    });

    // Close modals when clicking outside
    createAdminModal.addEventListener('click', function(e) {
        if (e.target === createAdminModal) {
            createAdminModal.classList.add('hidden');
        }
    });

    editAdminModal.addEventListener('click', function(e) {
        if (e.target === editAdminModal) {
            editAdminModal.classList.add('hidden');
        }
    });

    // Form submissions
    createAdminForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createAdminUser();
    });

    editAdminForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateAdminUser();
    });

    // Navigation is now handled by admin-nav.js

    // Load admin users on page load
    loadAdminUsers();

    // Load admin users function
    async function loadAdminUsers() {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                status: currentFilters.status,
                search: currentFilters.search
            });

            const data = await apiFetch(`admin_users.php?${params}`, {
                method: 'GET'
            });

            if (data.success) {
                displayAdminUsers(data.admin_users);
                updatePagination(data.pagination);
            } else {
                showError(data.error || 'Failed to load admin users');
            }
        } catch (error) {
            console.error('Error loading admin users:', error);
            showError('Failed to load admin users. Please try again.');
        }
    }

    // Display admin users in table
    function displayAdminUsers(adminUsers) {
        adminUsersTableBody.innerHTML = '';
        
        if (adminUsers.length === 0) {
            adminUsersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        No admin users found
                    </td>
                </tr>
            `;
            return;
        }

        adminUsers.forEach(admin => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const statusClass = admin.is_active ? 
                'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full' :
                'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                <span class="text-white font-medium">${admin.username.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${admin.username}</div>
                            <div class="text-sm text-gray-500">ID: ${admin.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${admin.email}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="${statusClass}">${admin.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(admin.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${admin.created_by_username ? admin.created_by_username : 'System'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editAdminUser(${admin.id}, '${admin.username}', '${admin.email}', ${admin.is_active})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${admin.is_active ? 
                        `<button onclick="toggleAdminStatus(${admin.id}, false)" class="text-yellow-600 hover:text-yellow-900 mr-3">
                            <i class="fas fa-pause"></i> Deactivate
                        </button>` :
                        `<button onclick="toggleAdminStatus(${admin.id}, true)" class="text-green-600 hover:text-green-900 mr-3">
                            <i class="fas fa-play"></i> Activate
                        </button>`
                    }
                    <button onclick="deleteAdminUser(${admin.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            
            adminUsersTableBody.appendChild(row);
        });
    }

    // Update pagination display
    function updatePagination(pagination) {
        currentPage = pagination.current_page;
        totalPages = pagination.total_pages;
        
        currentPageSpan.textContent = `Page ${currentPage}`;
        showingStartSpan.textContent = pagination.start;
        showingEndSpan.textContent = pagination.end;
        totalAdminUsersSpan.textContent = pagination.total;
        
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
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

    // Create admin user
    async function createAdminUser() {
        const formData = new FormData(createAdminForm);
        
        if (formData.get('password') !== formData.get('confirm_password')) {
            showFormError('Passwords do not match');
            return;
        }

        const adminData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            showCreateLoading(true);
            createAdminError.classList.add('hidden');

            const data = await apiFetch('admin_users.php', {
                method: 'POST',
                body: JSON.stringify(adminData)
            });

            if (data.success) {
                createAdminModal.classList.add('hidden');
                showSuccess('Admin user created successfully!');
                loadAdminUsers();
            } else {
                showFormError(data.error || 'Failed to create admin user');
            }
        } catch (error) {
            console.error('Error creating admin user:', error);
            showFormError('Failed to create admin user. Please try again.');
        } finally {
            showCreateLoading(false);
        }
    }

    // Update admin user
    async function updateAdminUser() {
        const formData = new FormData(editAdminForm);
        const adminData = {
            admin_id: formData.get('admin_id'),
            username: formData.get('username'),
            email: formData.get('email'),
            is_active: formData.get('is_active')
        };

        try {
            showEditLoading(true);
            editAdminError.classList.add('hidden');

            const data = await apiFetch('admin_users.php', {
                method: 'PUT',
                body: JSON.stringify(adminData)
            });

            if (data.success) {
                editAdminModal.classList.add('hidden');
                showSuccess('Admin user updated successfully!');
                loadAdminUsers();
            } else {
                showEditFormError(data.error || 'Failed to update admin user');
            }
        } catch (error) {
            console.error('Error updating admin user:', error);
            showEditFormError('Failed to update admin user. Please try again.');
        } finally {
            showEditLoading(false);
        }
    }

    // Show/hide loading states
    function showCreateLoading(loading) {
        if (loading) {
            createAdminBtnText.classList.add('hidden');
            createAdminBtnSpinner.classList.remove('hidden');
            createAdminSubmitBtn.disabled = true;
        } else {
            createAdminBtnText.classList.remove('hidden');
            createAdminBtnSpinner.classList.add('hidden');
            createAdminSubmitBtn.disabled = false;
        }
    }

    function showEditLoading(loading) {
        if (loading) {
            editAdminBtnText.classList.add('hidden');
            editAdminBtnSpinner.classList.remove('hidden');
            editAdminSubmitBtn.disabled = true;
        } else {
            editAdminBtnText.classList.remove('hidden');
            editAdminBtnSpinner.classList.add('hidden');
            editAdminSubmitBtn.disabled = false;
        }
    }

    // Show form errors
    function showFormError(message) {
        createAdminError.textContent = message;
        createAdminError.classList.remove('hidden');
    }

    function showEditFormError(message) {
        editAdminError.textContent = message;
        editAdminError.classList.remove('hidden');
    }

    // Show success message
    function showSuccess(message) {
        // You can implement a toast notification system here
        window.showToast(message, 'success');
    }

    // Show error message
    function showError(message) {
        // You can implement a toast notification system here
        window.showModal('Error', message, true);
    }

    // Global functions for onclick handlers
    window.editAdminUser = function(adminId, username, email, isActive) {
        document.getElementById('editAdminId').value = adminId;
        document.getElementById('editAdminUsername').value = username;
        document.getElementById('editAdminEmail').value = email;
        document.getElementById('editAdminStatus').value = isActive ? '1' : '0';
        editAdminModal.classList.remove('hidden');
        editAdminError.classList.add('hidden');
    };

    window.toggleAdminStatus = async function(adminId, activate) {
        const action = activate ? 'activate' : 'deactivate';
        const confirmed = await window.showModal('Confirm Action', `Are you sure you want to ${action} this admin user?`, false, true);
        
        if (confirmed) {
            try {
                const data = await apiFetch('admin_users.php', {
                    method: 'PUT',
                    body: JSON.stringify({
                        admin_id: adminId,
                        action: 'toggle_status'
                    })
                });

                if (data.success) {
                    window.showToast(data.message, 'success');
                    loadAdminUsers();
                } else {
                    showError(data.error || 'Failed to update admin status');
                }
            } catch (error) {
                console.error('Error toggling admin status:', error);
                showError('Failed to update admin status. Please try again.');
            }
        }
    };

    window.deleteAdminUser = async function(adminId) {
        const confirmed = await window.showModal('Confirm Deletion', 'Are you sure you want to delete this admin user? This action cannot be undone.', false, true);
        
        if (confirmed) {
            try {
                const data = await apiFetch('admin_users.php', {
                    method: 'DELETE',
                    body: JSON.stringify({
                        admin_id: adminId
                    })
                });

                if (data.success) {
                    window.showToast(data.message, 'success');
                    loadAdminUsers();
                } else {
                    showError(data.error || 'Failed to delete admin user');
                }
            } catch (error) {
                console.error('Error deleting admin user:', error);
                showError('Failed to delete admin user. Please try again.');
            }
        }
    };
}); 