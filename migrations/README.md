# Database Migrations

This directory contains database migration scripts and tools for the Form Values system.

## Overview

The migration system provides a structured way to:
- Set up the `form_values` table with proper schema
- Populate initial data for dropdown options
- Establish relationships between Kula Deivam ↔ Kaani and Degree ↔ Department
- Track migration execution status
- Handle rollbacks and re-runs safely

## Files

### Migration Scripts
- `001_create_form_values_table.sql` - Main migration that creates the table and populates initial data

### Tools
- `run_migration.php` - Migration runner with CLI and web interface
- `README.md` - This documentation file

## Quick Start

### Option 1: Command Line (Recommended)
```bash
# Navigate to migrations directory
cd migrations/

# Run all pending migrations
php run_migration.php run

# Check migration status
php run_migration.php status
```

### Option 2: Web Interface
```
# Run migrations via web browser
http://yoursite.com/migrations/run_migration.php?action=run

# Check status via web browser  
http://yoursite.com/migrations/run_migration.php?action=status
```

### Option 3: Direct SQL Execution
```bash
# Execute SQL file directly (not recommended for production)
mysql -u username -p database_name < 001_create_form_values_table.sql
```

## Migration Commands

### Run All Migrations
```bash
php run_migration.php run
```
Executes all `.sql` files in the migrations directory in alphabetical order. Skips already executed migrations.

### Check Migration Status
```bash
php run_migration.php status
```
Shows which migrations have been executed, when, and their success status.

### Run Single Migration
```bash
php run_migration.php single 001_create_form_values_table
```
Executes a specific migration file.

### Reset Migration
```bash
php run_migration.php reset 001_create_form_values_table
```
Marks a migration as not executed, allowing it to be run again.

## What Gets Created

### Database Table
```sql
form_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,           -- 'kulam', 'kulaDeivam', 'kaani', etc.
    value VARCHAR(255) NOT NULL,         -- The actual value
    parent_id INT NULL,                  -- For relationships (Kaani → Kula Deivam)
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE KEY unique_type_value (type, value),
    INDEX idx_type (type),
    INDEX idx_parent (parent_id),
    FOREIGN KEY (parent_id) REFERENCES form_values(id) ON DELETE SET NULL
)
```

### Initial Data Counts
After successful migration, you should have:
- **12 Kulam values** (Agastya, Angirasa, Atri, Bharadwaja, etc.)
- **10 Kula Deivam values** (Murugan, Ganesha, Shiva, Vishnu, etc.)
- **20+ Kaani values** (with relationships to Kula Deivam)
- **20 Degree values** (Bachelor of Engineering, Master of Engineering, etc.)
- **40+ Department values** (with relationships to Degrees)
- **30+ Institution values** (Anna University, IIT Madras, etc.)
- **50+ Company values** (TCS, Infosys, Google, Government, etc.)
- **100+ Position values** (Software Engineer, Manager, etc.)

### Relationships Established
- **Kula Deivam → Kaani**: Each Kaani is linked to a specific Kula Deivam
  - Murugan → Palani, Tiruchendur, Thiruparankundram, etc.
  - Ganesha → Pillayarpatti, Thiruvindalur, etc.
  - Shiva → Chidambaram, Madurai Meenakshi, etc.
  
- **Degree → Department**: Each Department is linked to specific Degrees
  - Bachelor of Engineering → Computer Science Engineering, Mechanical Engineering, etc.
  - Bachelor of Science → Mathematics, Physics, Chemistry, etc.
  - MBA → Marketing, Finance, Human Resources, etc.

## Migration Tracking

The system automatically creates a `migrations` table to track:
- Which migrations have been executed
- When they were executed
- Success/failure status
- Error messages for failed migrations

This prevents:
- Re-running the same migration accidentally
- Data duplication
- Inconsistent database states

## Safety Features

### Transaction Safety
- Each migration runs in a database transaction
- If any part fails, the entire migration is rolled back
- Database remains in consistent state

### Idempotent Design
- Migrations can be run multiple times safely
- Already executed migrations are automatically skipped
- Uses `CREATE TABLE IF NOT EXISTS` and `INSERT ... ON DUPLICATE KEY UPDATE`

### Error Handling
- Detailed error messages for debugging
- Failed migrations are logged with error details
- Partial failures don't corrupt the database

## Troubleshooting

### Migration Fails with Foreign Key Error
If you get foreign key constraint errors:
```bash
# Reset the migration and try again
php run_migration.php reset 001_create_form_values_table
php run_migration.php single 001_create_form_values_table
```

### Permission Denied Errors
Ensure your database user has the following privileges:
- CREATE (for tables and indexes)
- INSERT (for data)
- SELECT (for checking existing data)
- ALTER (for table modifications)

### Character Set Issues
The migration uses `utf8mb4` character set for proper unicode support. Ensure your database supports this:
```sql
ALTER DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Verification

After running migrations, verify the setup:

```sql
-- Check table structure
DESCRIBE form_values;

-- Check data counts
SELECT type, COUNT(*) as count 
FROM form_values 
GROUP BY type 
ORDER BY type;

-- Check relationships
SELECT 
    kd.value as kula_deivam,
    COUNT(k.id) as kaani_count
FROM form_values kd
LEFT JOIN form_values k ON k.parent_id = kd.id AND k.type = 'kaani'
WHERE kd.type = 'kulaDeivam'
GROUP BY kd.id, kd.value
ORDER BY kd.value;
```

## Integration with Application

After successful migration:

1. **Admin Form Values Page**: Will load data from the database
2. **Profile Completion Forms**: Will use these values for dropdowns and autocomplete
3. **Relationship Features**: Kula Deivam → Kaani and Degree → Department filtering will work
4. **API Endpoints**: `/admin/backend/form_values.php` will return this data

## Backup Recommendation

Before running migrations in production:
```bash
# Create backup
mysqldump -u username -p database_name > backup_before_migration.sql

# Run migration
php run_migration.php run

# Verify everything works
# If issues, restore from backup:
# mysql -u username -p database_name < backup_before_migration.sql
```

## Adding New Migrations

For future database changes:

1. Create new SQL file with incremental number: `002_add_new_feature.sql`
2. Follow the same structure as existing migrations
3. Use `IF NOT EXISTS` and other safe patterns
4. Test thoroughly in development first
5. Run `php run_migration.php run` to execute

## Support

If you encounter issues:
1. Check the migration status: `php run_migration.php status`
2. Review error messages in the output
3. Verify database permissions and connectivity
4. Check the `migrations` table for detailed error logs
