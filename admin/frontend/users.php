<?php
session_start();
// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Include reusable components
require_once 'components/header.php';
require_once 'components/filters.php';
require_once 'components/pagination.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Users Management - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <?php renderAdminHeader('users'); ?>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Users Management</h1>
            <p class="mt-2 text-gray-600">View and manage user accounts</p>
        </div>

        <!-- Tabs -->
        <div class="mb-6">
            <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-8">
                    <button id="usersTab" class="tab-button active border-b-2 border-indigo-500 py-2 px-1 text-sm font-medium text-indigo-600">
                        <i class="fas fa-users mr-2"></i>Users List
                    </button>
                    <button id="resetRequestsTab" class="tab-button border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        <i class="fas fa-key mr-2"></i>Password Reset Requests
                        <span id="pendingResetCount" class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hidden">0</span>
                    </button>
                </nav>
            </div>
        </div>

        <!-- Users Tab Content -->
        <div id="usersTabContent" class="tab-content">
            <?php
            // Configure filters for users
            $filterConfig = [
                'statusOptions' => [
                    'pending' => 'Pending',
                    'approved' => 'Approved',
                    'rejected' => 'Rejected'
                ],
                'searchPlaceholder' => 'Search by name, phone, or enrollment number',
                'customFields' => [
                    [
                        'id' => 'userType',
                        'label' => 'User Type',
                        'type' => 'select',
                        'options' => [
                            'student' => 'Student',
                            'faculty' => 'Faculty',
                            'staff' => 'Staff'
                        ]
                    ]
                ]
            ];
            renderAdminFilters($filterConfig);
            ?>

            <!-- Users Table -->
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Users will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <?php
                    // Render pagination component
                    renderPagination([
                        'currentPage' => 1,
                        'totalPages' => 1,
                        'showingStart' => 0,
                        'showingEnd' => 0,
                        'totalItems' => 0,
                        'showingStartId' => 'showingStart',
                        'showingEndId' => 'showingEnd',
                        'totalItemsId' => 'totalUsers'
                    ]);
                    ?>
                </div>
            </div>
        </div>

        <!-- Password Reset Requests Tab Content -->
        <div id="resetRequestsTabContent" class="tab-content hidden">
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="resetRequestsTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Reset requests will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <?php
            // Configure filters for password reset requests
            $resetFilterConfig = [
                'idPrefix' => 'reset', // Unique prefix for reset filters
                'statusOptions' => [
                    'pending' => 'Pending',
                    'approved' => 'Approved',
                    'rejected' => 'Rejected',
                    'used' => 'Used',
                    'expired' => 'Expired'
                ],
                'searchPlaceholder' => 'Search by user email or enrollment',
                'showReset' => false // Only filter by search and status for now
            ];
            renderAdminFilters($resetFilterConfig);
            ?>
            
            <?php
            // Render pagination component for reset requests
            renderPagination([
                'currentPage' => 1,
                'totalPages' => 1,
                'showingStart' => 0,
                'showingEnd' => 0,
                'totalItems' => 0,
                'showingStartId' => 'resetShowingStart',
                'showingEndId' => 'resetShowingEnd',
                'totalItemsId' => 'totalResetRequests',
                'prevPageBtnId' => 'resetPrevPageBtn',
                'nextPageBtnId' => 'resetNextPageBtn',
                'currentPageSpanId' => 'resetCurrentPage'
            ]);
            ?>
        </div>
    </div>

    <!-- User Details Modal -->
    <div id="userDetailsModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">User Details</h3>
                    <button id="closeUserModalBtn" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="userDetailsContent" class="space-y-4">
                    <!-- User details will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div id="changePasswordModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Change Password</h3>
                    <button id="closePasswordModalBtn" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="changePasswordForm" class="space-y-4">
                    <div>
                        <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input type="password" id="currentPassword" name="currentPassword" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div>
                        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input type="password" id="newPassword" name="newPassword" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div>
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div id="passwordError" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    </div>
                    <div class="flex space-x-3">
                        <button type="submit" id="changePasswordBtn"
                                class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            <span id="changePasswordBtnText">Change Password</span>
                            <i id="changePasswordBtnSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                        </button>
                        <button type="button" id="cancelPasswordBtn"
                                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/users.js" type="module" defer></script>
</body>
</html>
