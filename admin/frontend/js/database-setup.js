/**
 * Database Setup Management
 * Handles database initialization and migration execution
 */

import { apiFetch } from './api.js';

class DatabaseSetupManager {
    constructor() {
        this.isSetupRunning = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadStatus();
    }
    
    setupEventListeners() {
        document.getElementById('setupBtn').addEventListener('click', () => this.runSetup());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadStatus());
    }
    
    async loadStatus() {
        try {
            this.showStatusLoading(true);
            
            const response = await apiFetch('../backend/setup_database.php', {
                method: 'GET'
            });
            
            if (response.success) {
                this.displayStatus(response.status);
            } else {
                this.showNotification('Failed to load database status: ' + response.error, 'error');
            }
            
        } catch (error) {
            console.error('Error loading status:', error);
            this.showNotification('Failed to load database status', 'error');
        } finally {
            this.showStatusLoading(false);
        }
    }
    
    displayStatus(status) {
        // Update table status
        const tableExists = status.table_exists;
        const tableStatusIcon = document.getElementById('tableStatusIcon');
        const tableStatusText = document.getElementById('tableStatusText');
        
        if (tableExists) {
            tableStatusIcon.className = 'fas fa-check-circle mr-2 text-green-500';
            tableStatusText.textContent = 'Form values table exists and is ready';
            tableStatusText.className = 'text-sm text-green-600 ml-6';
        } else {
            tableStatusIcon.className = 'fas fa-exclamation-circle mr-2 text-yellow-500';
            tableStatusText.textContent = 'Form values table not found - setup required';
            tableStatusText.className = 'text-sm text-yellow-600 ml-6';
        }
        
        // Update data counts
        if (tableExists && Object.keys(status.data_counts).length > 0) {
            document.getElementById('dataCountsSection').classList.remove('hidden');
            
            // Update count displays
            const counts = status.data_counts;
            document.getElementById('kulamCount').textContent = counts.kulam || 0;
            document.getElementById('kulaDeivamCount').textContent = counts.kulaDeivam || 0;
            document.getElementById('kaaniCount').textContent = counts.kaani || 0;
            document.getElementById('degreeCount').textContent = counts.degree || 0;
            document.getElementById('departmentCount').textContent = counts.department || 0;
            document.getElementById('institutionCount').textContent = counts.institution || 0;
            document.getElementById('companyCount').textContent = counts.company || 0;
            document.getElementById('positionCount').textContent = counts.position || 0;
            
            // Update relationships count
            document.getElementById('relationshipsCount').textContent = status.relationships_count || 0;
        } else {
            document.getElementById('dataCountsSection').classList.add('hidden');
        }
        
        // Update migration history
        if (status.migrations_executed && status.migrations_executed.length > 0) {
            document.getElementById('migrationHistorySection').classList.remove('hidden');
            this.displayMigrationHistory(status.migrations_executed);
        } else {
            document.getElementById('migrationHistorySection').classList.add('hidden');
        }
        
        // Update setup button
        const setupBtn = document.getElementById('setupBtn');
        const setupBtnText = document.getElementById('setupBtnText');
        
        if (tableExists && Object.keys(status.data_counts).length > 0) {
            setupBtnText.textContent = 'Re-run Setup';
            setupBtn.className = setupBtn.className.replace('bg-blue-600 hover:bg-blue-700', 'bg-green-600 hover:bg-green-700');
        } else {
            setupBtnText.textContent = 'Setup Database';
            setupBtn.className = setupBtn.className.replace('bg-green-600 hover:bg-green-700', 'bg-blue-600 hover:bg-blue-700');
        }
    }
    
    displayMigrationHistory(migrations) {
        const container = document.getElementById('migrationHistory');
        container.innerHTML = '';
        
        migrations.forEach(migration => {
            const migrationDiv = document.createElement('div');
            migrationDiv.className = 'flex items-center p-3 bg-gray-50 rounded-lg';
            
            const statusIcon = migration.success ? 
                '<i class="fas fa-check-circle text-green-500 mr-3"></i>' :
                '<i class="fas fa-exclamation-circle text-red-500 mr-3"></i>';
            
            const timeFormatted = new Date(migration.executed_at).toLocaleString();
            
            migrationDiv.innerHTML = `
                ${statusIcon}
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">${migration.migration_name}</div>
                    <div class="text-xs text-gray-500">${timeFormatted}</div>
                    ${migration.error_message ? `<div class="text-xs text-red-600 mt-1">${migration.error_message}</div>` : ''}
                </div>
                <div class="text-xs ${migration.success ? 'text-green-600' : 'text-red-600'} font-medium">
                    ${migration.success ? 'Success' : 'Failed'}
                </div>
            `;
            
            container.appendChild(migrationDiv);
        });
    }
    
    async runSetup() {
        if (this.isSetupRunning) return;
        
        this.isSetupRunning = true;
        this.setSetupButtonLoading(true);
        this.showSetupOutput('');
        document.getElementById('setupOutputSection').classList.remove('hidden');
        
        try {
            const response = await apiFetch('../backend/setup_database.php', {
                method: 'POST'
            });
            
            if (response.success) {
                this.showSetupOutput(response.output || 'Database setup completed successfully!');
                this.showNotification('Database setup completed successfully!', 'success');
                
                // Refresh status after successful setup
                setTimeout(() => {
                    this.loadStatus();
                }, 1000);
                
            } else {
                this.showSetupOutput(response.output || `Setup failed: ${response.error}`);
                this.showNotification(`Setup failed: ${response.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Error running setup:', error);
            this.showSetupOutput(`Setup failed: ${error.message}`);
            this.showNotification('Setup failed: Network error', 'error');
        } finally {
            this.isSetupRunning = false;
            this.setSetupButtonLoading(false);
        }
    }
    
    showStatusLoading(isLoading) {
        const statusLoading = document.getElementById('statusLoading');
        const statusContent = document.getElementById('statusContent');
        
        if (isLoading) {
            statusLoading.classList.remove('hidden');
            statusContent.classList.add('hidden');
        } else {
            statusLoading.classList.add('hidden');
            statusContent.classList.remove('hidden');
        }
    }
    
    setSetupButtonLoading(isLoading) {
        const setupBtn = document.getElementById('setupBtn');
        const setupBtnText = document.getElementById('setupBtnText');
        const setupBtnSpinner = document.getElementById('setupBtnSpinner');
        
        if (isLoading) {
            setupBtn.disabled = true;
            setupBtnText.textContent = 'Running Setup...';
            setupBtnSpinner.classList.remove('hidden');
        } else {
            setupBtn.disabled = false;
            setupBtnSpinner.classList.add('hidden');
            // Text will be updated by loadStatus()
        }
    }
    
    showSetupOutput(output) {
        const outputElement = document.getElementById('setupOutput');
        outputElement.textContent = output;
        
        // Auto-scroll to bottom
        outputElement.scrollTop = outputElement.scrollHeight;
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');
        const notificationDiv = notification.firstElementChild;
        
        // Set message
        messageElement.textContent = message;
        
        // Set color based on type
        if (type === 'error') {
            notificationDiv.className = 'bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center';
            notificationDiv.querySelector('i').className = 'fas fa-exclamation-circle mr-2';
        } else {
            notificationDiv.className = 'bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center';
            notificationDiv.querySelector('i').className = 'fas fa-check-circle mr-2';
        }
        
        // Show notification
        notification.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the database setup manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DatabaseSetupManager();
});
