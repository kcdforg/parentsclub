import { apiFetch } from './api.js';

// State management
let currentPage = 1;
let currentAnnouncement = null;
let uploadedImages = [];
let uploadedAttachments = [];
let availableGroups = [];
let searchTimeout = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadGroups();
    loadAnnouncements();
});

function initializeEventListeners() {
    // Create announcement button
    document.getElementById('createAnnouncementBtn').addEventListener('click', () => openAnnouncementModal());
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeAnnouncementModal);
    document.getElementById('cancelBtn').addEventListener('click', closeAnnouncementModal);
    
    // Tab navigation
    document.getElementById('contentTab').addEventListener('click', () => showTab('content'));
    document.getElementById('previewTab').addEventListener('click', () => showTab('preview'));
    
    // Form submission
    document.getElementById('announcementForm').addEventListener('submit', handleSubmit);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounceSearch);
    document.getElementById('groupFilter').addEventListener('change', loadAnnouncements);
    document.getElementById('statusFilter').addEventListener('change', loadAnnouncements);
    document.getElementById('refreshBtn').addEventListener('click', loadAnnouncements);
    
    // Preview and navigation
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('backBtn').addEventListener('click', () => showTab('content'));
    
    // File uploads
    setupFileUploads();
    
    // Close modal on outside click
    document.getElementById('announcementModal').addEventListener('click', (e) => {
        if (e.target.id === 'announcementModal') closeAnnouncementModal();
    });
}

function setupFileUploads() {
    // Image uploads
    const imageDropZone = document.getElementById('imageDropZone');
    const imageInput = document.getElementById('imageInput');
    
    imageDropZone.addEventListener('click', () => imageInput.click());
    imageDropZone.addEventListener('dragover', handleDragOver);
    imageDropZone.addEventListener('drop', (e) => handleDrop(e, 'image'));
    imageInput.addEventListener('change', (e) => handleFileSelect(e, 'image'));
    
    // Attachment uploads
    const attachmentDropZone = document.getElementById('attachmentDropZone');
    const attachmentInput = document.getElementById('attachmentInput');
    
    attachmentDropZone.addEventListener('click', () => attachmentInput.click());
    attachmentDropZone.addEventListener('dragover', handleDragOver);
    attachmentDropZone.addEventListener('drop', (e) => handleDrop(e, 'attachment'));
    attachmentInput.addEventListener('change', (e) => handleFileSelect(e, 'attachment'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files, type);
}

function handleFileSelect(e, type) {
    const files = Array.from(e.target.files);
    uploadFiles(files, type);
}

async function uploadFiles(files, type) {
    for (const file of files) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showError(`File ${file.name} is too large. Maximum size is 5MB.`);
            continue;
        }
        
        await uploadSingleFile(file, type);
    }
}

async function uploadSingleFile(file, type) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_type', 'announcement');
        
        const response = await fetch('backend/upload.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_session_token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (type === 'image') {
                uploadedImages.push(result.data);
                addImagePreview(result.data);
            } else {
                uploadedAttachments.push(result.data);
                addAttachmentPreview(result.data);
            }
        } else {
            showError(`Failed to upload ${file.name}: ${result.error}`);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError(`Failed to upload ${file.name}`);
    }
}

function addImagePreview(file) {
    const container = document.getElementById('imagePreview');
    const preview = document.createElement('div');
    preview.className = 'relative group';
    preview.innerHTML = `
        <img src="${file.url}" alt="${file.original_filename}" class="preview-image w-full h-24 object-cover rounded-lg">
        <button onclick="removeFile('${file.id}', 'image')" 
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fas fa-times text-xs"></i>
        </button>
        <p class="text-xs text-gray-600 mt-1 truncate">${file.original_filename}</p>
    `;
    container.appendChild(preview);
}

function addAttachmentPreview(file) {
    const container = document.getElementById('attachmentPreview');
    const preview = document.createElement('div');
    preview.className = 'flex items-center justify-between bg-gray-50 p-2 rounded-lg';
    preview.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-file text-gray-400 mr-2"></i>
            <span class="text-sm text-gray-900 truncate">${file.original_filename}</span>
        </div>
        <button onclick="removeFile('${file.id}', 'attachment')" 
                class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(preview);
}

