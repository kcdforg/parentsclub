import { apiFetch } from './api.js';

// State management
let currentPage = 1;
let currentEvent = null;
let uploadedImages = [];
let uploadedAttachments = [];
let availableGroups = [];
let searchTimeout = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadGroups();
    loadEvents();
    setMinDate();
});

function initializeEventListeners() {
    // Create event button
    document.getElementById('createEventBtn').addEventListener('click', () => openEventModal());
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeEventModal);
    document.getElementById('cancelBtn').addEventListener('click', closeEventModal);
    document.getElementById('closeRsvpModal').addEventListener('click', closeRsvpModal);
    
    // Tab navigation
    document.getElementById('contentTab').addEventListener('click', () => showTab('content'));
    document.getElementById('previewTab').addEventListener('click', () => showTab('preview'));
    
    // Form submission
    document.getElementById('eventForm').addEventListener('submit', handleSubmit);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounceSearch);
    document.getElementById('groupFilter').addEventListener('change', loadEvents);
    document.getElementById('dateFilter').addEventListener('change', loadEvents);
    document.getElementById('statusFilter').addEventListener('change', loadEvents);
    document.getElementById('refreshBtn').addEventListener('click', loadEvents);
    
    // Preview and navigation
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('backBtn').addEventListener('click', () => showTab('content'));
    
    // File uploads
    setupFileUploads();
    
    // Close modals on outside click
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') closeEventModal();
    });
    document.getElementById('rsvpModal').addEventListener('click', (e) => {
        if (e.target.id === 'rsvpModal') closeRsvpModal();
    });
}

function setMinDate() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').min = today;
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
        formData.append('upload_type', 'event');
        
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
        loadEvents();
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

async function loadEvents() {
    try {
        showLoading();
        
        const search = document.getElementById('searchInput').value;
        const groupId = document.getElementById('groupFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12
        });
        
        if (search) params.append('search', search);
        if (groupId) params.append('group_id', groupId);
        if (dateFilter) params.append('date_filter', dateFilter);
        if (status) params.append('status', status);
        
        const response = await apiFetch(`events.php?${params.toString()}`);
        
        if (response.success) {
            displayEvents(response.data);
            updatePagination(response.pagination);
        } else {
            showError('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Failed to load events');
    }
}

function displayEvents(events) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const eventsGrid = document.getElementById('eventsGrid');
    const container = document.getElementById('eventsContainer');
    
    loadingState.classList.add('hidden');
    
    if (events.length === 0) {
        emptyState.classList.remove('hidden');
        eventsGrid.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    eventsGrid.classList.remove('hidden');
    
    container.innerHTML = events.map(event => createEventCard(event)).join('');
}

