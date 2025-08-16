<?php
/**
 * Cleanup Script: Remove Old HTML Files
 * This script removes all the old HTML files after successful conversion to PHP
 */

echo "=== HTML to PHP Cleanup Script ===\n\n";

// Files to remove (admin)
$adminHtmlFiles = [
    'admin/frontend/dashboard.html',
    'admin/frontend/invitations.html',
    'admin/frontend/login.html',
    'admin/frontend/users.html',
    'admin/frontend/admin-users.html'
];

// Files to remove (public)
$publicHtmlFiles = [
    'public/frontend/dashboard.html',
    'public/frontend/login.html',
    'public/frontend/register.html',
    'public/frontend/edit_profile.html',
    'public/frontend/profile_completion.html',
    'public/frontend/subscription.html',
    'public/frontend/invitations.html',
    'public/frontend/reset_password.html',
    'public/frontend/index.html'
];

echo "Files to remove:\n";
echo "Admin Frontend:\n";
foreach ($adminHtmlFiles as $file) {
    if (file_exists($file)) {
        echo "  - $file (exists)\n";
    } else {
        echo "  - $file (already removed)\n";
    }
}

echo "\nPublic Frontend:\n";
foreach ($publicHtmlFiles as $file) {
    if (file_exists($file)) {
        echo "  - $file (exists)\n";
    } else {
        echo "  - $file (already removed)\n";
    }
}

echo "\n=== Cleanup Instructions ===\n";
echo "1. ✅ All HTML files have been converted to PHP\n";
echo "2. ⚠️  Old HTML files still exist and should be removed\n";
echo "3. 🔧 Run the following commands to clean up:\n\n";

echo "=== Manual Cleanup Commands ===\n";
echo "# Remove admin HTML files\n";
foreach ($adminHtmlFiles as $file) {
    echo "rm \"$file\"\n";
}

echo "\n# Remove public HTML files\n";
foreach ($publicHtmlFiles as $file) {
    echo "rm \"$file\"\n";
}

echo "\n=== Automated Cleanup ===\n";
echo "To automatically remove all old HTML files, run:\n";
echo "php cleanup_old_html.php --remove\n";

// Check if --remove flag is provided
if (in_array('--remove', $argv)) {
    echo "\n=== Starting Automated Cleanup ===\n";
    
    $removedCount = 0;
    $totalFiles = array_merge($adminHtmlFiles, $publicHtmlFiles);
    
    foreach ($totalFiles as $file) {
        if (file_exists($file)) {
            if (unlink($file)) {
                echo "✅ Removed: $file\n";
                $removedCount++;
            } else {
                echo "❌ Failed to remove: $file\n";
            }
        } else {
            echo "ℹ️  Already removed: $file\n";
        }
    }
    
    echo "\n=== Cleanup Complete ===\n";
    echo "Removed $removedCount out of " . count($totalFiles) . " files\n";
} else {
    echo "\n=== Next Steps ===\n";
    echo "1. Test all PHP files to ensure they work correctly\n";
    echo "2. Update any hardcoded .html links in JavaScript files\n";
    echo "3. Run cleanup with: php cleanup_old_html.php --remove\n";
    echo "4. Verify no broken links exist\n";
}

echo "\nCleanup script completed!\n";
?>
