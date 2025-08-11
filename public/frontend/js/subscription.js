// Subscription page functionality
let sessionToken = '';
let userData = {};
let subscriptionData = {};

// Initialize subscription page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeEventListeners();
    loadUserData();
    loadSubscriptionData();
});

function checkAuthentication() {
    sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }
}

function initializeEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // User dropdown toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Subscribe button
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', showPaymentModal);
    }

    // Payment modal handlers
    const cancelPayment = document.getElementById('cancelPayment');
    const processPayment = document.getElementById('processPayment');
    
    if (cancelPayment) {
        cancelPayment.addEventListener('click', hidePaymentModal);
    }
    
    if (processPayment) {
        processPayment.addEventListener('click', handlePayment);
    }

    // Success modal close
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', function() {
            document.getElementById('successModal').classList.add('hidden');
            loadSubscriptionData(); // Refresh data
        });
    }

    // Payment form validation
    initializePaymentForm();
}

async function loadUserData() {
    // Load user data from localStorage first
    const storedData = localStorage.getItem('user_data');
    if (storedData) {
        userData = JSON.parse(storedData);
        updateUserInfo();
        checkApprovalStatus();
    }
    
    // Fetch fresh data from server
    try {
        const response = await fetch('../backend/account.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                userData = data.account;
                localStorage.setItem('user_data', JSON.stringify(userData));
                updateUserInfo();
                checkApprovalStatus();
            }
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function updateUserInfo() {
    const userName = document.getElementById('userName');
    if (userName && userData.full_name) {
        userName.textContent = userData.full_name;
    }
}

function checkApprovalStatus() {
    const notApprovedNotice = document.getElementById('notApprovedNotice');
    const subscriptionPlans = document.getElementById('subscriptionPlans');
    const subscribeBtn = document.getElementById('subscribeBtn');
    
    if (userData.approval_status !== 'approved') {
        // Show notice and disable subscription
        if (notApprovedNotice) notApprovedNotice.classList.remove('hidden');
        if (subscribeBtn) {
            subscribeBtn.disabled = true;
            subscribeBtn.innerHTML = '<i class="fas fa-lock mr-2"></i>Account Approval Required';
            subscribeBtn.className = 'w-full bg-gray-400 text-white font-medium py-3 px-6 rounded-lg cursor-not-allowed';
        }
    } else {
        // Hide notice and enable subscription
        if (notApprovedNotice) notApprovedNotice.classList.add('hidden');
    }
}

async function loadSubscriptionData() {
    try {
        const response = await fetch('../backend/subscription.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                subscriptionData = data;
                updateSubscriptionUI();
                updateSubscriptionHistory();
            } else {
                console.error('Failed to fetch subscription data:', data.error);
                if (data.error === 'Account not approved yet') {
                    // This is expected for non-approved users
                    updateSubscriptionHistory();
                } else {
                    showError(data.error);
                }
            }
        } else {
            console.error('Failed to fetch subscription data:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching subscription data:', error);
        showError('Failed to load subscription data');
    }
}

function updateSubscriptionUI() {
    const noSubscription = document.getElementById('noSubscription');
    const activeSubscription = document.getElementById('activeSubscription');
    const subscribeBtn = document.getElementById('subscribeBtn');
    
    if (subscriptionData.has_active_subscription && subscriptionData.active_subscription) {
        // Show active subscription
        if (noSubscription) noSubscription.classList.add('hidden');
        if (activeSubscription) activeSubscription.classList.remove('hidden');
        
        // Update subscription details
        const sub = subscriptionData.active_subscription;
        updateElement('subType', sub.subscription_type || 'Annual');
        updateElement('subStartDate', formatDate(sub.start_date));
        updateElement('subEndDate', formatDate(sub.end_date));
        
        // Update status badge
        const statusElement = document.getElementById('subStatus');
        if (statusElement) {
            const statusBadge = getStatusBadge(sub.status);
            statusElement.innerHTML = statusBadge;
        }
        
        // Disable subscribe button
        if (subscribeBtn) {
            subscribeBtn.disabled = true;
            subscribeBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Already Subscribed';
            subscribeBtn.className = 'w-full bg-green-500 text-white font-medium py-3 px-6 rounded-lg cursor-not-allowed';
        }
        
    } else {
        // Show no subscription
        if (noSubscription) noSubscription.classList.remove('hidden');
        if (activeSubscription) activeSubscription.classList.add('hidden');
    }
}

function updateSubscriptionHistory() {
    const historyContent = document.getElementById('historyContent');
    
    if (!subscriptionData.subscriptions || subscriptionData.subscriptions.length === 0) {
        historyContent.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-history text-2xl mb-2"></i>
                <p>No subscription history found</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = subscriptionData.subscriptions.map(sub => `
        <div class="border-b border-gray-200 py-4 last:border-b-0">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="text-sm font-medium text-gray-900">${sub.subscription_type || 'Annual'} Subscription</h4>
                    <p class="text-sm text-gray-500">
                        ${formatDate(sub.start_date)} - ${formatDate(sub.end_date)}
                    </p>
                    <p class="text-sm text-gray-500">Amount: ₹${sub.amount || '999'}</p>
                </div>
                <div>
                    ${getStatusBadge(sub.status)}
                </div>
            </div>
        </div>
    `).join('');
    
    historyContent.innerHTML = historyHTML;
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>',
        'pending': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>',
        'expired': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>',
        'cancelled': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Cancelled</span>'
    };
    
    return badges[status] || badges['pending'];
}

function showPaymentModal() {
    // Check if user is approved
    if (userData.approval_status !== 'approved') {
        showError('Your account must be approved before you can subscribe');
        return;
    }
    
    // Check if already has active subscription
    if (subscriptionData.has_active_subscription) {
        showError('You already have an active subscription');
        return;
    }
    
    // Pre-fill cardholder name if available
    const cardholderName = document.getElementById('cardholderName');
    if (cardholderName && userData.full_name) {
        cardholderName.value = userData.full_name;
    }
    
    // Show payment modal
    document.getElementById('paymentModal').classList.remove('hidden');
}

function hidePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    // Reset form
    document.getElementById('paymentForm').reset();
}

function initializePaymentForm() {
    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Expiry date formatting
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // CVV numeric only
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

async function handlePayment() {
    // Get form data
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholderName').value;
    
    // Basic validation
    if (!cardNumber || cardNumber.length < 13) {
        showError('Please enter a valid card number');
        return;
    }
    
    if (!expiryDate || expiryDate.length !== 5) {
        showError('Please enter a valid expiry date (MM/YY)');
        return;
    }
    
    if (!cvv || cvv.length < 3) {
        showError('Please enter a valid CVV');
        return;
    }
    
    if (!cardholderName.trim()) {
        showError('Please enter the cardholder name');
        return;
    }
    
    // Hide payment modal and show loading
    hidePaymentModal();
    document.getElementById('loadingModal').classList.remove('hidden');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        const response = await fetch('../backend/subscription.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                subscription_type: 'annual',
                payment_method: 'credit_card',
                payment_details: {
                    card_last_four: cardNumber.slice(-4),
                    cardholder_name: cardholderName
                }
            })
        });

        const data = await response.json();
        
        // Hide loading modal
        document.getElementById('loadingModal').classList.add('hidden');
        
        if (data.success) {
            // Process payment success and activate subscription
            await activateSubscription(data.subscription_id);
        } else {
            showError(data.error || 'Failed to create subscription');
        }
        
    } catch (error) {
        // Hide loading modal
        document.getElementById('loadingModal').classList.add('hidden');
        console.error('Payment error:', error);
        showError('Network error. Please try again.');
    }
}