window.removeFile = async function(fileId, type) {
    try {
        const response = await apiFetch(`upload.php?id=${fileId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            if (type === 'image') {
                uploadedImages = uploadedImages.filter(f => f.id !== parseInt(fileId));
                document.getElementById('imagePreview').innerHTML = '';
                uploadedImages.forEach(addImagePreview);
            } else {
                uploadedAttachments = uploadedAttachments.filter(f => f.id !== parseInt(fileId));
                document.getElementById('attachmentPreview').innerHTML = '';
                uploadedAttachments.forEach(addAttachmentPreview);
            }
        }
    } catch (error) {
        console.error('Error removing file:', error);
    }
};

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadAnnouncements();
    }, 500);
}

async function loadGroups() {
    try {
        const response = await apiFetch('groups.php');
        if (response.success) {
            availableGroups = response.data;
            populateGroupFilter();
            populateGroupSelection();
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function populateGroupFilter() {
    const select = document.getElementById('groupFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Groups</option>';
    
    availableGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

function populateGroupSelection() {
    const container = document.getElementById('groupSelection');
    container.innerHTML = '';
    
    if (availableGroups.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No groups available</p>';
        return;
    }
    
    availableGroups.forEach(group => {
        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="group_${group.id}" name="target_groups" value="${group.id}" 
                   class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
            <label for="group_${group.id}" class="ml-2 block text-sm text-gray-900">
                ${escapeHtml(group.name)}
                <span class="text-gray-500">(${group.member_count || 0} members)</span>
            </label>
        `;
        container.appendChild(checkbox);
    });
}

async function loadAnnouncements() {
    try {
        showLoading();
        
        const search = document.getElementById('searchInput').value;
        const groupId = document.getElementById('groupFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12
        });
        
        if (search) params.append('search', search);
        if (groupId) params.append('group_id', groupId);
        if (status) params.append('status', status);
        
        const response = await apiFetch(`announcements.php?${params.toString()}`);
        
        if (response.success) {
            displayAnnouncements(response.data);
            updatePagination(response.pagination);
        } else {
            showError('Failed to load announcements');
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        showError('Failed to load announcements');
    }
}

function displayAnnouncements(announcements) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const announcementsGrid = document.getElementById('announcementsGrid');
    const container = document.getElementById('announcementsContainer');
    
    loadingState.classList.add('hidden');
    
    if (announcements.length === 0) {
        emptyState.classList.remove('hidden');
        announcementsGrid.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    announcementsGrid.classList.remove('hidden');
    
    container.innerHTML = announcements.map(announcement => createAnnouncementCard(announcement)).join('');
}

function createAnnouncementCard(announcement) {
    const images = announcement.images || [];
    const hasImage = images.length > 0;
    const isArchived = announcement.is_archived;
    const isPinned = announcement.is_pinned;
    
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${isArchived ? 'opacity-75' : ''}">
            ${hasImage ? `
                <div class="h-48 bg-gray-200 overflow-hidden">
                    <img src="${images[0]}" alt="Announcement image" class="w-full h-full object-cover">
                </div>
            ` : ''}
            
            <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-medium text-gray-900 line-clamp-2">${escapeHtml(announcement.title)}</h3>
                    <div class="flex space-x-1 ml-2">
                        ${isPinned ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-thumbtack mr-1"></i>Pinned</span>' : ''}
                        ${isArchived ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Archived</span>' : ''}
                    </div>
                </div>
                
                <p class="text-gray-600 text-sm mb-3 line-clamp-3">${escapeHtml(announcement.content.substring(0, 150))}...</p>
                
                <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>By ${escapeHtml(announcement.created_by_name || 'Unknown')}</span>
                    <span>${formatDate(announcement.created_at)}</span>
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div class="flex space-x-4">
                        <span><i class="fas fa-eye mr-1"></i>${announcement.views_count || 0}</span>
                        <span><i class="fas fa-heart mr-1"></i>${announcement.likes_count || 0}</span>
                        <span><i class="fas fa-comment mr-1"></i>${announcement.comments_count || 0}</span>
                    </div>
                    <div class="text-xs">
                        ${announcement.target_group_names.map(g => g.name).join(', ')}
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="viewAnnouncement(${announcement.id})" 
                            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-eye mr-1"></i>View
                    </button>
                    <button onclick="editAnnouncement(${announcement.id})" 
                            class="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <div class="relative">
                        <button onclick="toggleActionMenu(${announcement.id})" 
                                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div id="actionMenu_${announcement.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div class="py-1">
                                ${!isPinned ? `
                                    <button onclick="pinAnnouncement(${announcement.id}, true)" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-thumbtack mr-2"></i>Pin
                                    </button>
                                ` : `
                                    <button onclick="pinAnnouncement(${announcement.id}, false)" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-times mr-2"></i>Unpin
                                    </button>
                                `}
                                ${!isArchived ? `
                                    <button onclick="archiveAnnouncement(${announcement.id})" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-archive mr-2"></i>Archive
                                    </button>
                                ` : ''}
                                <button onclick="deleteAnnouncement(${announcement.id}, '${escapeHtml(announcement.title)}')" 
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

function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-primary', 'text-white');
        btn.classList.add('text-gray-700', 'hover:text-gray-900');
    });
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    activeTab.classList.add('active', 'bg-primary', 'text-white');
    activeTab.classList.remove('text-gray-700', 'hover:text-gray-900');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    if (tabName === 'content') {
        document.getElementById('contentForm').classList.remove('hidden');
        document.getElementById('backBtn').classList.add('hidden');
        document.getElementById('previewBtn').classList.remove('hidden');
    } else {
        document.getElementById('previewContent').classList.remove('hidden');
        document.getElementById('backBtn').classList.remove('hidden');
        document.getElementById('previewBtn').classList.add('hidden');
        generatePreview();
    }
}

