import { apiFetch } from './api.js';

// State management
let currentPage = 1;
let currentPost = null;
let currentStep = 0;
let uploadedImages = [];
let uploadedAttachments = [];
let availableGroups = [];
let searchTimeout = null;
let isMyPosts = false;

const steps = ['content', 'targeting', 'preview'];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadGroups();
    loadHelpPosts();
});

function initializeEventListeners() {
    // Main buttons
    document.getElementById('askQuestionBtn').addEventListener('click', () => openQuestionModal());
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeQuestionModal);
    document.getElementById('closePostModal').addEventListener('click', closePostModal);
    document.getElementById('cancelBtn').addEventListener('click', closeQuestionModal);
    
    // Tab navigation
    document.getElementById('contentTab').addEventListener('click', () => goToStep(0));
    document.getElementById('targetingTab').addEventListener('click', () => goToStep(1));
    document.getElementById('previewTab').addEventListener('click', () => goToStep(2));
    
    // Step navigation
    document.getElementById('prevBtn').addEventListener('click', previousStep);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    
    // Form submission
    document.getElementById('questionForm').addEventListener('submit', handleSubmit);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounceSearch);
    document.getElementById('categoryFilter').addEventListener('change', loadHelpPosts);
    document.getElementById('sortFilter').addEventListener('change', loadHelpPosts);
    document.getElementById('myPostsBtn').addEventListener('click', toggleMyPosts);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        currentPage = 1;
        loadHelpPosts();
    });
    
    // Visibility radio buttons
    document.querySelectorAll('input[name="visibility"]').forEach(radio => {
        radio.addEventListener('change', handleVisibilityChange);
    });
    
    // File uploads
    setupFileUploads();
    
    // Close modals on outside click
    document.getElementById('questionModal').addEventListener('click', (e) => {
        if (e.target.id === 'questionModal') closeQuestionModal();
    });
    document.getElementById('postModal').addEventListener('click', (e) => {
        if (e.target.id === 'postModal') closePostModal();
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
        formData.append('upload_type', 'help_post');
        
        const response = await fetch('../admin/backend/upload.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('session_token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (type === 'image') {
                uploadedImages.push(result.data.url);
                addImagePreview(result.data);
            } else {
                uploadedAttachments.push(result.data.url);
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
        <img src="${file.url}" alt="${file.original_filename}" class="w-full h-24 object-cover rounded-lg">
        <button onclick="removeFile('${file.url}', 'image')" 
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fas fa-times text-xs"></i>
        </button>
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
        <button onclick="removeFile('${file.url}', 'attachment')" 
                class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(preview);
}

window.removeFile = function(fileUrl, type) {
    if (type === 'image') {
        uploadedImages = uploadedImages.filter(url => url !== fileUrl);
        document.getElementById('imagePreview').innerHTML = '';
        uploadedImages.forEach(url => {
            addImagePreview({ url, original_filename: url.split('/').pop() });
        });
    } else {
        uploadedAttachments = uploadedAttachments.filter(url => url !== fileUrl);
        document.getElementById('attachmentPreview').innerHTML = '';
        uploadedAttachments.forEach(url => {
            addAttachmentPreview({ url, original_filename: url.split('/').pop() });
        });
    }
};

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadHelpPosts();
    }, 500);
}

function toggleMyPosts() {
    isMyPosts = !isMyPosts;
    const btn = document.getElementById('myPostsBtn');
    if (isMyPosts) {
        btn.classList.remove('text-gray-700', 'bg-white');
        btn.classList.add('text-white', 'bg-primary');
        btn.innerHTML = '<i class="fas fa-user mr-2"></i>All Posts';
    } else {
        btn.classList.remove('text-white', 'bg-primary');
        btn.classList.add('text-gray-700', 'bg-white');
        btn.innerHTML = '<i class="fas fa-user mr-2"></i>My Posts';
    }
    currentPage = 1;
    loadHelpPosts();
}

