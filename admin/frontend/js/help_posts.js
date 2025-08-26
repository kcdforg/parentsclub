import { apiFetch } from './api.js';

// State management
let currentPage = 1;
let currentPost = null;
let searchTimeout = null;
let statusCounts = { pending: 0, approved: 0, rejected: 0 };

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadHelpPosts();
    loadStatusCounts();
});

function initializeEventListeners() {
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeModerationModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounceSearch);
    document.getElementById('statusFilter').addEventListener('change', loadHelpPosts);
    document.getElementById('categoryFilter').addEventListener('change', loadHelpPosts);
    document.getElementById('sortFilter').addEventListener('change', loadHelpPosts);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        currentPage = 1;
        loadHelpPosts();
        loadStatusCounts();
    });
    
    // Moderation actions
    document.getElementById('approveBtn').addEventListener('click', () => moderatePost('approved'));
    document.getElementById('rejectBtn').addEventListener('click', () => moderatePost('rejected'));
    document.getElementById('pinBtn').addEventListener('click', togglePin);
    document.getElementById('editPostBtn').addEventListener('click', openEditModal);
    document.getElementById('deletePostBtn').addEventListener('click', deletePost);
    
    // Edit form
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    
    // Close modals on outside click
    document.getElementById('moderationModal').addEventListener('click', (e) => {
        if (e.target.id === 'moderationModal') closeModerationModal();
    });
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal();
    });
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadHelpPosts();
    }, 500);
}

async function loadHelpPosts() {
    try {
        showLoading();
        
        const search = document.getElementById('searchInput').value;
        const status = document.getElementById('statusFilter').value;
        const category = document.getElementById('categoryFilter').value;
        const sort = document.getElementById('sortFilter').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });
        
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        
        const response = await apiFetch(`help_posts.php?${params.toString()}`);
        
        if (response.success) {
            displayHelpPosts(response.data);
            updatePagination(response.pagination);
        } else {
            showError('Failed to load help posts');
        }
    } catch (error) {
        console.error('Error loading help posts:', error);
        showError('Failed to load help posts');
    }
}

async function loadStatusCounts() {
    try {
        // Load counts for each status
        const statuses = ['pending', 'approved', 'rejected'];
        for (const status of statuses) {
            const response = await apiFetch(`help_posts.php?status=${status}&limit=1`);
            if (response.success) {
                statusCounts[status] = response.pagination.total;
                document.getElementById(`${status}Count`).textContent = response.pagination.total;
            }
        }
    } catch (error) {
        console.error('Error loading status counts:', error);
    }
}

