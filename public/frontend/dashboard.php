<?php
session_start();
// Check if user is logged in
if (!isset($_SESSION['user_logged_in']) || $_SESSION['user_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Include reusable components
require_once 'components/header.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Registration Portal</title>
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
    <?php renderPublicHeader('dashboard'); ?>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" style="display: none;">
        <!-- Profile Completion Notice -->
        <div id="profileCompletionNotice" class="px-4 py-6 sm:px-0 hidden">
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Profile Not Complete</h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <p>You need to complete your profile before accessing the dashboard. <a href="profile_completion.php" class="text-yellow-800 underline hover:text-yellow-900">Complete Profile Now</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Welcome Section -->
        <div class="px-4 py-6 sm:px-0">
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-user-circle text-4xl text-primary"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <h2 class="text-2xl font-bold text-gray-900" id="welcomeMessage">Welcome!</h2>
                            <p class="mt-1 text-sm text-gray-500" id="userInfo">Loading user information...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="px-4 py-6 sm:px-0">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-user-check text-2xl text-green-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Profile Status</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="profileStatus">Loading...</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-envelope text-2xl text-blue-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Invitations Sent</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="invitationsSent">0</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-users text-2xl text-purple-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Referrals</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="referrals">0</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div class="space-y-4" id="recentActivity">
                        <!-- Recent activity items will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <a href="edit_profile.php" class="bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-md text-sm font-medium transition-colors text-center">
                            <i class="fas fa-user-edit text-xl mb-2 block"></i>
                            Edit Profile
                        </a>
                        <a href="invitations.php" class="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors text-center">
                            <i class="fas fa-envelope text-xl mb-2 block"></i>
                            Send Invitations
                        </a>
                        <a href="subscription.php" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors text-center">
                            <i class="fas fa-crown text-xl mb-2 block"></i>
                            Subscription
                        </a>
                        <a href="profile_completion.php" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors text-center">
                            <i class="fas fa-clipboard-check text-xl mb-2 block"></i>
                            Complete Profile
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src="js/dashboard.js" type="module"></script>
    <script type="module">
        document.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                console.log('Link clicked:', e.target.href);
                console.log('Default prevented:', e.defaultPrevented);
            }
        }, true); // Use capturing phase to catch events before others
    </script>
</body>
</html>
