import { apiFetch } from './api.js';

// Subscription page functionality
let sessionToken = '';
let userData = {};
let subscriptionData = {};

// Initialize subscription page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    // Navigation functionality is now handled by PublicNavigation component
    // Only subscription-specific functionality is handled here

    // Initial data load
    loadSubscriptionData();
});

async function loadSubscriptionData() {
    try {
        // Fetch user account data
        const accountData = await apiFetch('account.php', {
            method: 'GET'
        });

        if (accountData.success) {
            // Username display is now handled by PublicProfileComponent
            console.log('User account data loaded successfully');
        } else {
            console.error('Failed to fetch user data:', accountData.error);
            showNotification(accountData.error || 'Failed to load user data', 'error');
        }

        // Fetch subscription data
        const subscriptionData = await apiFetch('subscription.php', {
            method: 'GET'
        });

        if (subscriptionData.success) {
            updateUI(subscriptionData.subscription);
        } else {
            console.error('Failed to fetch subscription data:', subscriptionData.error);
            showNotification(subscriptionData.error || 'Failed to load subscription data', 'error');
        }
    } catch (error) {
        console.error('Error fetching subscription data:', error);
        showNotification('Network error or failed to load data.', 'error');
    }
}

function updateUI(subscription) {
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    const subscriptionExpiry = document.getElementById('subscriptionExpiry');
    const subscriptionPrice = document.getElementById('subscriptionPrice');
    const renewButton = document.getElementById('renewButton');
    const manageButton = document.getElementById('manageButton');
    const paymentMethodDisplay = document.getElementById('paymentMethodDisplay');
    const paymentMethodSection = document.getElementById('paymentMethodSection');

    if (subscription && subscription.is_active) {
        subscriptionStatus.textContent = 'Active';
        subscriptionStatus.className = 'text-green-600 font-semibold';
        subscriptionExpiry.textContent = `Expires: ${new Date(subscription.expiry_date).toLocaleDateString()}`;
        subscriptionExpiry.classList.remove('hidden');
        
        // Check if there's a price, otherwise hide it
        if (subscription.price) {
            subscriptionPrice.textContent = `Price: $${parseFloat(subscription.price).toFixed(2)} / year`;
            subscriptionPrice.classList.remove('hidden');
        } else {
            subscriptionPrice.classList.add('hidden');
        }

        renewButton.classList.remove('hidden');
        renewButton.onclick = handleRenewSubscription;
        manageButton.classList.remove('hidden');
        manageButton.onclick = handleManageSubscription;
        paymentMethodSection.classList.remove('hidden');
        paymentMethodDisplay.textContent = subscription.payment_method || 'Not set';
        
    } else {
        subscriptionStatus.textContent = 'Inactive';
        subscriptionStatus.className = 'text-red-600 font-semibold';
        subscriptionExpiry.classList.add('hidden');
        subscriptionPrice.classList.add('hidden');
        renewButton.classList.add('hidden');
        manageButton.classList.add('hidden');
        paymentMethodSection.classList.add('hidden');
    }
}

async function handleRenewSubscription() {
    if (!confirm('Are you sure you want to renew your subscription?')) {
        return;
    }
    
    const renewButton = document.getElementById('renewButton');
    renewButton.disabled = true;
    renewButton.textContent = 'Processing...';

    try {
        const data = await apiFetch('subscription.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'renew' })
        });
        
        if (data.success) {
            showNotification('Subscription renewed successfully!', 'success');
            await loadSubscriptionData(); // Reload data to update UI
        } else {
            showNotification(data.error || 'Failed to renew subscription', 'error');
        }
    } catch (error) {
        console.error('Renew subscription error:', error);
        showNotification('Network error or failed to renew subscription.', 'error');
    } finally {
        renewButton.disabled = false;
        renewButton.textContent = 'Renew Subscription';
    }
}

async function handleManageSubscription() {
    if (!confirm('This will redirect you to the subscription management portal. Continue?')) {
        return;
    }

    const manageButton = document.getElementById('manageButton');
    manageButton.disabled = true;
    manageButton.textContent = 'Redirecting...';

    try {
        const data = await apiFetch('subscription.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'manage' })
        });

        if (data.success && data.redirect_url) {
            window.location.href = data.redirect_url;
        } else {
            showNotification(data.error || 'Failed to get management URL', 'error');
        }
    } catch (error) {
        console.error('Manage subscription error:', error);
        showNotification('Network error or failed to manage subscription.', 'error');
    } finally {
        manageButton.disabled = false;
        manageButton.textContent = 'Manage Subscription';
    }
}

// Logout functionality is now handled by PublicProfileComponent

function showNotification(message, type = 'info') {
    const notificationContainer = document.createElement('div');
    notificationContainer.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
    notificationContainer.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notificationContainer);
    setTimeout(() => notificationContainer.remove(), 3000);
}
