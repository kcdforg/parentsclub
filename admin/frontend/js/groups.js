import { apiFetch } from './api.js';

// State management
let currentPage = 1;
let currentGroupId = null;
let searchTimeout = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadGroups();
});

function initializeEventListeners() {
    // Create group button
    document.getElementById('createGroupBtn').addEventListener('click', () => openGroupModal());
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeGroupModal);
    document.getElementById('cancelBtn').addEventListener('click', closeGroupModal);
    document.getElementById('closeMembersModal').addEventListener('click', closeMembersModal);
    
    // Form submission
    document.getElementById('groupForm').addEventListener('submit', handleGroupSubmit);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounceSearch);
    document.getElementById('typeFilter').addEventListener('change', loadGroups);
    document.getElementById('refreshBtn').addEventListener('click', loadGroups);
    
    // Group type selection
    document.getElementById('groupType').addEventListener('change', handleGroupTypeChange);
    
    // Member management
    document.getElementById('searchUsersBtn').addEventListener('click', searchUsers);
    document.getElementById('memberSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchUsers();
        }
    });
    
    // Close modals on outside click
    document.getElementById('groupModal').addEventListener('click', (e) => {
        if (e.target.id === 'groupModal') closeGroupModal();
    });
    document.getElementById('membersModal').addEventListener('click', (e) => {
        if (e.target.id === 'membersModal') closeMembersModal();
    });
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadGroups();
    }, 500);
}

function handleGroupTypeChange() {
    const type = document.getElementById('groupType').value;
    const districtField = document.getElementById('districtField');
    const areaField = document.getElementById('areaField');
    const pinCodeField = document.getElementById('pinCodeField');
    
    // Hide all fields first
    districtField.classList.add('hidden');
    areaField.classList.add('hidden');
    pinCodeField.classList.add('hidden');
    
    if (type === 'district') {
        districtField.classList.remove('hidden');
    } else if (type === 'area') {
        areaField.classList.remove('hidden');
        pinCodeField.classList.remove('hidden');
    }
}

async function loadGroups() {
    try {
        showLoading();
        
        const search = document.getElementById('searchInput').value;
        const type = document.getElementById('typeFilter').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });
        
        if (search) params.append('search', search);
        if (type) params.append('type', type);
        
        const response = await apiFetch(`groups.php?${params.toString()}`);
        
        if (response.success) {
            displayGroups(response.data);
            updatePagination(response.pagination);
        } else {
            showError('Failed to load groups');
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        showError('Failed to load groups');
    }
}

