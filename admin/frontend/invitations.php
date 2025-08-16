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
    <title>Invitations Management - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .table-fixed {
            table-layout: fixed;
        }
        
        .table-fixed th,
        .table-fixed td {
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .table-fixed th.w-48 { width: 12rem; }
        .table-fixed th.w-40 { width: 10rem; }
        .table-fixed th.w-64 { width: 16rem; }
        .table-fixed th.w-24 { width: 6rem; }
        .table-fixed th.w-32 { width: 8rem; }
        
        @media (max-width: 1024px) {
            .table-fixed th.w-64 { width: 12rem; }
        }
        
        @media (max-width: 768px) {
            .table-fixed th.w-48 { width: 8rem; }
            .table-fixed th.w-40 { width: 8rem; }
            .table-fixed th.w-64 { width: 10rem; }
        }
        
        /* Ensure table doesn't collapse */
        .overflow-x-auto {
            min-width: 100%;
        }
        
        .overflow-x-auto table {
            min-width: 800px; /* Minimum table width */
        }
        
        /* Add visual scroll indicator */
        .overflow-x-auto::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
            border-radius: 2px;
        }
        
        /* Ensure proper cell spacing */
        .table-fixed td {
            padding: 1rem 0.75rem;
            vertical-align: top;
        }
        
        /* Make URLs more readable */
        .url-short, .url-full {
            word-break: break-all;
            line-height: 1.4;
        }
    </style>
</head>
<body class="bg-gray-50">
    <?php renderAdminHeader('invitations'); ?>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Invitations Management</h1>
                <p class="mt-2 text-gray-600">Create and manage user invitations</p>
            </div>
            <div class="flex flex-col items-end">
                <div class="flex space-x-3 mb-2">
                    <button id="compactViewBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-compress-alt mr-2"></i>Compact View
                    </button>
                    <button id="copyAllLinksBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-copy mr-2"></i>Copy All Links
                    </button>
                    <button id="createInvitationBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Create Invitation
                    </button>
                </div>
                <p class="text-xs text-gray-500">Compact View: Toggle between compact and detailed table layout</p>
            </div>
        </div>

        <?php
        // Configure filters for invitations
        $filterConfig = [
            'statusOptions' => [
                'pending' => 'Pending',
                'used' => 'Used', 
                'expired' => 'Expired'
            ],
            'searchPlaceholder' => 'Search by name or phone',
            'customFields' => [
                [
                    'id' => 'countryCode',
                    'label' => 'Country Code',
                    'type' => 'select',
                    'options' => [
                        '+91' => '🇮🇳 +91',
                        '+1' => '🇺🇸 +1',
                        '+44' => '🇬🇧 +44',
                        '+61' => '🇦🇺 +61',
                        '+81' => '🇯🇵 +81',
                        '+49' => '🇩🇪 +49',
                        '+33' => '🇫🇷 +33',
                        '+39' => '🇮🇹 +39',
                        '+34' => '🇪🇸 +34',
                        '+86' => '🇨🇳 +86'
                    ]
                ]
            ]
        ];
        renderAdminFilters($filterConfig);
        ?>

        <!-- Invitations Table -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Invitee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Phone</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Invitation Link</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Created</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Expires</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="invitationsTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Invitations will be loaded here -->
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
                    'totalItemsId' => 'totalInvitations'
                ]);
                ?>
            </div>
        </div>
    </div>

    <?php
    // Configure invitation form modal
    $invitationFields = [
        [
            'id' => 'inviteeName',
            'name' => 'name',
            'label' => 'Name',
            'type' => 'text'
        ],
        [
            'id' => 'inviteePhone', 
            'name' => 'phone',
            'label' => 'Phone Number (10 digits)',
            'type' => 'tel',
            'help' => 'Enter 10-digit phone number without country code'
        ],
        [
            'id' => 'countryCode',
            'name' => 'country_code',
            'label' => 'Country Code',
            'type' => 'select',
            'options' => [
                '+91' => '🇮🇳 +91',
                '+1' => '🇺🇸 +1',
                '+44' => '🇬🇧 +44',
                '+61' => '🇦🇺 +61',
                '+81' => '🇯🇵 +81',
                '+49' => '🇩🇪 +49',
                '+33' => '🇫🇷 +33',
                '+39' => '🇮🇹 +39',
                '+34' => '🇪🇸 +34',
                '+86' => '🇨🇳 +86'
            ]
        ]
    ];

    renderFormModal([
        'id' => 'invitationModal',
        'title' => 'Create Invitation',
        'fields' => $invitationFields,
        'submitText' => 'Create Invitation',
        'cancelText' => 'Cancel'
    ]);
    ?>

    <!-- Invitation Details Modal -->
    <div id="invitationDetailsModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[1002]">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Invitation Details</h3>
                    <button id="closeDetailsModalBtn" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="invitationDetailsContent" class="space-y-4">
                    <!-- Invitation details will be loaded here -->
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

    <script src="js/invitations.js" type="module"></script>
</body>
</html>
