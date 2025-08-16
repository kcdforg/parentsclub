<?php
session_start();
// Check if user is logged in
if (!isset($_SESSION['user_logged_in']) || $_SESSION['user_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Include reusable components
require_once 'components/header.php';
require_once 'components/footer.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription - Registration Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#4f46e5',
                        secondary: '#7c3aed'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <?php renderPublicHeader('subscription'); ?>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="px-4 py-6 sm:px-0">
            <div class="text-center">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    <i class="fas fa-crown text-primary mr-3"></i>
                    Membership Subscription
                </h1>
                <p class="text-gray-600 mb-8">Unlock premium features and exclusive benefits</p>
            </div>
        </div>

        <!-- Account Not Approved Notice -->
        <div id="notApprovedNotice" class="px-4 py-6 sm:px-0 hidden">
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Account Pending Approval</h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <p>Your account needs to be approved by an administrator before you can subscribe to our premium membership. Please wait for approval or contact support.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Current Subscription Status -->
        <div id="currentSubscription" class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div class="px-4 py-5 sm:px-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">Current Subscription</h3>
                    <p class="mt-1 max-w-2xl text-sm text-gray-500">Your membership status and details</p>
                </div>
                <div class="border-t border-gray-200">
                    <div id="noSubscription" class="px-4 py-5 sm:px-6 text-center">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-user text-2xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                        <p class="text-gray-500 mb-4">You don't have an active membership subscription yet.</p>
                    </div>
                    
                    <div id="activeSubscription" class="hidden px-4 py-5 sm:px-6">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-crown text-2xl text-green-600"></i>
                            </div>
                            <h3 class="text-lg font-medium text-green-900 mb-2">Premium Member</h3>
                            <p class="text-green-600">You have an active subscription</p>
                        </div>
                        
                        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Subscription Type</dt>
                                <dd id="subType" class="mt-1 text-sm text-gray-900">Annual</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Status</dt>
                                <dd id="subStatus" class="mt-1 text-sm text-gray-900">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Start Date</dt>
                                <dd id="subStartDate" class="mt-1 text-sm text-gray-900">-</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">End Date</dt>
                                <dd id="subEndDate" class="mt-1 text-sm text-gray-900">-</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <!-- Subscription Plans -->
        <div id="subscriptionPlans" class="px-4 py-6 sm:px-0">
            <div class="text-center mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
                <p class="text-gray-600">Select the perfect membership plan for your needs</p>
            </div>

            <div class="grid grid-cols-1 gap-8 lg:grid-cols-1 max-w-2xl mx-auto">
                <!-- Annual Plan -->
                <div class="bg-white border-2 border-primary rounded-lg shadow-lg relative">
                    <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span class="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                            Most Popular
                        </span>
                    </div>
                    
                    <div class="p-8">
                        <div class="text-center">
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">Annual Premium</h3>
                            <p class="text-gray-500 mb-6">Full access to all premium features</p>
                            
                            <div class="mb-6">
                                <span class="text-4xl font-bold text-gray-900">₹999</span>
                                <span class="text-gray-500">/year</span>
                            </div>
                        </div>
                        
                        <ul class="space-y-4 mb-8">
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span class="text-gray-700">Exclusive community access</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span class="text-gray-700">Premium content and resources</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span class="text-gray-700">Priority customer support</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span class="text-gray-700">Special events and workshops</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span class="text-gray-700">Referral program benefits</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span class="text-gray-700">Mobile app access</span>
                            </li>
                        </ul>
                        
                        <button id="subscribeBtn" 
                                class="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <i class="fas fa-crown mr-2"></i>
                            Subscribe Now
                        </button>
                        
                        <p class="text-xs text-gray-500 text-center mt-4">
                            * This is a demo. No actual payment will be processed.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Subscription History -->
        <div id="subscriptionHistory" class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                <div class="px-4 py-5 sm:px-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">Subscription History</h3>
                    <p class="mt-1 max-w-2xl text-sm text-gray-500">Your past and current subscription records</p>
                </div>
                <div class="border-t border-gray-200">
                    <div id="historyContent" class="px-4 py-5 sm:px-6">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-history text-2xl mb-2"></i>
                            <p>Loading subscription history...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Loading Modal -->
    <div id="loadingModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                    <i class="fas fa-spinner fa-spin text-primary text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mt-4">Processing Subscription</h3>
                <div class="mt-2 px-7 py-3">
                    <p class="text-sm text-gray-500">
                        Please wait while we process your subscription request...
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Modal -->
    <div id="paymentModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <div class="text-center mb-6">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                        <i class="fas fa-credit-card text-primary text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mt-4">Complete Payment</h3>
                    <p class="text-sm text-gray-500 mt-2">Annual Premium Membership - ₹999</p>
                </div>
                
                <form id="paymentForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                               maxlength="19" required>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input type="text" id="expiryDate" placeholder="MM/YY" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                   maxlength="5" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                            <input type="text" id="cvv" placeholder="123" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                   maxlength="4" required>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                        <input type="text" id="cardholderName" placeholder="John Doe" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                               required>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                        <div class="flex">
                            <i class="fas fa-info-circle text-blue-400 mt-0.5"></i>
                            <div class="ml-3">
                                <p class="text-sm text-blue-800">
                                    <strong>Demo Mode:</strong> This is a simulation. No real payment will be processed.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
                
                <div class="flex gap-3 mt-6">
                    <button id="cancelPayment" class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button id="processPayment" class="flex-1 px-4 py-2 bg-primary text-white text-base font-medium rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary">
                        Pay ₹999
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="successModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <i class="fas fa-check text-green-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mt-4">Payment Successful!</h3>
                <div class="mt-2 px-7 py-3">
                    <p class="text-sm text-gray-500">
                        Welcome to Premium Membership! Your subscription is now active.
                    </p>
                </div>
                <div class="items-center px-4 py-3">
                    <button id="closeSuccessModal" class="px-4 py-2 bg-primary text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary">
                        Continue
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php renderPublicFooter(); ?>
    <script src="js/subscription.js" type="module"></script>
</body>
</html>
