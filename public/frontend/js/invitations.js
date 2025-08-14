import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    let currentPage = 1;
    let currentStatus = 'all';
    let currentSearch = '';
    let userData = null;

    // Initialize page
    initializePage();

    // Event listeners
    document.getElementById('createInvitationBtn').addEventListener('click', openCreateModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeCreateModal);
    document.getElementById('cancelBtn').addEventListener('click', closeCreateModal);
    document.getElementById('closeLinkModalBtn').addEventListener('click', closeLinkModal);
    document.getElementById('invitationForm').addEventListener('submit', handleCreateInvitation);
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('statusFilter').addEventListener('change', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    document.getElementById('copyLinkBtn').addEventListener('click', copyInvitationLink);
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    
    // Add event listeners for invitation type toggle
    document.querySelectorAll('input[name="invitationType"]').forEach(radio => {
        radio.addEventListener('change', handleInvitationTypeChange);
    });
    
    // Add phone number formatting for invitation forms
    const inviteePhoneInput = document.getElementById('inviteePhone');
    const crossPhoneInput = document.getElementById('crossPhone');
    
    if (inviteePhoneInput) {
        inviteePhoneInput.addEventListener('input', function(e) {
            formatPhoneInput(e.target);
        });
    }
    
    if (crossPhoneInput) {
        crossPhoneInput.addEventListener('input', function(e) {
            formatPhoneInput(e.target);
        });
    }

    async function initializePage() {
        try {
            // Check user eligibility and load data
            await checkUserEligibility();
            await loadInvitations();
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize page');
        }
    }

    async function checkUserEligibility() {
        try {
            const data = await apiFetch('account.php', {
                method: 'GET'
            });

            userData = data; // Assuming data directly contains user info from API

            // Update user greeting
            const userGreeting = document.getElementById('userGreeting');
            if (userGreeting) {
                userGreeting.textContent = `Welcome, ${userData.full_name || userData.email}!`;
            }

            // Check if user can create invitations
            const canInvite = userData.approval_status === 'approved';

            if (!canInvite) {
                // Show access notice and disable create button
                document.getElementById('accessNotice').classList.remove('hidden');
                document.getElementById('createInvitationBtn').disabled = true;
                document.getElementById('createInvitationBtn').classList.add('opacity-50', 'cursor-not-allowed');
            }

        } catch (error) {
            console.error('Error checking user eligibility:', error);
            throw error;
        }
    }

    async function loadInvitations() {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                status: currentStatus !== 'all' ? currentStatus : '',
                search: currentSearch
            });

            const data = await apiFetch(`invitations.php?${params}`, {
                method: 'GET'
            });
            
            if (data.success) {
                // Check if user has permission to invite
                if (data.user_info && !data.user_info.can_invite) {
                    displayEmptyInvitations();
                } else {
                    displayInvitations(data.invitations);
                    updatePagination(data.pagination);
                }
            } else {
                throw new Error(data.error || 'Failed to load invitations');
            }

        } catch (error) {
            console.error('Error loading invitations:', error);
            showError(error.message);
        }
    }

    function displayEmptyInvitations() {
        const tbody = document.getElementById('invitationsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div class="flex flex-col items-center py-8">
                        <i class="fas fa-user-lock text-4xl text-gray-300 mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-700 mb-2">Access Restricted</h3>
                        <p class="text-sm text-gray-500 max-w-md text-center">
                            You need to be an approved member to send invitations. 
                            Complete your profile and wait for admin approval.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        
        // Hide pagination
        document.getElementById('pagination').innerHTML = '';
    }

    function displayInvitations(invitations) {
        const tbody = document.getElementById('invitationsTableBody');
        tbody.innerHTML = '';

        if (invitations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No invitations found
                    </td>
                </tr>
            `;
            return;
        }

        invitations.forEach(invitation => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            const statusBadge = getStatusBadge(invitation.status);
            const usedByInfo = invitation.used_by_name ? 
                `<div class="text-sm text-gray-900">${invitation.used_by_name}</div><div class="text-sm text-gray-500">${invitation.used_by_email}</div>` :
                '<span class="text-sm text-gray-500">-</span>';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                <span class="text-white font-medium">${invitation.invited_name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${invitation.invited_name}</div>
                            <div class="text-sm text-gray-500">
                                ${getInviteeContactDisplay(invitation)}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${invitation.invited_email || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${invitation.invited_phone || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(invitation.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(invitation.expires_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${usedByInfo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${getActionButtons(invitation)}
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    function getStatusBadge(status) {
        switch(status) {
            case 'pending':
                return '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>';
            case 'used':
                return '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Used</span>';
            case 'expired':
                return '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>';
            default:
                return '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>';
        }
    }

    function getInviteeContactDisplay(invitation) {
        // No longer needed as email and phone are separate columns
        return ''; 
    }

    function getActionButtons(invitation) {
        if (invitation.status === 'pending') {
            return `
                <button onclick="viewInvitation('${invitation.invitation_code}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-external-link-alt mr-1"></i>View Link
                </button>
                <button onclick="deleteInvitation(${invitation.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash-alt mr-1"></i>Delete
                </button>
            `;
        } else {
            return `
                <span class="text-gray-400">
                    <i class="fas fa-check mr-1"></i>Completed
                </span>
            `;
        }
    }

    function updatePagination(pagination) {
        const paginationDiv = document.getElementById('pagination');
        
        if (pagination.total_pages <= 1) {
            paginationDiv.innerHTML = '';
            return;
        }

        const prevDisabled = pagination.current_page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50';
        const nextDisabled = pagination.current_page === pagination.total_pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50';

        paginationDiv.innerHTML = `
            <div class="flex-1 flex justify-between sm:hidden">
                <button onclick="loadPage(${pagination.current_page - 1})" 
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${prevDisabled}"
                        ${pagination.current_page === 1 ? 'disabled' : ''}>
                    Previous
                </button>
                <button onclick="loadPage(${pagination.current_page + 1})"
                        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${nextDisabled}"
                        ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Showing <span class="font-medium">${(pagination.current_page - 1) * pagination.items_per_page + 1}</span>
                        to <span class="font-medium">${Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)}</span>
                        of <span class="font-medium">${pagination.total_items}</span> results
                    </p>
                </div>
                <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button onclick="loadPage(${pagination.current_page - 1})" 
                                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${prevDisabled}"
                                ${pagination.current_page === 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        ${generatePageNumbers(pagination)}
                        <button onclick="loadPage(${pagination.current_page + 1})"
                                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${nextDisabled}"
                                ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </nav>
                </div>
            </div>
        `;
    }

    function generatePageNumbers(pagination) {
        let pages = '';
        const start = Math.max(1, pagination.current_page - 2);
        const end = Math.min(pagination.total_pages, pagination.current_page + 2);

        for (let i = start; i <= end; i++) {
            const isActive = i === pagination.current_page;
            const bgClass = isActive ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50';
            
            pages += `
                <button onclick="loadPage(${i})" 
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${bgClass}">
                    ${i}
                </button>
            `;
        }
        return pages;
    }

    function openCreateModal() {
        document.getElementById('createInvitationModal').classList.remove('hidden');
        
        // Initialize form to default state (email type)
        document.querySelector('input[name="invitationType"][value="email"]').checked = true;
        handleInvitationTypeChange();
        
        document.getElementById('inviteeName').focus();
    }

    function closeCreateModal() {
        document.getElementById('createInvitationModal').classList.add('hidden');
        document.getElementById('invitationForm').reset();
        
        // Reset form to default state (email type)
        document.querySelector('input[name="invitationType"][value="email"]').checked = true;
        handleInvitationTypeChange();
        
        hideError();
        hideSuccess();
    }

    function closeLinkModal() {
        document.getElementById('invitationLinkModal').classList.add('hidden');
    }

    function handleInvitationTypeChange() {
        const invitationType = document.querySelector('input[name="invitationType"]:checked').value;
        const emailSection = document.getElementById('emailSection');
        const phoneSection = document.getElementById('phoneSection');
        const crossEmailSection = document.getElementById('crossEmailSection');
        const crossPhoneSection = document.getElementById('crossPhoneSection');
        const inviteeEmail = document.getElementById('inviteeEmail');
        const inviteePhone = document.getElementById('inviteePhone');
        
        if (invitationType === 'email') {
            // Show email input, hide phone input
            emailSection.classList.remove('hidden');
            phoneSection.classList.add('hidden');
            
            // Show cross-phone section, hide cross-email section
            crossPhoneSection.classList.remove('hidden');
            crossEmailSection.classList.add('hidden');
            
            // Make email required, make phone optional
            inviteeEmail.required = true;
            inviteePhone.required = false;
            
        } else if (invitationType === 'phone') {
            // Show phone input, hide email input
            phoneSection.classList.remove('hidden');
            emailSection.classList.add('hidden');
            
            // Show cross-email section, hide cross-phone section
            crossEmailSection.classList.remove('hidden');
            crossPhoneSection.classList.add('hidden');
            
            // Make phone required, make email optional
            inviteePhone.required = true;
            inviteeEmail.required = false;
        }
        
        // Clear error messages when switching types
        hideError();
    }

    async function handleCreateInvitation(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        // Show loading state
        submitBtn.disabled = true;
        submitText.textContent = 'Creating...';
        submitSpinner.classList.remove('hidden');
        hideError();
        hideSuccess();

        try {
            const formData = new FormData(e.target);
            const invitationType = document.querySelector('input[name="invitationType"]:checked').value;
            
            // Collect basic data
            const invitationData = {
                invited_name: formData.get('inviteeName'),
                invitation_type: invitationType
            };
            
            // Collect type-specific data
            if (invitationType === 'email') {
                invitationData.invited_email = formData.get('inviteeEmail');
                // Add cross-reference phone if provided
                const crossPhone = formData.get('crossPhone');
                const crossCountryCode = document.getElementById('crossCountryCode').value;
                if (crossPhone && crossPhone.trim()) {
                    invitationData.invited_phone = crossCountryCode + crossPhone.replace(/\D/g, '');
                }
            } else if (invitationType === 'phone') {
                const phone = formData.get('invited_phone_number');
                const countryCode = formData.get('invited_phone_country_code');
                invitationData.invited_phone = countryCode + phone.replace(/\D/g, '');
                // Add cross-reference email if provided
                const crossEmail = formData.get('crossEmail');
                if (crossEmail && crossEmail.trim()) {
                    invitationData.invited_email = crossEmail;
                }
            }
            
            // Validate required fields
            if (invitationType === 'email' && !invitationData.invited_email) {
                throw new Error('Email address is required');
            }
            if (invitationType === 'phone' && !invitationData.invited_phone) {
                throw new Error('Phone number is required');
            }
            
            // Additional validation
            if (invitationType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitationData.invited_email)) {
                throw new Error('Please enter a valid email address');
            }
            
            if (invitationType === 'phone') {
                const phoneDigits = formData.get('invited_phone_number').replace(/\D/g, '');
                // New: Validate invited phone number based on its digits and selected country code
                const invitedPhoneCountryCode = formData.get('invited_phone_country_code');
                let phoneMaxLength = 10; // Default for India
                
                if (invitedPhoneCountryCode === '+1' || invitedPhoneCountryCode === '+44') {
                    phoneMaxLength = 10;
                } else if (invitedPhoneCountryCode === '+61') {
                    phoneMaxLength = 9;
                } else if (invitedPhoneCountryCode === '+81') {
                    phoneMaxLength = 11;
                }
                
                if (phoneDigits.length !== phoneMaxLength && !(invitedPhoneCountryCode === '+81' && (phoneDigits.length === 10 || phoneDigits.length === 11))) {
                    throw new Error(`Phone number must be exactly ${phoneMaxLength} digits for selected country code.`);
                }
                if (invitedPhoneCountryCode === '+91' && !/^[6-9]/.test(phoneDigits)) {
                    throw new Error('Indian mobile number must start with 6, 7, 8, or 9');
                }
            }

            const data = await apiFetch('invitations.php', {
                method: 'POST',
                body: JSON.stringify(invitationData)
            });

            if (data.success) {
                // Show success and invitation link
                const inviteeDisplay = invitationType === 'email' ? 
                    invitationData.invited_email : 
                    invitationData.invited_phone;
                showInvitationLink(data.invitation_link, inviteeDisplay);
                closeCreateModal();
                await loadInvitations(); // Reload the list
            } else {
                showError(data.error || 'Failed to create invitation');
            }

        } catch (error) {
            console.error('Error creating invitation:', error);
            showError('Failed to create invitation. Please try again.');
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            submitText.textContent = 'Create Invitation';
            submitSpinner.classList.add('hidden');
        }
    }

    function showInvitationLink(link, contact) {
        document.getElementById('inviteeContactDisplay').textContent = contact;
        document.getElementById('invitationLinkInput').value = link;
        document.getElementById('invitationLinkModal').classList.remove('hidden');
    }

    function copyInvitationLink() {
        const linkInput = document.getElementById('invitationLinkInput');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showNotification('Invitation link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy link', 'error');
        }
    }

    function handleSearch() {
        currentPage = 1;
        currentStatus = document.getElementById('statusFilter').value;
        currentSearch = document.getElementById('searchInput').value.trim();
        loadInvitations();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function showError(message) {
        const errorDiv = document.getElementById('invitationError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    function hideError() {
        const errorDiv = document.getElementById('invitationError');
        errorDiv.classList.add('hidden');
    }

    function showSuccess(message) {
        const successDiv = document.getElementById('invitationSuccess');
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
    }

    function hideSuccess() {
        const successDiv = document.getElementById('invitationSuccess');
        successDiv.classList.add('hidden');
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.classList.toggle('hidden');
    }

    function formatPhoneInput(input) {
        // Remove all non-digit characters
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 10 digits
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        // Update the input value
        input.value = value;
        
        // Update visual feedback
        const isValid = value.length === 10;
        if (isValid) {
            input.classList.remove('border-red-500');
            input.classList.add('border-green-500');
        } else {
            input.classList.remove('border-green-500');
            input.classList.add('border-red-500');
        }
    }

    // Global functions for onclick handlers
    window.loadPage = function(page) {
        if (page >= 1) {
            currentPage = page;
            loadInvitations();
        }
    };

    window.viewInvitation = function(invitationCode) {
        const baseUrl = window.location.origin;
        const invitationLink = `${baseUrl}/regapp2/public/frontend/register.html?invitation=${invitationCode}`;
        showInvitationLink(invitationLink, 'View invitation link');
    };

    window.deleteInvitation = async function(invitationId) {
        if (!confirm('Are you sure you want to delete this invitation?')) {
            return;
        }

        try {
            const data = await apiFetch(`invitations.php?id=${invitationId}`, {
                method: 'DELETE'
            });

            if (data.success) {
                showNotification('Invitation deleted successfully', 'success');
                await loadInvitations(); // Reload the list
            } else {
                showNotification(data.error || 'Failed to delete invitation', 'error');
            }

        } catch (error) {
            console.error('Error deleting invitation:', error);
            showNotification('Failed to delete invitation', 'error');
        }
    };
});

// Logout function
async function logout() {
    try {
        await apiFetch('logout.php', {
            method: 'POST'
        });
        
        // Server logout successful, now clear local data
        localStorage.removeItem('user_session_token');
        localStorage.removeItem('user_data');
        
        // Redirect to login
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if server logout fails, clear local data and redirect
        // This ensures user isn't stuck in a loop
        localStorage.removeItem('user_session_token');
        localStorage.removeItem('user_data');
        window.location.href = 'login.html';
    }
}