function displayHelpPosts(posts) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const postsList = document.getElementById('postsList');
    const container = document.getElementById('postsContainer');
    
    loadingState.classList.add('hidden');
    
    if (posts.length === 0) {
        emptyState.classList.remove('hidden');
        postsList.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    postsList.classList.remove('hidden');
    
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    const statusColor = getStatusColor(post.status);
    const hasImages = post.images && post.images.length > 0;
    const hasAttachments = post.attachments && post.attachments.length > 0;
    
    return `
        <div class="border-b border-gray-200 p-6 hover:bg-gray-50 transition-colors">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-medium text-gray-900 cursor-pointer hover:text-primary" 
                            onclick="openModerationModal(${post.id})">
                            ${escapeHtml(post.title)}
                        </h3>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                            ${capitalizeFirst(post.status)}
                        </span>
                        ${post.is_pinned ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-thumbtack mr-1"></i>Pinned</span>' : ''}
                        ${post.category ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${capitalizeFirst(post.category)}</span>` : ''}
                    </div>
                    
                    <p class="text-gray-600 text-sm mb-3 line-clamp-3">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
                    
                    <div class="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <span class="flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            ${escapeHtml(post.author_name || 'Unknown User')}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatDate(post.created_at)}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-heart mr-1"></i>
                            ${post.likes_count || 0} likes
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-comment mr-1"></i>
                            ${post.comments_count || 0} comments
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-eye mr-1"></i>
                            ${post.views_count || 0} views
                        </span>
                    </div>
                    
                    ${hasImages || hasAttachments ? `
                        <div class="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            ${hasImages ? `<span><i class="fas fa-image mr-1"></i>${post.images.length} image(s)</span>` : ''}
                            ${hasAttachments ? `<span><i class="fas fa-paperclip mr-1"></i>${post.attachments.length} attachment(s)</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="text-xs text-gray-500">
                        ${getVisibilityText(post)}
                    </div>
                </div>
                
                <div class="flex space-x-2 ml-4">
                    <button onclick="openModerationModal(${post.id})" 
                            class="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-gavel mr-1"></i>Moderate
                    </button>
                    <div class="relative">
                        <button onclick="toggleActionMenu(${post.id})" 
                                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div id="actionMenu_${post.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div class="py-1">
                                <button onclick="viewPost(${post.id})" 
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-eye mr-2"></i>View Details
                                </button>
                                <button onclick="quickEdit(${post.id})" 
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-edit mr-2"></i>Quick Edit
                                </button>
                                ${post.status === 'approved' ? `
                                    <button onclick="quickAction(${post.id}, '${post.is_pinned ? 'unpin' : 'pin'}')" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-thumbtack mr-2"></i>${post.is_pinned ? 'Unpin' : 'Pin'} Post
                                    </button>
                                ` : ''}
                                <button onclick="quickDelete(${post.id}, '${escapeHtml(post.title)}')" 
                                        class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                    <i class="fas fa-trash mr-2"></i>Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getVisibilityText(post) {
    if (post.visibility === 'public') {
        return 'Visible to: Public';
    } else if (post.visibility === 'groups') {
        const groupNames = post.target_group_names.map(g => g.name).join(', ');
        return `Visible to groups: ${groupNames}`;
    } else if (post.visibility === 'custom') {
        const targets = [];
        if (post.target_areas.length) targets.push(`Areas: ${post.target_areas.join(', ')}`);
        if (post.target_institutions.length) targets.push(`Institutions: ${post.target_institutions.join(', ')}`);
        if (post.target_companies.length) targets.push(`Companies: ${post.target_companies.join(', ')}`);
        return `Custom targeting: ${targets.join('; ')}`;
    }
    return 'Visibility: Unknown';
}

// Global functions for onclick handlers
window.openModerationModal = async function(postId) {
    try {
        const response = await apiFetch(`help_posts.php?id=${postId}`);
        if (response.success) {
            showModerationModal(response.data);
        } else {
            showError('Failed to load post details');
        }
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Failed to load post details');
    }
};

function showModerationModal(post) {
    const modal = document.getElementById('moderationModal');
    const content = document.getElementById('postContent');
    
    currentPost = post;
    
    // Update pin button text
    const pinBtn = document.getElementById('pinBtn');
    const pinBtnText = document.getElementById('pinBtnText');
    if (post.is_pinned) {
        pinBtnText.textContent = 'Unpin Post';
        pinBtn.className = 'bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium';
    } else {
        pinBtnText.textContent = 'Pin Post';
        pinBtn.className = 'bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium';
    }
    
    // Populate admin notes
    document.getElementById('adminNotes').value = post.admin_notes || '';
    
    // Hide/show buttons based on status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (post.status === 'approved') {
        approveBtn.classList.add('opacity-50', 'cursor-not-allowed');
        approveBtn.disabled = true;
        rejectBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        rejectBtn.disabled = false;
    } else if (post.status === 'rejected') {
        rejectBtn.classList.add('opacity-50', 'cursor-not-allowed');
        rejectBtn.disabled = true;
        approveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        approveBtn.disabled = false;
    } else {
        approveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        rejectBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
    }
    
    content.innerHTML = `
        <div class="bg-white rounded-lg">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(post.title)}</h2>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span class="flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            ${escapeHtml(post.author_name)} (${escapeHtml(post.author_email)})
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatDate(post.created_at)}
                        </span>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}">
                            ${capitalizeFirst(post.status)}
                        </span>
                        ${post.category ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${capitalizeFirst(post.category)}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="prose max-w-none mb-4">
                ${formatContent(post.content)}
            </div>
            
            ${post.images && post.images.length > 0 ? `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    ${post.images.map(img => `<img src="${img}" alt="Post image" class="rounded-lg max-h-32 object-cover">`).join('')}
                </div>
            ` : ''}
            
            ${post.attachments && post.attachments.length > 0 ? `
                <div class="border-t pt-4 mb-4">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                    <div class="space-y-1">
                        ${post.attachments.map(file => `
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-paperclip mr-2"></i>
                                <a href="${file}" target="_blank" class="text-primary hover:underline">
                                    ${file.split('/').pop()}
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="border-t pt-4">
                <div class="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                        <div class="text-2xl font-bold text-red-500">${post.likes_count || 0}</div>
                        <div class="text-gray-500">Likes</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-blue-500">${post.comments_count || 0}</div>
                        <div class="text-gray-500">Comments</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-green-500">${post.views_count || 0}</div>
                        <div class="text-gray-500">Views</div>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4 mt-4">
                <p class="text-sm text-gray-500">${getVisibilityText(post)}</p>
                ${post.moderated_at ? `
                    <p class="text-xs text-gray-400 mt-2">
                        Last moderated: ${formatDate(post.moderated_at)}
                        ${post.admin_notes ? `<br>Admin notes: ${escapeHtml(post.admin_notes)}` : ''}
                    </p>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModerationModal() {
    document.getElementById('moderationModal').classList.add('hidden');
    currentPost = null;
    hideError();
}

async function moderatePost(status) {
    if (!currentPost) return;
    
    const adminNotes = document.getElementById('adminNotes').value.trim();
    
    try {
        const response = await apiFetch('help_posts.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: currentPost.id,
                action: 'moderate',
                status: status,
                admin_notes: adminNotes || null
            })
        });
        
        if (response.success) {
            closeModerationModal();
            loadHelpPosts();
            loadStatusCounts();
            showSuccess(`Post ${status} successfully!`);
        } else {
            showError(response.error || `Failed to ${status} post`);
        }
    } catch (error) {
        console.error(`Error ${status}ing post:`, error);
        showError(`Failed to ${status} post`);
    }
}

