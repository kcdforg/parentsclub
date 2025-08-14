import { apiFetch } from './api.js';

// Invitations management functionality
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
    let currentInvitations = [];
    let currentFilters = {
        status: '',
        search: ''
    };
    let lastCreatedInvitationId = null; // New variable to store the ID of the last created invitation

    // DOM elements
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const invitationsTableBody = document.getElementById('invitationsTableBody');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageSpan = document.getElementById('currentPage');
    const showingStartSpan = document.getElementById('showingStart');
    const showingEndSpan = document.getElementById('showingEnd');
    const totalInvitationsSpan = document.getElementById('totalInvitations');
    
    // Modal elements
    const createInvitationBtn = document.getElementById('createInvitationBtn');
    const copyAllLinksBtn = document.getElementById('copyAllLinksBtn');
    const compactViewBtn = document.getElementById('compactViewBtn');
    const invitationModal = document.getElementById('invitationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const invitationForm = document.getElementById('invitationForm');
    const createInviteBtn = document.getElementById('createInviteBtn');
    const createInviteBtnText = document.getElementById('createInviteBtnText');
    const createInviteBtnSpinner = document.getElementById('createInviteBtnSpinner');
    const invitationError = document.getElementById('invitationError');
    const cancelInviteBtn = document.getElementById('cancelInviteBtn');

    // Event listeners
    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        currentPage = 1;
        loadInvitations();
    });

    searchBtn.addEventListener('click', function() {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadInvitations();
    });

    resetFiltersBtn.addEventListener('click', function() {
        statusFilter.value = '';
        searchInput.value = '';
        currentFilters = { status: '', search: '' };
        currentPage = 1;
        loadInvitations();
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadInvitations();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadInvitations();
        }
    });

    // Modal event listeners
    createInvitationBtn.addEventListener('click', function() {
        invitationModal.classList.remove('hidden');
        invitationForm.reset();
        invitationError.classList.add('hidden');
        // Ensure the createInviteBtn is ready for form submission
        createInviteBtn.type = 'submit';
        createInviteBtnText.textContent = 'Create Invitation';
        createInviteBtnSpinner.classList.add('hidden'); // Ensure spinner is hidden
        createInviteBtn.disabled = false; // Ensure button is enabled
        cancelInviteBtn.classList.remove('hidden'); // Ensure cancel button is visible
        // Remove the 'close' event listener if it was previously added
        createInviteBtn.removeEventListener('click', closeInvitationModalAndHighlight);
    });

    copyAllLinksBtn.addEventListener('click', function() {
        copyAllInvitationLinks();
    });

    // Centralized modal close logic for highlight timing
    function closeInvitationModalAndHighlight() {
        invitationModal.classList.add('hidden');
        invitationForm.reset();
        // Reset message area to hidden and error state for next time
        invitationError.classList.add('hidden', 'bg-red-50', 'border-red-200', 'text-red-700');
        invitationError.classList.remove('bg-green-50', 'border-green-200', 'text-green-700');
        // Reset button state
        createInviteBtn.type = 'submit';
        createInviteBtnText.textContent = 'Create Invitation';
        cancelInviteBtn.classList.remove('hidden');

        if (lastCreatedInvitationId) {
            // Ensure invitations are reloaded to show the new row, then highlight
            currentPage = 1; // Set current page to 1 to ensure the new invitation is loaded
            loadInvitations().then(() => {
                lastCreatedInvitationId = null; // Clear the ID after highlighting
            });
        } else {
            // If no new invitation was created, just reload without highlighting
            loadInvitations();
        }
    }

    closeModalBtn.addEventListener('click', closeInvitationModalAndHighlight);
    cancelInviteBtn.addEventListener('click', closeInvitationModalAndHighlight);

    // Close modal when clicking outside
    invitationModal.addEventListener('click', function(e) {
        if (e.target === invitationModal) {
            closeInvitationModalAndHighlight();
        }
    });

    // Close details modal when clicking outside
    document.getElementById('invitationDetailsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });

    // Close details modal button
    document.getElementById('closeDetailsModalBtn').addEventListener('click', function() {
        document.getElementById('invitationDetailsModal').classList.add('hidden');
    });

    // Form submission
    invitationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createInvitation();
    });

    // Load invitations on page load
    loadInvitations();

    // Load invitations function
    async function loadInvitations() {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                status: currentFilters.status,
                search: currentFilters.search
            });

            const data = await apiFetch(`invitations.php?${params}`, {
                method: 'GET'
            });
            
            if (data.success) {
                currentInvitations = data.invitations; // Store invitations in currentInvitations
                displayInvitations(data.invitations);
                updatePagination(data.pagination);
            } else {
                showError(data.error || 'Failed to load invitations');
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            showError('Failed to load invitations. Please try again.');
        }
    }

    // Display invitations in table
    function displayInvitations(invitations) {
        invitationsTableBody.innerHTML = '';
        
        if (invitations.length === 0) {
            invitationsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No invitations found
                    </td>
                </tr>
            `;
            return;
        }

        invitations.forEach(invitation => {
            const row = document.createElement('tr');
            row.id = `invitation-${invitation.id}`; // Add ID to the row
            row.className = 'hover:bg-gray-50';
            
            const statusClass = getStatusClass(invitation.status);
            const expiresDate = new Date(invitation.expires_at);
            const isExpired = expiresDate < new Date();
            
            // Generate the full invitation link
            const baseUrl = window.location.origin;
            const invitationLink = `${baseUrl}/regapp2/public/frontend/register.html?invitation=${invitation.invitation_code}`;

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                <span class="text-white font-medium">${invitation.invited_name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${invitation.invited_name}</div>
                            <div class="text-sm text-gray-500">${invitation.invited_phone || 'No phone'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap">
                    <div class="max-w-xs">
                        <div class="bg-gray-50 p-2 rounded border text-sm font-mono text-gray-900 break-all" title="${invitation.invitation_code}">
                            ${invitation.invitation_code.length > 20 ? invitation.invitation_code.substring(0, 20) + '...' : invitation.invitation_code}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">${invitation.invited_by_type}</div>
                    </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap invitation-link-cell">
                    <div class="max-w-xs">
                        <div class="bg-gray-50 p-2 rounded border text-sm text-gray-900 break-all font-mono text-xs" title="${invitationLink}">
                            <span class="url-short">${invitationLink.length > 50 ? invitationLink.substring(0, 50) + '...' : invitationLink}</span>
                            <span class="url-full hidden">${invitationLink}</span>
                        </div>
                        <div class="flex space-x-2 mt-2">
                            <button onclick="toggleFullUrl(this)" class="text-xs text-gray-600 hover:text-gray-800 hover:underline">
                                <i class="fas fa-expand-alt"></i> Show Full
                            </button>
                            <button onclick="copyToClipboard('${invitationLink}')" class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                            <button onclick="window.open('${invitationLink}', '_blank')" class="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                                <i class="fas fa-external-link-alt"></i> Preview
                            </button>
                        </div>
                    </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <span class="${statusClass}">${invitation.status}</span>
                        ${invitation.status === 'pending' ? `
                            <span class="ml-2 text-xs text-gray-500" title="Invitation is active and can be used">
                                <i class="fas fa-clock"></i>
                            </span>
                        ` : invitation.status === 'used' ? `
                            <span class="ml-2 text-xs text-gray-500" title="Invitation has been used">
                                <i class="fas fa-check-circle"></i>
                            </span>
                        ` : `
                            <span class="ml-2 text-xs text-gray-500" title="Invitation has expired">
                                <i class="fas fa-times-circle"></i>
                            </span>
                        `}
                    </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>${formatDate(invitation.expires_at)}</div>
                    ${isExpired ? '<div class="text-xs text-red-500">Expired</div>' : ''}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(invitation.created_at)}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewInvitationDetails(${invitation.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${invitation.status === 'pending' ? `
                        <button onclick="resendInvitation(${invitation.id})" class="text-green-600 hover:text-green-900 mr-3">
                            <i class="fas fa-paper-plane"></i> Resend
                        </button>
                    ` : ''}
                    <button onclick="deleteInvitation(${invitation.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            
            invitationsTableBody.appendChild(row);
        });
    }

    // Update pagination display
    function updatePagination(pagination) {
        currentPage = pagination.current_page;
        totalPages = pagination.total_pages;
        
        currentPageSpan.textContent = `Page ${currentPage}`;
        showingStartSpan.textContent = pagination.start;
        showingEndSpan.textContent = pagination.end;
        totalInvitationsSpan.textContent = pagination.total;
        
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // Get status class for styling
    function getStatusClass(status) {
        switch (status) {
            case 'used':
                return 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full';
            case 'expired':
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

    // Create invitation
    async function createInvitation() {
        const formData = new FormData(invitationForm);
        const countryCode = document.getElementById('countryCode').value;
        const phoneNumber = formData.get('phone').trim();
        
        // Validate phone number (10 digits)
        if (!/^\d{10}$/.test(phoneNumber)) {
            showFormError('Please enter a valid 10-digit phone number');
            return;
        }
        
        const invitationData = {
            name: formData.get('name'),
            phone: countryCode + phoneNumber,
            expiry_days: 3 // 72 hours = 3 days
        };

        try {
            showLoading(true);
            invitationError.classList.add('hidden');

            const data = await apiFetch('invitations.php', {
                method: 'POST',
                body: JSON.stringify(invitationData)
            });

            if (data.success) {
                // Display success message in the modal
                invitationError.textContent = 'Invitation created successfully!';
                invitationError.classList.remove('hidden', 'bg-red-50', 'border-red-200', 'text-red-700');
                invitationError.classList.add('bg-green-50', 'border-green-200', 'text-green-700');

                // Change create button to Close
                createInviteBtn.type = 'button';
                createInviteBtnText.textContent = 'Close';
                createInviteBtnSpinner.classList.add('hidden');
                cancelInviteBtn.classList.add('hidden');

                // Store the invitation ID to be used after modal closure
                lastCreatedInvitationId = data.invitation_id;

                // Add the close listener to the button. It will be removed when the modal opens again.
                createInviteBtn.addEventListener('click', closeInvitationModalAndHighlight);

                // loadInvitations(); // This is now handled by closeInvitationModalAndHighlight
                
            } else {
                showFormError(data.error || 'Failed to create invitation');
            }
        } catch (error) {
            console.error('Error creating invitation:', error);
            showFormError('Failed to create invitation. Please try again.');
        } finally {
            // Loading state remains active until form is closed or another action
            showLoading(false); // This will be handled by the 'Close' button now
        }
    }

    // Show/hide loading state
    function showLoading(loading) {
        if (loading) {
            createInviteBtnText.classList.add('hidden');
            createInviteBtnSpinner.classList.remove('hidden');
            createInviteBtn.disabled = true;
        } else {
            createInviteBtnText.classList.remove('hidden');
            createInviteBtnSpinner.classList.add('hidden');
            createInviteBtn.disabled = false;
        }
    }

    // Show form error
    function showFormError(message) {
        invitationError.textContent = message;
        invitationError.classList.remove('hidden');
    }

    // Show success message
    function showSuccess(message) {
        // This function is still used by resendInvitation, etc., not for createInvitation success anymore
        window.showToast(message, 'success');
    }

    // Show error message
    function showError(message) {
        window.showModal('Error', message, true);
    }

    // Global functions for onclick handlers
    window.viewInvitationDetails = function(invitationId) {
        // Find the invitation data
        const invitation = currentInvitations.find(inv => inv.id == invitationId);
        if (!invitation) {
            showError('Invitation not found');
            return;
        }

        // Generate the full invitation link
        const baseUrl = window.location.origin;
        const invitationLink = `${baseUrl}/regapp2/public/frontend/register.html?invitation=${invitation.invitation_code}`;

        // Populate the modal
        const detailsContent = document.getElementById('invitationDetailsContent');
        detailsContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Invitee Information</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="text-xs font-medium text-gray-500">Name</label>
                            <p class="text-sm text-gray-900">${invitation.invited_name}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Phone</label>
                            <p class="text-sm text-gray-900">${invitation.invited_phone || 'No phone'}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Invitation Details</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="text-xs font-medium text-gray-500">Status</label>
                            <p class="text-sm"><span class="${getStatusClass(invitation.status)}">${invitation.status}</span></p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Created</label>
                            <p class="text-sm text-gray-900">${formatDate(invitation.created_at)}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Expires</label>
                            <p class="text-sm text-gray-900">${formatDate(invitation.expires_at)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-6">
                <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Invitation Link</h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <p class="text-sm text-gray-900 break-all">${invitationLink}</p>
                        </div>
                        <button onclick="copyToClipboard('${invitationLink}')" class="ml-3 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-copy mr-2"></i>Copy Link
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-6">
                <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Invitation Code</h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <code class="text-sm font-mono text-gray-900">${invitation.invitation_code}</code>
                        <button onclick="copyToClipboard('${invitation.invitation_code}')" class="ml-3 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-copy mr-2"></i>Copy Code
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Show the modal
        document.getElementById('invitationDetailsModal').classList.remove('hidden');
    };

    window.resendInvitation = async function(invitationId) {
        // Implement resend invitation functionality
        console.log('Resending invitation:', invitationId);
        try {
            const data = await apiFetch('invitations.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'resend', invitation_id: invitationId })
            });
            if (data.success) {
                window.showToast('Invitation resend successfully!', 'success');
            } else {
                showError(data.error || 'Failed to resend invitation');
            }
        } catch (error) {
            console.error('Error resending invitation:', error);
            showError('Failed to resend invitation. Network error.');
        }
    };

    window.deleteInvitation = async function(invitationId) {
        const confirmed = await window.showModal('Confirm Deletion', 'Are you sure you want to delete this invitation? This action cannot be undone.', false, true);
        
        if (!confirmed) {
            return;
        }

        try {
            const data = await apiFetch(`invitations.php?id=${invitationId}`, {
                method: 'DELETE'
            });

            if (data.success) {
                window.showToast('Invitation deleted successfully', 'success');
                loadInvitations(); // Reload the list
            } else {
                showError(data.error || 'Failed to delete invitation');
            }

        } catch (error) {
            console.error('Error deleting invitation:', error);
            showError('Failed to delete invitation. Please try again.');
        }
    };

    // Copy invitation link to clipboard
    window.copyToClipboard = async function(text) {
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                showCopySuccess(button, originalText);
                return;
            }
            
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                showCopySuccess(button, originalText);
            } else {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            showCopyError(button, originalText);
        }
    };
    
    // Helper function to show copy success feedback
    function showCopySuccess(button, originalText) {
        button.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
        button.classList.add('bg-green-600', 'hover:bg-green-700');
        button.classList.remove('bg-indigo-600', 'hover:bg-indigo-700', 'bg-gray-600', 'hover:bg-gray-700');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('bg-green-600', 'hover:bg-green-700');
            
            // Restore original button style based on context
            if (originalText.includes('Copy Link')) {
                button.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            } else if (originalText.includes('Copy Code')) {
                button.classList.add('bg-gray-600', 'hover:bg-gray-700');
            } else {
                // For inline buttons (text-only)
                button.classList.add('text-indigo-600', 'hover:text-indigo-800');
            }
        }, 2000);
    }
    
    // Helper function to show copy error feedback
    function showCopyError(button, originalText) {
        button.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Failed';
        button.classList.add('bg-red-600', 'hover:bg-red-700');
        button.classList.remove('bg-indigo-600', 'hover:bg-indigo-700', 'bg-gray-600', 'hover:bg-gray-700');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('bg-red-600', 'hover:bg-red-700');
            
            // Restore original button style
            if (originalText.includes('Copy Link')) {
                button.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            } else if (originalText.includes('Copy Code')) {
                button.classList.add('bg-gray-600', 'hover:bg-gray-700');
            } else {
                button.classList.add('text-indigo-600', 'hover:text-indigo-800');
            }
        }, 2000);
        
        // Show user-friendly error message
        showError('Failed to copy to clipboard. Please try again or copy manually.');
    }

    // Toggle full URL display
    window.toggleFullUrl = function(button) {
        const cell = button.closest('td');
        const urlShort = cell.querySelector('.url-short');
        const urlFull = cell.querySelector('.url-full');
        const icon = button.querySelector('i');
        
        if (urlShort.classList.contains('hidden')) {
            // Show short version
            urlShort.classList.remove('hidden');
            urlFull.classList.add('hidden');
            icon.className = 'fas fa-expand-alt';
            button.innerHTML = '<i class="fas fa-expand-alt"></i> Show Full';
        } else {
            // Show full version
            urlShort.classList.add('hidden');
            urlFull.classList.remove('hidden');
            icon.className = 'fas fa-compress-alt';
            button.innerHTML = '<i class="fas fa-compress-alt"></i> Show Less';
        }
    };

    // Copy all invitation links to clipboard
    async function copyAllInvitationLinks() {
        if (currentInvitations.length === 0) {
            showError('No invitations to copy');
            return;
        }

        const baseUrl = window.location.origin;
        const allLinks = currentInvitations
            .filter(inv => inv.status === 'pending') // Only copy pending invitations
            .map(inv => `${inv.invited_name} (${inv.invited_phone || 'No phone'}): ${baseUrl}/regapp2/public/frontend/register.html?invitation=${inv.invitation_code}`)
            .join('\n\n');

        if (allLinks === '') {
            showError('No pending invitations to copy');
            return;
        }

        const originalText = copyAllLinksBtn.innerHTML;
        const pendingCount = currentInvitations.filter(inv => inv.status === 'pending').length;

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(allLinks);
                showCopyAllSuccess(originalText, pendingCount);
                return;
            }
            
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = allLinks;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                showCopyAllSuccess(originalText, pendingCount);
            } else {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            console.error('Failed to copy all links:', err);
            showCopyAllError(originalText);
        }
    }
    
    // Helper function to show copy all success feedback
    function showCopyAllSuccess(originalText, count) {
        copyAllLinksBtn.innerHTML = '<i class="fas fa-check mr-2"></i>All Links Copied!';
        copyAllLinksBtn.classList.add('bg-green-700');
        copyAllLinksBtn.classList.remove('bg-green-600');
        
        setTimeout(() => {
            copyAllLinksBtn.innerHTML = originalText;
            copyAllLinksBtn.classList.remove('bg-green-700');
            copyAllLinksBtn.classList.add('bg-green-600');
        }, 3000);
        
        window.showToast(`Copied ${count} invitation links to clipboard!`, 'success');
    }
    
    // Helper function to show copy all error feedback
    function showCopyAllError(originalText) {
        copyAllLinksBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Copy Failed';
        copyAllLinksBtn.classList.add('bg-red-600');
        copyAllLinksBtn.classList.remove('bg-green-600');
        
        setTimeout(() => {
            copyAllLinksBtn.innerHTML = originalText;
            copyAllLinksBtn.classList.remove('bg-red-600');
            copyAllLinksBtn.classList.add('bg-green-600');
        }, 3000);
        
        showError('Failed to copy all links to clipboard. Please try again.');
    }

    // Helper to highlight a row and display link
    /* Removed highlightAndDisplayLink function */

    // Replace window.showToast with an empty function or remove its usage where it was previously used for success message after creation
    window.showToast = function(message, type) {
        console.log(`Toast (now inline): ${message}, Type: ${type}`);
    };
}); 