async function loadGroups() {
    try {
        const response = await apiFetch('../backend/user_groups.php');
        if (response.success) {
            availableGroups = response.data;
            populateGroupSelection();
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function populateGroupSelection() {
    const container = document.getElementById('groupCheckboxes');
    container.innerHTML = '';
    
    if (availableGroups.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">You are not a member of any groups</p>';
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

async function loadHelpPosts() {
    try {
        showLoading();
        
        const search = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const sort = document.getElementById('sortFilter').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });
        
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        if (isMyPosts) params.append('my_posts', 'true');
        
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
    const hasImages = post.images && post.images.length > 0;
    const hasAttachments = post.attachments && post.attachments.length > 0;
    const isOwner = post.user_id === parseInt(localStorage.getItem('user_id'));
    
    return `
        <div class="border-b border-gray-200 p-6 hover:bg-gray-50 transition-colors">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-medium text-gray-900 cursor-pointer hover:text-primary" 
                            onclick="viewPost(${post.id})">
                            ${escapeHtml(post.title)}
                        </h3>
                        ${post.is_pinned ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-thumbtack mr-1"></i>Pinned</span>' : ''}
                        ${post.category ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${capitalizeFirst(post.category)}</span>` : ''}
                        ${!post.user_viewed ? '<span class="bg-blue-500 text-white text-xs rounded-full px-2 py-1">New</span>' : ''}
                    </div>
                    
                    <p class="text-gray-600 text-sm mb-3 line-clamp-3">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
                    
                    <div class="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <span class="flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            ${escapeHtml(post.author_name || 'Unknown User')}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatTimeAgo(post.created_at)}
                        </span>
                        <button onclick="toggleLike(${post.id})" 
                                class="flex items-center ${post.user_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors">
                            <i class="fas fa-heart mr-1"></i>
                            <span id="likes_${post.id}">${post.likes_count || 0}</span>
                        </button>
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
                </div>
                
                <div class="flex space-x-2 ml-4">
                    <button onclick="viewPost(${post.id})" 
                            class="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-eye mr-1"></i>View
                    </button>
                    ${isOwner ? `
                        <div class="relative">
                            <button onclick="togglePostActions(${post.id})" 
                                    class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div id="postActions_${post.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                <div class="py-1">
                                    <button onclick="editPost(${post.id})" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-edit mr-2"></i>Edit
                                    </button>
                                    <button onclick="deletePost(${post.id}, '${escapeHtml(post.title)}')" 
                                            class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                        <i class="fas fa-trash mr-2"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function goToStep(step) {
    if (step < 0 || step >= steps.length) return;
    
    currentStep = step;
    
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        btn.classList.remove('active', 'bg-primary', 'text-white');
        btn.classList.add('text-gray-700', 'hover:text-gray-900');
        
        if (index === step) {
            btn.classList.add('active', 'bg-primary', 'text-white');
            btn.classList.remove('text-gray-700', 'hover:text-gray-900');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const contentId = `${steps[step]}${steps[step] === 'targeting' ? 'Form' : steps[step] === 'content' ? 'Form' : 'Content'}`;
    document.getElementById(contentId).classList.remove('hidden');
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (step === 0) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    } else if (step === steps.length - 1) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        generatePreview();
    } else {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

function previousStep() {
    goToStep(currentStep - 1);
}

function nextStep() {
    if (currentStep === 0) {
        // Validate content step
        const title = document.getElementById('questionTitle').value.trim();
        const content = document.getElementById('questionContent').value.trim();
        
        if (!title || !content) {
            showError('Please fill in the title and content');
            return;
        }
    }
    
    goToStep(currentStep + 1);
}

function handleVisibilityChange() {
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    const groupSelection = document.getElementById('groupSelection');
    const customTargeting = document.getElementById('customTargeting');
    
    groupSelection.classList.add('hidden');
    customTargeting.classList.add('hidden');
    
    if (visibility === 'groups') {
        groupSelection.classList.remove('hidden');
    } else if (visibility === 'custom') {
        customTargeting.classList.remove('hidden');
    }
}

function generatePreview() {
    const title = document.getElementById('questionTitle').value;
    const content = document.getElementById('questionContent').value;
    const category = document.getElementById('questionCategory').value;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    
    const previewArea = document.getElementById('previewArea');
    
    if (!title && !content) {
        previewArea.innerHTML = '<p class="text-gray-500 text-center">Fill in the question form to see preview</p>';
        return;
    }
    
    let visibilityText = '';
    if (visibility === 'public') {
        visibilityText = 'Visible to: All community members';
    } else if (visibility === 'groups') {
        const selectedGroups = Array.from(document.querySelectorAll('input[name="target_groups"]:checked'))
            .map(cb => availableGroups.find(g => g.id == cb.value)?.name).filter(Boolean);
        visibilityText = `Visible to groups: ${selectedGroups.join(', ') || 'None selected'}`;
    } else if (visibility === 'custom') {
        const areas = document.getElementById('targetAreas').value.trim();
        const institutions = document.getElementById('targetInstitutions').value.trim();
        const companies = document.getElementById('targetCompanies').value.trim();
        const targets = [areas, institutions, companies].filter(Boolean);
        visibilityText = `Custom targeting: ${targets.join(', ') || 'None specified'}`;
    }
    
    previewArea.innerHTML = `
        <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-start justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">${escapeHtml(title) || 'Untitled Question'}</h2>
                ${category ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${capitalizeFirst(category)}</span>` : ''}
            </div>
            
            <div class="prose max-w-none mb-4">
                ${formatContent(content)}
            </div>
            
            ${uploadedImages.length > 0 ? `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    ${uploadedImages.map(img => `<img src="${img}" alt="Question image" class="rounded-lg">`).join('')}
                </div>
            ` : ''}
            
            ${uploadedAttachments.length > 0 ? `
                <div class="border-t pt-4 mb-4">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                    <div class="space-y-1">
                        ${uploadedAttachments.map(file => `
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-paperclip mr-2"></i>
                                ${escapeHtml(file.split('/').pop())}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="border-t pt-4 mt-4">
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>${visibilityText}</span>
                    <span>Just now</span>
                </div>
            </div>
        </div>
    `;
}

function openQuestionModal(post = null) {
    const modal = document.getElementById('questionModal');
    const form = document.getElementById('questionForm');
    const title = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    
    // Reset form and state
    form.reset();
    uploadedImages = [];
    uploadedAttachments = [];
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('attachmentPreview').innerHTML = '';
    hideError();
    goToStep(0);
    
    if (post) {
        title.textContent = 'Edit Question';
        submitBtnText.textContent = 'Update Question';
        currentPost = post;
        
        // Populate form
        document.getElementById('postId').value = post.id;
        document.getElementById('questionTitle').value = post.title;
        document.getElementById('questionContent').value = post.content;
        document.getElementById('questionCategory').value = post.category || '';
        
        // Set visibility
        document.querySelector(`input[name="visibility"][value="${post.visibility}"]`).checked = true;
        handleVisibilityChange();
        
        // Handle existing files
        if (post.images) {
            uploadedImages = post.images;
        }
        
        if (post.attachments) {
            uploadedAttachments = post.attachments;
        }
    } else {
        title.textContent = 'Ask a Question';
        submitBtnText.textContent = 'Post Question';
        currentPost = null;
        document.getElementById('postId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeQuestionModal() {
    document.getElementById('questionModal').classList.add('hidden');
    currentPost = null;
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
            action: 'create',
            title: formData.get('title'),
            content: formData.get('content'),
            category: formData.get('category'),
            visibility: document.querySelector('input[name="visibility"]:checked').value,
            images: uploadedImages,
            attachments: uploadedAttachments
        };
        
        if (currentPost) {
            data.id = currentPost.id;
        }
        
        // Handle targeting based on visibility
        if (data.visibility === 'groups') {
            data.target_groups = Array.from(document.querySelectorAll('input[name="target_groups"]:checked')).map(cb => parseInt(cb.value));
            if (data.target_groups.length === 0) {
                showError('Please select at least one group');
                return;
            }
        } else if (data.visibility === 'custom') {
            data.target_areas = document.getElementById('targetAreas').value.split(',').map(s => s.trim()).filter(Boolean);
            data.target_institutions = document.getElementById('targetInstitutions').value.split(',').map(s => s.trim()).filter(Boolean);
            data.target_companies = document.getElementById('targetCompanies').value.split(',').map(s => s.trim()).filter(Boolean);
            
            if (data.target_areas.length === 0 && data.target_institutions.length === 0 && data.target_companies.length === 0) {
                showError('Please specify at least one targeting criteria');
                return;
            }
        } else {
            data.target_groups = [];
            data.target_areas = [];
            data.target_institutions = [];
            data.target_companies = [];
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
        
        const isEdit = !!currentPost;
        const url = 'help_posts.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiFetch(url, {
            method,
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            closeQuestionModal();
            loadHelpPosts();
            showSuccess(isEdit ? 'Question updated successfully!' : 'Question posted successfully! It will be visible after admin approval.');
        } else {
            showError(response.error || 'Failed to save question');
        }
    } catch (error) {
        console.error('Error saving question:', error);
        showError('Failed to save question');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        submitBtnText.classList.remove('hidden');
        submitBtnSpinner.classList.add('hidden');
    }
}

// Global functions for onclick handlers
window.viewPost = async function(postId) {
    try {
        const response = await apiFetch(`help_posts.php?id=${postId}`);
        if (response.success) {
            showPostModal(response.data);
        } else {
            showError('Failed to load post details');
        }
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Failed to load post details');
    }
};

function showPostModal(post) {
    const modal = document.getElementById('postModal');
    const title = document.getElementById('postModalTitle');
    const content = document.getElementById('postDetailContent');
    
    title.textContent = post.title;
    
    content.innerHTML = `
        <div class="bg-white rounded-lg">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(post.title)}</h2>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span class="flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            ${escapeHtml(post.author_name)}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatDate(post.created_at)}
                        </span>
                        ${post.category ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${capitalizeFirst(post.category)}</span>` : ''}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="toggleLike(${post.id})" 
                            class="flex items-center ${post.user_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors">
                        <i class="fas fa-heart mr-1"></i>
                        <span id="modal_likes_${post.id}">${post.likes_count || 0}</span>
                    </button>
                </div>
            </div>
            
            <div class="prose max-w-none mb-4">
                ${formatContent(post.content)}
            </div>
            
            ${post.images && post.images.length > 0 ? `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    ${post.images.map(img => `<img src="${img}" alt="Post image" class="rounded-lg cursor-pointer" onclick="openImageModal('${img}')">`).join('')}
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
            
            <!-- Comments Section -->
            <div class="border-t pt-4">
                <h4 class="text-lg font-medium text-gray-900 mb-4">Comments (${post.comments_count || 0})</h4>
                
                <!-- Add Comment Form -->
                <div class="mb-6">
                    <textarea id="commentContent_${post.id}" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                              placeholder="Add a helpful comment..."></textarea>
                    <div class="flex justify-end mt-2">
                        <button onclick="postComment(${post.id})" 
                                class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium">
                            Post Comment
                        </button>
                    </div>
                </div>
                
                <!-- Comments List -->
                <div id="commentsList_${post.id}" class="space-y-4">
                    ${renderComments(post.comments || [])}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function renderComments(comments) {
    if (comments.length === 0) {
        return '<p class="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>';
    }
    
    return comments.map(comment => `
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center space-x-2">
                    <span class="font-medium text-sm">${escapeHtml(comment.commenter_name || 'Unknown')}</span>
                    <span class="text-xs text-gray-500">${formatTimeAgo(comment.created_at)}</span>
                </div>
            </div>
            <p class="text-gray-700 text-sm mb-2">${escapeHtml(comment.content)}</p>
            
            ${comment.replies && comment.replies.length > 0 ? `
                <div class="ml-4 mt-3 space-y-2">
                    ${comment.replies.map(reply => `
                        <div class="bg-white rounded-lg p-3">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="font-medium text-xs">${escapeHtml(reply.commenter_name || 'Unknown')}</span>
                                <span class="text-xs text-gray-500">${formatTimeAgo(reply.created_at)}</span>
                            </div>
                            <p class="text-gray-700 text-xs">${escapeHtml(reply.content)}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <button onclick="showReplyForm(${comment.id})" 
                    class="text-primary hover:text-primary/80 text-xs mt-2">
                Reply
            </button>
            <div id="replyForm_${comment.id}" class="hidden mt-3">
                <textarea id="replyContent_${comment.id}" rows="2" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                          placeholder="Write a reply..."></textarea>
                <div class="flex justify-end mt-2 space-x-2">
                    <button onclick="hideReplyForm(${comment.id})" 
                            class="text-gray-600 hover:text-gray-800 text-xs">Cancel</button>
                    <button onclick="postReply(${comment.post_id}, ${comment.id})" 
                            class="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded text-xs">
                        Reply
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function closePostModal() {
    document.getElementById('postModal').classList.add('hidden');
}

window.toggleLike = async function(postId) {
    try {
        const response = await apiFetch('help_posts.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'like',
                post_id: postId,
                like_action: 'toggle'
            })
        });
        
        if (response.success) {
            // Update both list and modal like counts
            const listLikes = document.getElementById(`likes_${postId}`);
            const modalLikes = document.getElementById(`modal_likes_${postId}`);
            
            if (listLikes) listLikes.textContent = response.data.likes_count;
            if (modalLikes) modalLikes.textContent = response.data.likes_count;
            
            // Update button appearance
            const listBtn = listLikes?.parentElement;
            const modalBtn = modalLikes?.parentElement;
            
            [listBtn, modalBtn].forEach(btn => {
                if (btn) {
                    if (response.data.liked) {
                        btn.classList.remove('text-gray-500');
                        btn.classList.add('text-red-500');
                    } else {
                        btn.classList.remove('text-red-500');
                        btn.classList.add('text-gray-500');
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
};

window.postComment = async function(postId) {
    const content = document.getElementById(`commentContent_${postId}`).value.trim();
    if (!content) return;
    
    try {
        const response = await apiFetch('help_posts.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'comment',
                post_id: postId,
                content: content
            })
        });
        
        if (response.success) {
            document.getElementById(`commentContent_${postId}`).value = '';
            // Reload post to show new comment
            viewPost(postId);
        } else {
            showError(response.error || 'Failed to post comment');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        showError('Failed to post comment');
    }
};

window.showReplyForm = function(commentId) {
    document.getElementById(`replyForm_${commentId}`).classList.remove('hidden');
};

window.hideReplyForm = function(commentId) {
    document.getElementById(`replyForm_${commentId}`).classList.add('hidden');
};

window.postReply = async function(postId, parentId) {
    const content = document.getElementById(`replyContent_${parentId}`).value.trim();
    if (!content) return;
    
    try {
        const response = await apiFetch('help_posts.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'comment',
                post_id: postId,
                parent_id: parentId,
                content: content
            })
        });
        
        if (response.success) {
            // Reload post to show new reply
            viewPost(postId);
        } else {
            showError(response.error || 'Failed to post reply');
        }
    } catch (error) {
        console.error('Error posting reply:', error);
        showError('Failed to post reply');
    }
};

window.togglePostActions = function(postId) {
    const menu = document.getElementById(`postActions_${postId}`);
    // Close all other menus
    document.querySelectorAll('[id^="postActions_"]').forEach(m => {
        if (m.id !== `postActions_${postId}`) {
            m.classList.add('hidden');
        }
    });
    menu.classList.toggle('hidden');
};

window.editPost = async function(postId) {
    try {
        const response = await apiFetch(`help_posts.php?id=${postId}`);
        if (response.success) {
            openQuestionModal(response.data);
        } else {
            showError('Failed to load post details');
        }
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Failed to load post details');
    }
};

window.deletePost = async function(postId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`help_posts.php?id=${postId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            loadHelpPosts();
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
    if (!e.target.closest('[onclick^="togglePostActions"]')) {
        document.querySelectorAll('[id^="postActions_"]').forEach(menu => {
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
    const errorDiv = document.getElementById('questionError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function hideError() {
    const errorDiv = document.getElementById('questionError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showSuccess(message) {
    console.log('Success:', message);
    alert(message);
}

function escapeHtml(text) {
    if (!text) return '';
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

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
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