async function togglePin() {
    if (!currentPost) return;
    
    const newPinnedState = !currentPost.is_pinned;
    
    try {
        const response = await apiFetch('help_posts.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: currentPost.id,
                action: 'moderate',
                is_pinned: newPinnedState
            })
        });
        
        if (response.success) {
            currentPost.is_pinned = newPinnedState;
            
            // Update button
            const pinBtn = document.getElementById('pinBtn');
            const pinBtnText = document.getElementById('pinBtnText');
            if (newPinnedState) {
                pinBtnText.textContent = 'Unpin Post';
                pinBtn.className = 'bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium';
            } else {
                pinBtnText.textContent = 'Pin Post';
                pinBtn.className = 'bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium';
            }
            
            loadHelpPosts();
            showSuccess(`Post ${newPinnedState ? 'pinned' : 'unpinned'} successfully!`);
        } else {
            showError(response.error || 'Failed to update pin status');
        }
    } catch (error) {
        console.error('Error toggling pin:', error);
        showError('Failed to update pin status');
    }
}

function openEditModal() {
    if (!currentPost) return;
    
    document.getElementById('editPostId').value = currentPost.id;
    document.getElementById('editTitle').value = currentPost.title;
    document.getElementById('editContent').value = currentPost.content;
    document.getElementById('editCategory').value = currentPost.category || '';
    
    document.getElementById('editModal').classList.remove('hidden');
    hideEditError();
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    hideEditError();
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitText = document.getElementById('editSubmitText');
    const submitSpinner = document.getElementById('editSubmitSpinner');
    
    // Show loading state
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitSpinner.classList.remove('hidden');
    
    try {
        const formData = new FormData(e.target);
        const data = {
            id: parseInt(document.getElementById('editPostId').value),
            action: 'edit',
            title: document.getElementById('editTitle').value.trim(),
            content: document.getElementById('editContent').value.trim(),
            category: document.getElementById('editCategory').value
        };
        
        if (!data.title || !data.content) {
            showEditError('Title and content are required');
            return;
        }
        
        const response = await apiFetch('help_posts.php', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            closeEditModal();
            closeModerationModal();
            loadHelpPosts();
            showSuccess('Post updated successfully!');
        } else {
            showEditError(response.error || 'Failed to update post');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showEditError('Failed to update post');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
    }
}

async function deletePost() {
    if (!currentPost) return;
    
    if (!confirm(`Are you sure you want to delete "${currentPost.title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`help_posts.php?id=${currentPost.id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            closeModerationModal();
            loadHelpPosts();
            loadStatusCounts();
            showSuccess('Post deleted successfully!');
        } else {
            showError(response.error || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showError('Failed to delete post');
    }
}

// Quick action functions
window.toggleActionMenu = function(postId) {
    const menu = document.getElementById(`actionMenu_${postId}`);
    // Close all other menus
    document.querySelectorAll('[id^="actionMenu_"]').forEach(m => {
        if (m.id !== `actionMenu_${postId}`) {
            m.classList.add('hidden');
        }
    });
    menu.classList.toggle('hidden');
};

window.viewPost = function(postId) {
    openModerationModal(postId);
};

window.quickEdit = function(postId) {
    openModerationModal(postId).then(() => {
        setTimeout(() => openEditModal(), 100);
    });
};

window.quickAction = async function(postId, action) {
    if (action === 'pin' || action === 'unpin') {
        try {
            const response = await apiFetch('help_posts.php', {
                method: 'PUT',
                body: JSON.stringify({
                    id: postId,
                    action: 'moderate',
                    is_pinned: action === 'pin'
                })
            });
            
            if (response.success) {
                loadHelpPosts();
                showSuccess(`Post ${action}ned successfully!`);
            } else {
                showError(response.error || `Failed to ${action} post`);
            }
        } catch (error) {
            console.error(`Error ${action}ning post:`, error);
            showError(`Failed to ${action} post`);
        }
    }
};

window.quickDelete = async function(postId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`help_posts.php?id=${postId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            loadHelpPosts();
            loadStatusCounts();
            showSuccess('Post deleted successfully!');
        } else {
            showError(response.error || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showError('Failed to delete post');
    }
};

// Close action menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('[onclick^="toggleActionMenu"]')) {
        document.querySelectorAll('[id^="actionMenu_"]').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});

function updatePagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.pages <= 1) {
        paginationDiv.classList.add('hidden');
        return;
    }
    
    paginationDiv.classList.remove('hidden');
    // Implement pagination similar to other modules
}

// Utility functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('postsList').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('moderationError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function hideError() {
    const errorDiv = document.getElementById('moderationError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showEditError(message) {
    const errorDiv = document.getElementById('editError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function hideEditError() {
    const errorDiv = document.getElementById('editError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showSuccess(message) {
    console.log('Success:', message);
    alert(message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatContent(content) {
    // Simple markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/https?:\/\/[^\s]+/g, '<a href="$&" class="text-primary hover:underline" target="_blank">$&</a>');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
