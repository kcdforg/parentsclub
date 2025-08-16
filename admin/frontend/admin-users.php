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
require_once 'components/modal.php';
require_once 'components/pagination.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Users Management - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <?php renderAdminHeader('admin-users'); ?>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Admin Users Management</h1>
                <p class="mt-2 text-gray-600">Manage administrative user accounts</p>
            </div>
            <div class="flex space-x-3">
                <button id="createAdminUserBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    <i class="fas fa-plus mr-2"></i>Create Admin User
                </button>
            </div>
        </div>

        <?php
        // Configure filters for admin users
        $filterConfig = [
            'statusOptions' => [
                'active' => 'Active',
                'inactive' => 'Inactive'
            ],
            'searchPlaceholder' => 'Search by username or email',
            'customFields' => [
                [
                    'id' => 'role',
                    'label' => 'Role',
                    'type' => 'select',
                    'options' => [
                        'admin' => 'Administrator',
                        'moderator' => 'Moderator',
                        'viewer' => 'Viewer'
                    ]
                ]
            ]
        ];
        renderAdminFilters($filterConfig);
        ?>

        <!-- Admin Users Table -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="adminUsersTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Admin users will be loaded here -->
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
                    'totalItemsId' => 'totalAdminUsers'
                ]);
                ?>
            </div>
        </div>
    </div>

    <?php
    // Configure admin user form modal
    $adminUserFields = [
        [
            'id' => 'username',
            'name' => 'username',
            'label' => 'Username',
            'type' => 'text'
        ],
        [
            'id' => 'email',
            'name' => 'email',
            'label' => 'Email',
            'type' => 'email'
        ],
        [
            'id' => 'role',
            'name' => 'role',
            'label' => 'Role',
            'type' => 'select',
            'options' => [
                'admin' => 'Administrator',
                'moderator' => 'Moderator',
                'viewer' => 'Viewer'
            ]
        ],
        [
            'id' => 'password',
            'name' => 'password',
            'label' => 'Password',
            'type' => 'password'
        ],
        [
            'id' => 'confirmPassword',
            'name' => 'confirmPassword',
            'label' => 'Confirm Password',
            'type' => 'password'
        ]
    ];

    renderFormModal([
        'id' => 'adminUserModal',
        'title' => 'Create Admin User',
        'fields' => $adminUserFields,
        'submitText' => 'Create User',
        'cancelText' => 'Cancel'
    ]);
    ?>

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

    <script src="js/admin-users.js" type="module"></script>
</body>
</html>
