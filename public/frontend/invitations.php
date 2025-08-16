<?php
session_start();
// Check if user is logged in
if (!isset($_SESSION['user_logged_in']) || $_SESSION['user_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Include reusable components
require_once 'components/header.php';
require_once 'components/filters.php';
require_once 'components/modal.php';
require_once 'components/footer.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Invitations - Registration Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#4f46e5',
                        secondary: '#06b6d4'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <?php renderPublicHeader('invitations'); ?>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
            <!-- Header -->
            <div class="md:flex md:items-center md:justify-between mb-6">
                <div class="flex-1 min-w-0">
                    <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        <i class="fas fa-envelope mr-3 text-primary"></i>My Invitations
                    </h2>
                    <p class="mt-1 text-sm text-gray-500">
                        Invite friends and colleagues to join the platform
                    </p>
                </div>
                <div class="mt-4 flex md:mt-0 md:ml-4">
                    <button id="createInvitationBtn" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Create Invitation
                    </button>
                </div>
            </div>

            <!-- Access Notice -->
            <div id="accessNotice" class="hidden bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            <strong>Note:</strong> Only approved members can create invitations. Please ensure your profile is complete and approved by an admin.
                        </p>
                    </div>
                </div>
            </div>

            <?php
            // Configure filters for invitations
            $filterConfig = [
                'showStatus' => true,
                'statusOptions' => [
                    'all' => 'All Status',
                    'pending' => 'Pending',
                    'used' => 'Used',
                    'expired' => 'Expired'
                ],
                'searchPlaceholder' => 'Search by name or email',
                'customFields' => [],
                'gridCols' => 'md:grid-cols-3'
            ];
            renderPublicFilters($filterConfig);
            ?>

            <!-- Invitations Table -->
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitee</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used By</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="invitationsTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Invitations will be loaded here -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div id="pagination" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                        <!-- Pagination will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php
    // Configure invitation form modal
    $invitationFields = [
        [
            'id' => 'inviteeName',
            'name' => 'inviteeName',
            'label' => 'Name',
            'type' => 'text'
        ],
        [
            'label' => 'Invitation Type',
            'name' => 'invitationType',
            'type' => 'radio',
            'options' => [
                'email' => 'Email',
                'phone' => 'Phone Number'
            ],
            'checked' => 'email'
        ],
        [
            'id' => 'inviteeEmail',
            'name' => 'inviteeEmail',
            'label' => 'Email Address',
            'type' => 'email',
            'help' => 'The invitee will register using this email address'
        ],
        [
            'id' => 'inviteePhone',
            'name' => 'invited_phone_number',
            'label' => 'Phone Number',
            'type' => 'tel',
            'help' => 'The invitee will register using this phone number',
            'countryCode' => [
                'id' => 'countryCodeInvite',
                'name' => 'invited_phone_country_code',
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

    renderPublicFormModal([
        'id' => 'createInvitationModal',
        'title' => 'Create Invitation',
        'fields' => $invitationFields,
        'submitText' => 'Create Invitation',
        'cancelText' => 'Cancel'
    ]);
    ?>

    <!-- Invitation Link Modal -->
    <?php
    renderPublicModal([
        'id' => 'invitationLinkModal',
        'title' => 'Invitation Created',
        'content' => '
            <div class="space-y-4">
                <p class="text-sm text-gray-600">
                    Invitation created for: <strong id="inviteeContactDisplay"></strong>
                </p>
                <div class="relative">
                    <input type="text" id="invitationLinkInput" readonly
                           class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-sm">
                    <button id="copyLinkBtn" class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p class="text-xs text-gray-500">
                    This link will expire in 7 days. Share it with the invitee to complete their registration.
                </p>
            </div>
        '
    ]);
    ?>

    <?php renderPublicFooter(); ?>
    <script src="js/invitations.js" type="module"></script>
</body>
</html>