function displayGroups(groups) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const groupsTable = document.getElementById('groupsTable');
    const tbody = document.getElementById('groupsTableBody');
    
    loadingState.classList.add('hidden');
    
    if (groups.length === 0) {
        emptyState.classList.remove('hidden');
        groupsTable.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    groupsTable.classList.remove('hidden');
    
    tbody.innerHTML = groups.map(group => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(group.name)}</div>
                    ${group.description ? `<div class="text-sm text-gray-500">${escapeHtml(group.description)}</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(group.type)}">
                    ${getTypeIcon(group.type)} ${capitalizeFirst(group.type)}
                </span>
                ${group.district ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(group.district)}</div>` : ''}
                ${group.area ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(group.area)}</div>` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex items-center">
                    <i class="fas fa-users mr-1 text-gray-400"></i>
                    ${group.member_count || 0}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>${formatDate(group.created_at)}</div>
                <div class="text-xs">by ${escapeHtml(group.created_by_name || 'Unknown')}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="viewMembers(${group.id}, '${escapeHtml(group.name)}')" 
                            class="text-primary hover:text-primary/80" title="View Members">
                        <i class="fas fa-users"></i>
                    </button>
                    <button onclick="editGroup(${group.id})" 
                            class="text-indigo-600 hover:text-indigo-900" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGroup(${group.id}, '${escapeHtml(group.name)}')" 
                            class="text-red-600 hover:text-red-900" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getTypeColor(type) {
    switch (type) {
        case 'district': return 'bg-blue-100 text-blue-800';
        case 'area': return 'bg-green-100 text-green-800';
        case 'custom': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getTypeIcon(type) {
    switch (type) {
        case 'district': return '<i class="fas fa-building mr-1"></i>';
        case 'area': return '<i class="fas fa-map-marker-alt mr-1"></i>';
        case 'custom': return '<i class="fas fa-users mr-1"></i>';
        default: return '<i class="fas fa-circle mr-1"></i>';
    }
}

function updatePagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.pages <= 1) {
        paginationDiv.classList.add('hidden');
        return;
    }
    
    paginationDiv.classList.remove('hidden');
    
    document.getElementById('showingFrom').textContent = ((pagination.page - 1) * pagination.limit) + 1;
    document.getElementById('showingTo').textContent = Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('totalItems').textContent = pagination.total;
    
    generatePaginationNumbers(pagination);
}

function generatePaginationNumbers(pagination) {
    const container = document.getElementById('paginationNumbers');
    const { page, pages } = pagination;
    
    let html = '';
    
    // Previous button
    html += `
        <button ${page <= 1 ? 'disabled' : ''} onclick="changePage(${page - 1})"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page <= 1 ? 'cursor-not-allowed opacity-50' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    
    if (start > 1) {
        html += `<button onclick="changePage(1)" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">1</button>`;
        if (start > 2) {
            html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
        }
    }
    
    for (let i = start; i <= end; i++) {
        html += `
            <button onclick="changePage(${i})"
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${i === page ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }
    
    if (end < pages) {
        if (end < pages - 1) {
            html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
        }
        html += `<button onclick="changePage(${pages})" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">${pages}</button>`;
    }
    
    // Next button
    html += `
        <button ${page >= pages ? 'disabled' : ''} onclick="changePage(${page + 1})"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page >= pages ? 'cursor-not-allowed opacity-50' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

function openGroupModal(group = null) {
    const modal = document.getElementById('groupModal');
    const form = document.getElementById('groupForm');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtnText');
    
    form.reset();
    hideError();
    
    if (group) {
        title.textContent = 'Edit Group';
        submitBtn.textContent = 'Update Group';
        
        document.getElementById('groupId').value = group.id;
        document.getElementById('groupName').value = group.name;
        document.getElementById('groupDescription').value = group.description || '';
        document.getElementById('groupType').value = group.type;
        
        if (group.district) document.getElementById('groupDistrict').value = group.district;
        if (group.area) document.getElementById('groupArea').value = group.area;
        if (group.pin_code) document.getElementById('groupPinCode').value = group.pin_code;
        
        handleGroupTypeChange();
    } else {
        title.textContent = 'Create New Group';
        submitBtn.textContent = 'Create Group';
        document.getElementById('groupId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeGroupModal() {
    document.getElementById('groupModal').classList.add('hidden');
}

async function handleGroupSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnSpinner = document.getElementById('submitBtnSpinner');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtnText.classList.add('hidden');
    submitBtnSpinner.classList.remove('hidden');
    
    try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Remove empty fields
        Object.keys(data).forEach(key => {
            if (!data[key]) delete data[key];
        });
        
        const isEdit = !!data.id;
        const url = 'groups.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiFetch(url, {
            method,
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            closeGroupModal();
            loadGroups();
            showSuccess(isEdit ? 'Group updated successfully!' : 'Group created successfully!');
        } else {
            showError(response.error || 'Failed to save group');
        }
    } catch (error) {
        console.error('Error saving group:', error);
        showError('Failed to save group');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        submitBtnText.classList.remove('hidden');
        submitBtnSpinner.classList.add('hidden');
    }
}

async function viewMembers(groupId, groupName) {
    currentGroupId = groupId;
    
    const modal = document.getElementById('membersModal');
    const title = document.getElementById('membersModalTitle');
    
    title.textContent = `${groupName} - Members`;
    modal.classList.remove('hidden');
    
    await loadGroupMembers(groupId);
}

async function loadGroupMembers(groupId) {
    try {
        const response = await apiFetch(`group_members.php?group_id=${groupId}`);
        
        if (response.success) {
            displayGroupMembers(response.data);
        } else {
            showError('Failed to load group members');
        }
    } catch (error) {
        console.error('Error loading group members:', error);
        showError('Failed to load group members');
    }
}

function displayGroupMembers(members) {
    const container = document.getElementById('membersContent');
    
    if (members.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                <p class="text-gray-500">Add members to this group using the search above.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${members.map(member => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <div class="text-sm font-medium text-gray-900">${escapeHtml(member.full_name || 'Unknown')}</div>
                                    <div class="text-sm text-gray-500">${escapeHtml(member.email)}</div>
                                    ${member.phone ? `<div class="text-sm text-gray-500">${escapeHtml(member.phone)}</div>` : ''}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <select onchange="updateMemberRole(${member.id}, this.value)" 
                                        class="text-sm px-2 py-1 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    <option value="member" ${member.role === 'member' ? 'selected' : ''}>Member</option>
                                    <option value="moderator" ${member.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                                    <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>${formatDate(member.joined_at)}</div>
                                <div class="text-xs">by ${escapeHtml(member.added_by_name || 'System')}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onclick="removeMember(${member.id}, '${escapeHtml(member.full_name || member.email)}')" 
                                        class="text-red-600 hover:text-red-900" title="Remove">
                                    <i class="fas fa-times"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function searchUsers() {
    const search = document.getElementById('memberSearch').value.trim();
    
    if (!search) {
        document.getElementById('userSearchResults').classList.add('hidden');
        return;
    }
    
    try {
        const response = await apiFetch(`group_members.php?search=${encodeURIComponent(search)}`);
        
        if (response.success) {
            displayUserSearchResults(response.data);
        } else {
            showError('Failed to search users');
        }
    } catch (error) {
        console.error('Error searching users:', error);
        showError('Failed to search users');
    }
}

function displayUserSearchResults(users) {
    const container = document.getElementById('userSearchResults');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No users found matching your search.
            </div>
        `;
    } else {
        container.innerHTML = users.map(user => `
            <div class="p-3 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(user.full_name || 'Unknown')}</div>
                    <div class="text-sm text-gray-500">${escapeHtml(user.email)}</div>
                    ${user.phone ? `<div class="text-xs text-gray-500">${escapeHtml(user.phone)}</div>` : ''}
                </div>
                <button onclick="addMember(${user.id})" 
                        class="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary/90">
                    Add
                </button>
            </div>
        `).join('');
    }
    
    container.classList.remove('hidden');
}