function showPreview() {
    showTab('preview');
}

function generatePreview() {
    const title = document.getElementById('announcementTitle').value;
    const content = document.getElementById('announcementContent').value;
    const selectedGroups = Array.from(document.querySelectorAll('input[name="target_groups"]:checked'))
        .map(cb => availableGroups.find(g => g.id == cb.value)?.name).filter(Boolean);
    const isPinned = document.getElementById('isPinned').checked;
    
    const previewArea = document.getElementById('previewArea');
    
    if (!title && !content) {
        previewArea.innerHTML = '<p class="text-gray-500 text-center">Fill in the content form to see preview</p>';
        return;
    }
    
    previewArea.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-start justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">${escapeHtml(title) || 'Untitled Announcement'}</h2>
                ${isPinned ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-thumbtack mr-1"></i>Pinned</span>' : ''}
            </div>
            
            <div class="prose max-w-none mb-4">
                ${formatContent(content)}
            </div>
            
            ${uploadedImages.length > 0 ? `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    ${uploadedImages.map(img => `<img src="${img.url}" alt="${img.original_filename}" class="rounded-lg">`).join('')}
                </div>
            ` : ''}
            
            ${uploadedAttachments.length > 0 ? `
                <div class="border-t pt-4">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                    <div class="space-y-1">
                        ${uploadedAttachments.map(file => `
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-paperclip mr-2"></i>
                                ${escapeHtml(file.original_filename)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="border-t pt-4 mt-4">
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>To be sent to: ${selectedGroups.join(', ') || 'No groups selected'}</span>
                    <span>Just now</span>
                </div>
            </div>
        </div>
    `;
}

function formatContent(content) {
    // Simple markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/https?:\/\/[^\s]+/g, '<a href="$&" class="text-primary hover:underline" target="_blank">$&</a>');
}

function openAnnouncementModal(announcement = null) {
    const modal = document.getElementById('announcementModal');
    const form = document.getElementById('announcementForm');
    const title = document.getElementById('modalTitle');
    
    // Reset form and state
    form.reset();
    uploadedImages = [];
    uploadedAttachments = [];
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('attachmentPreview').innerHTML = '';
    hideError();
    showTab('content');
    
    if (announcement) {
        title.textContent = 'Edit Announcement';
        currentAnnouncement = announcement;
        
        // Populate form
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('isPinned').checked = announcement.is_pinned;
        
        // Set target groups
        const targetGroups = announcement.target_groups || [];
        targetGroups.forEach(groupId => {
            const checkbox = document.getElementById(`group_${groupId}`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Handle existing files
        if (announcement.images) {
            uploadedImages = announcement.images.map(url => ({ url, id: 'existing' }));
            uploadedImages.forEach(addImagePreview);
        }
        
        if (announcement.attachments) {
            uploadedAttachments = announcement.attachments.map(url => ({ url, id: 'existing', original_filename: url.split('/').pop() }));
            uploadedAttachments.forEach(addAttachmentPreview);
        }
    } else {
        title.textContent = 'Create New Announcement';
        currentAnnouncement = null;
        document.getElementById('announcementId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeAnnouncementModal() {
    document.getElementById('announcementModal').classList.add('hidden');
    currentAnnouncement = null;
}

async function handleSubmit(e) {
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
        const data = {
            title: formData.get('title'),
            content: formData.get('content'),
            target_groups: Array.from(document.querySelectorAll('input[name="target_groups"]:checked')).map(cb => parseInt(cb.value)),
            images: uploadedImages.map(img => img.url),
            attachments: uploadedAttachments.map(att => att.url),
            is_pinned: document.getElementById('isPinned').checked
        };
        
        if (currentAnnouncement) {
            data.id = currentAnnouncement.id;
        }
        
        // Validation
        if (!data.title.trim()) {
            showError('Title is required');
            return;
        }
        
        if (!data.content.trim()) {
            showError('Content is required');
            return;
        }
        
        if (data.target_groups.length === 0) {
            showError('Please select at least one group');
            return;
        }
        
        const isEdit = !!currentAnnouncement;
        const url = 'announcements.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiFetch(url, {
            method,
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            closeAnnouncementModal();
            loadAnnouncements();
            showSuccess(isEdit ? 'Announcement updated successfully!' : 'Announcement created successfully!');
        } else {
            showError(response.error || 'Failed to save announcement');
        }
    } catch (error) {
        console.error('Error saving announcement:', error);
        showError('Failed to save announcement');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        submitBtnText.classList.remove('hidden');
        submitBtnSpinner.classList.add('hidden');
    }
}

// Global functions for onclick handlers
window.viewAnnouncement = async function(announcementId) {
    try {
        const response = await apiFetch(`announcements.php?id=${announcementId}`);
        if (response.success) {
            // Open view modal (you can implement this)
            console.log('View announcement:', response.data);
        }
    } catch (error) {
        console.error('Error loading announcement:', error);
    }
};

window.editAnnouncement = async function(announcementId) {
    try {
        const response = await apiFetch(`announcements.php?id=${announcementId}`);
        if (response.success) {
            openAnnouncementModal(response.data);
        } else {
            showError('Failed to load announcement details');
        }
    } catch (error) {
        console.error('Error loading announcement:', error);
        showError('Failed to load announcement details');
    }
};

window.toggleActionMenu = function(announcementId) {
    const menu = document.getElementById(`actionMenu_${announcementId}`);
    // Close all other menus
    document.querySelectorAll('[id^="actionMenu_"]').forEach(m => {
        if (m.id !== `actionMenu_${announcementId}`) {
            m.classList.add('hidden');
        }
    });
    menu.classList.toggle('hidden');
};

window.pinAnnouncement = async function(announcementId, isPinned) {
    try {
        const response = await apiFetch('announcements.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: announcementId,
                action: 'pin',
                is_pinned: isPinned
            })
        });
        
        if (response.success) {
            loadAnnouncements();
            showSuccess(`Announcement ${isPinned ? 'pinned' : 'unpinned'} successfully!`);
        } else {
            showError(response.error || `Failed to ${isPinned ? 'pin' : 'unpin'} announcement`);
        }
    } catch (error) {
        console.error('Error pinning announcement:', error);
        showError(`Failed to ${isPinned ? 'pin' : 'unpin'} announcement`);
    }
};

window.archiveAnnouncement = async function(announcementId) {
    if (!confirm('Are you sure you want to archive this announcement?')) {
        return;
    }
    
    try {
        const response = await apiFetch('announcements.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: announcementId,
                action: 'archive'
            })
        });
        
        if (response.success) {
            loadAnnouncements();
            showSuccess('Announcement archived successfully!');
        } else {
            showError(response.error || 'Failed to archive announcement');
        }
    } catch (error) {
        console.error('Error archiving announcement:', error);
        showError('Failed to archive announcement');
    }
};

window.deleteAnnouncement = async function(announcementId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`announcements.php?id=${announcementId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            loadAnnouncements();
            showSuccess('Announcement deleted successfully!');
        } else {
            showError(response.error || 'Failed to delete announcement');
        }
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showError('Failed to delete announcement');
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
    // Implement pagination similar to groups.js
}

// Utility functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('announcementsGrid').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('announcementError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function hideError() {
    const errorDiv = document.getElementById('announcementError');
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
