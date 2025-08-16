<?php
// Public Header Component
function renderPublicHeader($activePage = 'dashboard') {
    $pages = [
        'dashboard' => ['url' => 'dashboard.php', 'label' => 'Dashboard'],
        'edit_profile' => ['url' => 'edit_profile.php', 'label' => 'Profile'],
        'subscription' => ['url' => 'subscription.php', 'label' => 'Subscription'],
        'invitations' => ['url' => 'invitations.php', 'label' => 'Invitations']
    ];
?>
<nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <h1 class="text-xl font-bold text-gray-900">Registration Portal</h1>
                </div>
                <div class="hidden md:block ml-10">
                    <div class="flex items-baseline space-x-4">
                        <?php foreach ($pages as $page => $info): ?>
                            <a href="<?php echo $info['url']; ?>" 
                               class="<?php echo $activePage === $page ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'; ?> px-3 py-2 rounded-md text-sm font-medium">
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
                        <span id="userName" class="text-sm text-gray-700 hidden md:block"></span>
                        <div class="relative">
                            <button id="userMenuBtn" class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                <i class="fas fa-user-circle text-2xl"></i>
                            </button>
                            <div id="userDropdown" class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                <div class="py-1">
                                    <a href="edit_profile.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-user mr-2"></i>Edit Profile
                                    </a>
                                    <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Mobile menu -->
        <div id="mobileMenu" class="hidden md:hidden">
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <?php foreach ($pages as $page => $info): ?>
                    <a href="<?php echo $info['url']; ?>" 
                       class="<?php echo $activePage === $page ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'; ?> block px-3 py-2 rounded-md text-base font-medium">
                        <?php echo $info['label']; ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</nav>
<?php
}

// Index Page Header Component (simplified navigation for public index page)
function renderPublicIndexHeader() {
?>
<nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <h1 class="text-2xl font-bold text-primary">Registration Portal</h1>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <a href="login.php" class="text-gray-600 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">
                    Sign In
                </a>
            </div>
        </div>
    </div>
</nav>
<?php
}
?>