async function addMember(userId) {
    try {
        const role = document.getElementById('memberRole').value;
        
        const response = await apiFetch('group_members.php', {
            method: 'POST',
            body: JSON.stringify({
                group_id: currentGroupId,
                user_id: userId,
                role: role
            })
        });
        
        if (response.success) {
            document.getElementById('memberSearch').value = '';
            document.getElementById('userSearchResults').classList.add('hidden');
            await loadGroupMembers(currentGroupId);
            showSuccess('Member added successfully!');
        } else {
            showError(response.error || 'Failed to add member');
        }
    } catch (error) {
        console.error('Error adding member:', error);
        showError('Failed to add member');
    }
}

async function updateMemberRole(memberId, newRole) {
    try {
        const response = await apiFetch('group_members.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: memberId,
                role: newRole
            })
        });
        
        if (response.success) {
            showSuccess('Member role updated successfully!');
        } else {
            showError(response.error || 'Failed to update member role');
            await loadGroupMembers(currentGroupId); // Reload to reset the select
        }
    } catch (error) {
        console.error('Error updating member role:', error);
        showError('Failed to update member role');
        await loadGroupMembers(currentGroupId); // Reload to reset the select
    }
}

async function removeMember(memberId, memberName) {
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`group_members.php?id=${memberId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            await loadGroupMembers(currentGroupId);
            showSuccess('Member removed successfully!');
        } else {
            showError(response.error || 'Failed to remove member');
        }
    } catch (error) {
        console.error('Error removing member:', error);
        showError('Failed to remove member');
    }
}

function closeMembersModal() {
    document.getElementById('membersModal').classList.add('hidden');
    currentGroupId = null;
}

// Global functions for onclick handlers
window.viewMembers = viewMembers;
window.editGroup = async function(groupId) {
    try {
        const response = await apiFetch(`groups.php?id=${groupId}`);
        if (response.success) {
            openGroupModal(response.data);
        } else {
            showError('Failed to load group details');
        }
    } catch (error) {
        console.error('Error loading group:', error);
        showError('Failed to load group details');
    }
};

window.deleteGroup = async function(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`groups.php?id=${groupId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            loadGroups();
            showSuccess('Group deleted successfully!');
        } else {
            showError(response.error || 'Failed to delete group');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        showError('Failed to delete group');
    }
};

window.changePage = function(page) {
    currentPage = page;
    loadGroups();
};

window.addMember = addMember;
window.updateMemberRole = updateMemberRole;
window.removeMember = removeMember;

// Utility functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('groupsTable').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('groupError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function hideError() {
    const errorDiv = document.getElementById('groupError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showSuccess(message) {
    // You can implement a toast notification here
    console.log('Success:', message);
    alert(message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