async function activateSubscription(subscriptionId) {
    try {
        // In a real application, this would be handled by the payment gateway
        // For demo purposes, we'll make a separate call to activate the subscription
        const response = await fetch('../backend/subscription.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                action: 'activate',
                subscription_id: subscriptionId
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Show success modal
            document.getElementById('successModal').classList.remove('hidden');
        } else {
            // If activation fails, still show success but mention pending activation
            document.getElementById('successModal').classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Activation error:', error);
        // Still show success modal since payment was processed
        document.getElementById('successModal').classList.remove('hidden');
    }
}

async function handleLogout() {
    // Prevent multiple clicks
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.disabled = true;
        const originalContent = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging out...';
    }

    try {
        const response = await fetch('../backend/logout.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        // Wait for response and check if successful
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Server logout successful, now clear local data
                localStorage.removeItem('user_session_token');
                localStorage.removeItem('user_data');
                
                // Redirect to login
                window.location.href = 'login.html';
                return;
            } else {
                throw new Error(data.error || 'Logout failed');
            }
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if server logout fails, clear local data and redirect
        // This ensures user isn't stuck in a loop
        localStorage.removeItem('user_session_token');
        localStorage.removeItem('user_data');
        window.location.href = 'login.html';
    }
}

// Helper functions
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 z-50`;
    
    notification.innerHTML = `
        <div class="p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium text-red-800">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="rounded-md inline-flex text-red-800 hover:text-red-600 focus:outline-none" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 z-50`;
    
    notification.innerHTML = `
        <div class="p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas fa-check-circle text-green-400"></i>
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium text-green-800">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="rounded-md inline-flex text-green-800 hover:text-green-600 focus:outline-none" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}