function createEventCard(event) {
    const images = event.images || [];
    const hasImage = images.length > 0;
    const eventDate = new Date(event.event_date);
    const eventTime = event.event_time;
    const now = new Date();
    const isPast = eventDate < now;
    const isCancelled = event.is_cancelled;
    
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${isCancelled ? 'opacity-75' : ''}">
            ${hasImage ? `
                <div class="h-48 bg-gray-200 overflow-hidden">
                    <img src="${images[0]}" alt="Event image" class="w-full h-full object-cover">
                </div>
            ` : ''}
            
            <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-medium text-gray-900 line-clamp-2">${escapeHtml(event.title)}</h3>
                    <div class="flex space-x-1 ml-2">
                        ${isCancelled ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>' : ''}
                        ${isPast ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Past</span>' : ''}
                    </div>
                </div>
                
                <div class="flex items-center text-sm text-gray-600 mb-2">
                    <i class="fas fa-calendar mr-2"></i>
                    ${formatEventDate(event.event_date, event.event_time)}
                </div>
                
                ${event.location ? `
                    <div class="flex items-center text-sm text-gray-600 mb-2">
                        <i class="fas fa-map-marker-alt mr-2"></i>
                        ${escapeHtml(event.location)}
                    </div>
                ` : ''}
                
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(event.description.substring(0, 120))}...</p>
                
                <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>By ${escapeHtml(event.created_by_name || 'Unknown')}</span>
                    <span>${formatDate(event.created_at)}</span>
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div class="flex space-x-4">
                        <span class="text-green-600"><i class="fas fa-check mr-1"></i>${event.attending_count || 0}</span>
                        <span class="text-red-600"><i class="fas fa-times mr-1"></i>${event.not_attending_count || 0}</span>
                        <span class="text-yellow-600"><i class="fas fa-question mr-1"></i>${event.maybe_count || 0}</span>
                        <span><i class="fas fa-eye mr-1"></i>${event.views_count || 0}</span>
                    </div>
                    <div class="text-xs">
                        ${event.target_group_names.map(g => g.name).join(', ')}
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="viewRSVPs(${event.id}, '${escapeHtml(event.title)}')" 
                            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-users mr-1"></i>RSVPs
                    </button>
                    <button onclick="editEvent(${event.id})" 
                            class="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <div class="relative">
                        <button onclick="toggleActionMenu(${event.id})" 
                                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div id="actionMenu_${event.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div class="py-1">
                                ${!isCancelled ? `
                                    <button onclick="cancelEvent(${event.id}, true)" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-ban mr-2"></i>Cancel Event
                                    </button>
                                ` : `
                                    <button onclick="cancelEvent(${event.id}, false)" 
                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-undo mr-2"></i>Restore Event
                                    </button>
                                `}
                                <button onclick="deleteEvent(${event.id}, '${escapeHtml(event.title)}')" 
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
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const location = document.getElementById('eventLocation').value;
    const maxAttendees = document.getElementById('maxAttendees').value;
    const selectedGroups = Array.from(document.querySelectorAll('input[name="target_groups"]:checked'))
        .map(cb => availableGroups.find(g => g.id == cb.value)?.name).filter(Boolean);
    
    const previewArea = document.getElementById('previewArea');
    
    if (!title && !description) {
        previewArea.innerHTML = '<p class="text-gray-500 text-center">Fill in the event form to see preview</p>';
        return;
    }
    
    previewArea.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-start justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">${escapeHtml(title) || 'Untitled Event'}</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="flex items-center text-gray-600">
                    <i class="fas fa-calendar mr-2 text-primary"></i>
                    ${eventDate && eventTime ? formatEventDate(eventDate, eventTime) : 'Date and time not set'}
                </div>
                ${location ? `
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-map-marker-alt mr-2 text-primary"></i>
                        ${escapeHtml(location)}
                    </div>
                ` : ''}
                ${maxAttendees ? `
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-users mr-2 text-primary"></i>
                        Max ${maxAttendees} attendees
                    </div>
                ` : ''}
            </div>
            
            <div class="prose max-w-none mb-4">
                ${formatContent(description)}
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

function openEventModal(event = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const title = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    
    // Reset form and state
    form.reset();
    uploadedImages = [];
    uploadedAttachments = [];
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('attachmentPreview').innerHTML = '';
    hideError();
    showTab('content');
    setMinDate();
    
    if (event) {
        title.textContent = 'Edit Event';
        submitBtnText.textContent = 'Update Event';
        currentEvent = event;
        
        // Populate form
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventDate').value = event.event_date;
        document.getElementById('eventTime').value = event.event_time;
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('maxAttendees').value = event.max_attendees || '';
        document.getElementById('isPublic').checked = event.is_public;
        
        // Set target groups
        const targetGroups = event.target_groups || [];
        targetGroups.forEach(groupId => {
            const checkbox = document.getElementById(`group_${groupId}`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Handle existing files
        if (event.images) {
            uploadedImages = event.images.map(url => ({ url, id: 'existing' }));
            uploadedImages.forEach(addImagePreview);
        }
        
        if (event.attachments) {
            uploadedAttachments = event.attachments.map(url => ({ url, id: 'existing', original_filename: url.split('/').pop() }));
            uploadedAttachments.forEach(addAttachmentPreview);
        }
    } else {
        title.textContent = 'Create New Event';
        submitBtnText.textContent = 'Create Event';
        currentEvent = null;
        document.getElementById('eventId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    currentEvent = null;
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
            description: formData.get('description'),
            event_date: formData.get('event_date'),
            event_time: formData.get('event_time'),
            location: formData.get('location'),
            max_attendees: formData.get('max_attendees') ? parseInt(formData.get('max_attendees')) : null,
            is_public: document.getElementById('isPublic').checked,
            target_groups: Array.from(document.querySelectorAll('input[name="target_groups"]:checked')).map(cb => parseInt(cb.value)),
            images: uploadedImages.map(img => img.url),
            attachments: uploadedAttachments.map(att => att.url)
        };
        
        if (currentEvent) {
            data.id = currentEvent.id;
        }
        
        // Validation
        if (!data.title.trim()) {
            showError('Title is required');
            return;
        }
        
        if (!data.description.trim()) {
            showError('Description is required');
            return;
        }
        
        if (!data.event_date) {
            showError('Event date is required');
            return;
        }
        
        if (!data.event_time) {
            showError('Event time is required');
            return;
        }
        
        if (data.target_groups.length === 0) {
            showError('Please select at least one group');
            return;
        }
        
        const isEdit = !!currentEvent;
        const url = 'events.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiFetch(url, {
            method,
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            closeEventModal();
            loadEvents();
            showSuccess(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
        } else {
            showError(response.error || 'Failed to save event');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showError('Failed to save event');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        submitBtnText.classList.remove('hidden');
        submitBtnSpinner.classList.add('hidden');
    }
}

// Global functions for onclick handlers
window.viewRSVPs = async function(eventId, eventTitle) {
    try {
        const response = await apiFetch(`events.php?id=${eventId}`);
        if (response.success) {
            showRSVPModal(response.data);
        } else {
            showError('Failed to load RSVP details');
        }
    } catch (error) {
        console.error('Error loading RSVPs:', error);
        showError('Failed to load RSVP details');
    }
};

function showRSVPModal(event) {
    const modal = document.getElementById('rsvpModal');
    const title = document.getElementById('rsvpModalTitle');
    const content = document.getElementById('rsvpContent');
    
    title.textContent = `${event.title} - RSVPs`;
    
    const rsvps = event.rsvps || [];
    const attending = rsvps.filter(r => r.status === 'attending');
    const notAttending = rsvps.filter(r => r.status === 'not_attending');
    const maybe = rsvps.filter(r => r.status === 'maybe');
    
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-green-50 rounded-lg p-4">
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-green-500 text-xl mr-3"></i>
                    <div>
                        <div class="text-2xl font-bold text-green-900">${attending.length}</div>
                        <div class="text-sm text-green-600">Attending</div>
                    </div>
                </div>
            </div>
            <div class="bg-red-50 rounded-lg p-4">
                <div class="flex items-center">
                    <i class="fas fa-times-circle text-red-500 text-xl mr-3"></i>
                    <div>
                        <div class="text-2xl font-bold text-red-900">${notAttending.length}</div>
                        <div class="text-sm text-red-600">Not Attending</div>
                    </div>
                </div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4">
                <div class="flex items-center">
                    <i class="fas fa-question-circle text-yellow-500 text-xl mr-3"></i>
                    <div>
                        <div class="text-2xl font-bold text-yellow-900">${maybe.length}</div>
                        <div class="text-sm text-yellow-600">Maybe</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="space-y-6">
            ${renderRSVPSection('Attending', attending, 'text-green-600')}
            ${renderRSVPSection('Maybe', maybe, 'text-yellow-600')}
            ${renderRSVPSection('Not Attending', notAttending, 'text-red-600')}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function renderRSVPSection(title, rsvps, colorClass) {
    if (rsvps.length === 0) return '';
    
    return `
        <div>
            <h4 class="text-lg font-medium ${colorClass} mb-3">${title} (${rsvps.length})</h4>
            <div class="space-y-2">
                ${rsvps.map(rsvp => `
                    <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                            <div class="font-medium">${escapeHtml(rsvp.attendee_name || 'Unknown')}</div>
                            <div class="text-sm text-gray-500">${escapeHtml(rsvp.email)}</div>
                            ${rsvp.notes ? `<div class="text-sm text-gray-600 mt-1">${escapeHtml(rsvp.notes)}</div>` : ''}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${formatDate(rsvp.created_at)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function closeRsvpModal() {
    document.getElementById('rsvpModal').classList.add('hidden');
}

window.editEvent = async function(eventId) {
    try {
        const response = await apiFetch(`events.php?id=${eventId}`);
        if (response.success) {
            openEventModal(response.data);
        } else {
            showError('Failed to load event details');
        }
    } catch (error) {
        console.error('Error loading event:', error);
        showError('Failed to load event details');
    }
};

window.toggleActionMenu = function(eventId) {
    const menu = document.getElementById(`actionMenu_${eventId}`);
    // Close all other menus
    document.querySelectorAll('[id^="actionMenu_"]').forEach(m => {
        if (m.id !== `actionMenu_${eventId}`) {
            m.classList.add('hidden');
        }
    });
    menu.classList.toggle('hidden');
};

window.cancelEvent = async function(eventId, isCancelled) {
    const action = isCancelled ? 'cancel' : 'restore';
    const confirmMessage = isCancelled ? 
        'Are you sure you want to cancel this event?' : 
        'Are you sure you want to restore this event?';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const response = await apiFetch('events.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: eventId,
                action: 'cancel',
                is_cancelled: isCancelled
            })
        });
        
        if (response.success) {
            loadEvents();
            showSuccess(`Event ${isCancelled ? 'cancelled' : 'restored'} successfully!`);
        } else {
            showError(response.error || `Failed to ${action} event`);
        }
    } catch (error) {
        console.error(`Error ${action}ing event:`, error);
        showError(`Failed to ${action} event`);
    }
};

window.deleteEvent = async function(eventId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiFetch(`events.php?id=${eventId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            loadEvents();
            showSuccess('Event deleted successfully!');
        } else {
            showError(response.error || 'Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showError('Failed to delete event');
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
    // Implement pagination similar to announcements.js
}

// Utility functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('eventsGrid').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('eventError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function hideError() {
    const errorDiv = document.getElementById('eventError');
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
        day: 'numeric'
    });
}

function formatEventDate(dateString, timeString) {
    const date = new Date(dateString);
    const time = timeString.split(':');
    const hour = parseInt(time[0]);
    const minute = time[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })} at ${displayHour}:${minute} ${ampm}`;
}
