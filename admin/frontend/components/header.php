<?php
// Admin Header Component
function renderAdminHeader($activePage = 'dashboard') {
    $pages = [
        'dashboard' => ['url' => 'dashboard.php', 'label' => 'Dashboard'],
        'users' => ['url' => 'users.php', 'label' => 'Users'],
        'invitations' => ['url' => 'invitations.php', 'label' => 'Invitations'],
        'admin-users' => ['url' => 'admin-users.php', 'label' => 'Admin Users']
    ];
?>
<nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <h1 class="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
                <div class="hidden md:block ml-10">
                    <div class="flex items-baseline space-x-4">
                        <?php foreach ($pages as $page => $info): ?>
                            <a href="<?php echo $info['url']; ?>" 
                               class="<?php echo $activePage === $page ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'; ?> px-3 py-2 rounded-md text-sm font-medium">
                                <?php echo $info['label']; ?>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
            <div class="flex items-center">
                <!-- Mobile menu button -->
                <button id="mobileMenuBtn" class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                    <i class="fas fa-bars"></i>
                </button>
                
                <!-- User menu -->
                <div class="ml-3 relative">
                    <div class="flex items-center space-x-4">
                        <span id="adminUsername" class="text-sm text-gray-700"></span>
                        <div class="relative">
                            <button id="userMenuBtn" class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <i class="fas fa-user-circle text-2xl"></i>
                            </button>
                            <div id="userDropdown" class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                <div class="py-1">
                                    <a href="#" id="changePasswordBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Change Password</a>
                                    <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Mobile menu -->
        <div id="mobileMenu" class="hidden md:hidden">
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
                <?php foreach ($pages as $page => $info): ?>
                    <a href="<?php echo $info['url']; ?>" 
                       class="<?php echo $activePage === $page ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'; ?> block px-3 py-2 rounded-md text-base font-medium">
                        <?php echo $info['label']; ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</nav>
<?php
}
?>
