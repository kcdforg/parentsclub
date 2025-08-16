# PHP to HTML Migration Backup & Restore - Instructions

## Overview
You now have automated scripts to safely backup your PHP migration and restore the original HTML version from GitHub.

## Files Created
- `backup_and_restore_html.bat` - Main automation script
- `verify_restoration.bat` - Verification script
- `BACKUP_RESTORE_INSTRUCTIONS.md` - This instruction file

## How to Use

### Step 1: Run the Backup & Restore Script
```cmd
# Open Command Prompt as Administrator (recommended)
# Navigate to your regapp2 directory
cd C:\xampp\htdocs\regapp2

# Run the main script
backup_and_restore_html.bat
```

### Step 2: Follow the Script Prompts
The script will:
1. **Confirm** - Ask for confirmation before proceeding
2. **Backup** - Create local backup in `regapp2_php_migration_backup`
3. **Git Branch** - Create `php-migration-backup` branch and push to GitHub
4. **Restore** - Reset working directory to HTML version from GitHub
5. **Verify** - Check that restoration was successful

### Step 3: Verify Everything Worked
```cmd
# Run the verification script
verify_restoration.bat
```

## What the Scripts Do

### Backup Process
- ✅ Creates complete local backup: `C:\xampp\htdocs\regapp2_php_migration_backup\`
- ✅ Commits any uncommitted changes
- ✅ Creates Git branch: `php-migration-backup`
- ✅ Pushes branch to GitHub for cloud backup
- ✅ Preserves all your PHP migration work

### Restoration Process
- ✅ Switches to `master` branch
- ✅ Fetches latest from GitHub
- ✅ Resets working directory to original HTML version
- ✅ Removes all PHP migration changes from working directory
- ✅ Gives you clean starting point for fresh migration

## After Running the Scripts

### You Will Have:
1. **Working Directory**: Clean HTML version from GitHub
2. **Local Backup**: Complete PHP version in backup folder
3. **GitHub Branch**: `php-migration-backup` with your PHP work
4. **Clean Slate**: Ready to start fresh PHP migration

### Access Your PHP Backup:
```cmd
# View local backup
explorer C:\xampp\htdocs\regapp2_php_migration_backup

# Switch to PHP version in Git
git checkout php-migration-backup

# Return to HTML version
git checkout master
```

## Safety Features

### Multiple Confirmations
- Asks for confirmation before starting
- Asks for final confirmation before reset
- Shows clear warnings about what will be removed

### Error Handling
- Checks Git repository exists
- Verifies backup creation
- Handles existing backups
- Provides detailed error messages

### Preservation
- Never deletes without backing up first
- Creates multiple backup copies (local + GitHub)
- Preserves all commit history

## Troubleshooting

### If Script Fails:
1. Check you're in the correct directory (`regapp2`)
2. Ensure Git is installed and configured
3. Verify GitHub access (authentication)
4. Run as Administrator if permission issues

### If Backup Missing:
- Check: `C:\xampp\htdocs\regapp2_php_migration_backup\`
- Check Git branch: `git branch -a | findstr php-migration`
- Check GitHub: Look for `php-migration-backup` branch

### If HTML Files Missing After Restore:
1. Run `verify_restoration.bat`
2. Check Git status: `git status`
3. Manually fetch: `git fetch origin && git reset --hard origin/master`

## Manual Recovery (If Needed)

### Restore PHP Version:
```cmd
# Option 1: From local backup
xcopy C:\xampp\htdocs\regapp2_php_migration_backup C:\xampp\htdocs\regapp2 /E /Y

# Option 2: From Git branch
git checkout php-migration-backup
```

### Restore HTML Version:
```cmd
git checkout master
git fetch origin
git reset --hard origin/master
```

## Next Steps After Restoration

1. **Verify HTML Version Works**
   - Test the web application
   - Check all pages load correctly
   - Verify database connections

2. **Plan Fresh Migration**
   - Review what went wrong in previous migration
   - Plan step-by-step approach
   - Consider migrating one module at a time

3. **Compare with Backup When Needed**
   - Reference your PHP backup for successful patterns
   - Copy working code snippets
   - Learn from previous migration attempts

## Support

If you encounter any issues:
1. Run `verify_restoration.bat` for detailed diagnostics
2. Check the error messages in the script output
3. Manually verify Git status with `git status`
4. Check backup folder exists and contains files

Remember: Your PHP work is safely preserved in multiple locations, so there's no risk of losing your migration work!
