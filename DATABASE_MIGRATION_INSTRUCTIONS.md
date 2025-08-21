# Database Migration Instructions

## Overview
This migration adds the necessary tables and columns to support the new vertical profile completion form with expandable sections and intro questions on a single page.

## Migration Files
- `database/family_tables_migration.sql` - Main migration file

## How to Apply Migration

### Option 1: Using phpMyAdmin
1. Open phpMyAdmin in your browser
2. Select the `regapp_db` database
3. Go to the "SQL" tab
4. Copy and paste the contents of `database/family_tables_migration.sql`
5. Click "Go" to execute

### Option 2: Using MySQL Command Line
```bash
mysql -u your_username -p regapp_db < database/family_tables_migration.sql
```

### Option 3: Using XAMPP MySQL Console
1. Open XAMPP Control Panel
2. Click "Shell" to open command line
3. Navigate to your project directory
4. Run: `mysql -u root regapp_db < database/family_tables_migration.sql`

## Changes Made

### 1. GetIntro.html Updates
- **All questions on same page**: Gender, marriage status, and children questions now appear on the same page
- **Conditional logic**: Children question only shows for married users, all questions hidden for "others" gender
- **Immediate database saving**: Form submits all answers at once to `intro_questions.php`
- **Better UX**: Real-time validation and loading states

### 2. Profile_completion.html Updates
- **Vertical layout**: Replaced step-by-step navigation with expandable sections
- **Numbered sections**: 
  1. Member Details
  2. Spouse Details (conditional)
  3. Children Details (conditional) 
  4. Member Family Tree
  5. Spouse Family Tree (conditional)
- **Individual section saving**: Each section can be saved independently
- **Expandable subsections**: Family trees have expandable parents/grandparents sections
- **Progress tracking**: Visual indicators show completion status

### 3. Database Schema Updates
- **user_profiles table**: Added intro questions fields, profile completion tracking
- **spouse_details table**: New table for spouse information
- **children_details table**: New table for children information
- **family_tree table**: New table for family lineage (both member and spouse)

### 4. Backend API Updates
- **New endpoints**: Individual handlers for each section (member_details, spouse_details, etc.)
- **Backward compatibility**: Existing endpoints still work
- **Better error handling**: More specific error messages and validation

## Testing Checklist

### GetIntro.html Testing
- [ ] All questions display on same page
- [ ] Gender selection shows/hides appropriate questions
- [ ] Marriage status shows/hides children question
- [ ] Form submission saves to database
- [ ] Redirects to profile completion after success

### Profile_completion.html Testing
- [ ] Sections expand/collapse properly
- [ ] Member details section saves correctly
- [ ] Spouse section only appears for married users
- [ ] Children section only appears for users with children
- [ ] Family tree subsections expand/collapse
- [ ] Final submit button enables when all required sections complete
- [ ] Data persists between page reloads

### Database Testing
- [ ] Migration runs without errors
- [ ] All new tables created
- [ ] Data saves correctly in new structure
- [ ] Foreign key constraints work
- [ ] Conditional sections respect intro answers

## Notes
- The migration is designed to be safe and non-destructive
- Existing data remains intact
- New columns have appropriate defaults
- All changes use `IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS` for safety

## Rollback (if needed)
If you need to rollback the changes:
1. Remove the new tables: `DROP TABLE IF EXISTS spouse_details, children_details, family_tree`
2. Remove new columns from user_profiles (more complex, backup recommended before migration)

## Support
If you encounter any issues:
1. Check the error logs in your PHP/MySQL setup
2. Verify all files are in the correct locations
3. Ensure proper file permissions
4. Check database connection settings
