/**
 * Form Values Management
 * Handles CRUD operations for form dropdown values and autocomplete suggestions
 */

import { apiFetch } from './api.js';

class FormValuesManager {
    constructor() {
        this.currentSection = '';
        this.currentType = '';
        this.formValues = {
            kulam: [],
            kulaDeivam: [],
            kaani: [],
            degree: [],
            department: [],
            institution: [],
            company: [],
            position: []
        };
        this.relationships = {
            kaani: {},
            department: {}
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadFormValues();
    }
    
    setupEventListeners() {
        // Add item buttons
        document.querySelectorAll('.add-kulam-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('kulam'));
        });
        
        document.querySelectorAll('.add-kulaDeivam-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('kulaDeivam'));
        });
        
        document.querySelectorAll('.add-kaani-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('kaani'));
        });
        
        document.querySelectorAll('.add-degree-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('degree'));
        });
        
        document.querySelectorAll('.add-department-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('department'));
        });
        
        document.querySelectorAll('.add-institution-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('institution'));
        });
        
        document.querySelectorAll('.add-company-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('company'));
        });
        
        document.querySelectorAll('.add-position-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddModal('position'));
        });
        
        // Modal event listeners
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelAdd').addEventListener('click', () => this.closeModal());
        document.getElementById('addItemForm').addEventListener('submit', (e) => this.handleAddItem(e));
        
        // Close modal on backdrop click
        document.getElementById('addItemModal').addEventListener('click', (e) => {
            if (e.target.id === 'addItemModal') {
                this.closeModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('addItemModal').classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }
    
    async loadFormValues() {
        try {
            this.showLoading();
            
            // Load all form values from the backend
            const response = await apiFetch('form_values.php', {
                method: 'GET'
            });
            
            if (response.success) {
                this.formValues = response.data;
                this.relationships = response.relationships || { kaani: {}, department: {} };
            } else {
                // Fallback to placeholder data if backend is not set up
                this.loadPlaceholderData();
            }
            
            this.renderAllValues();
            
        } catch (error) {
            console.error('Error loading form values:', error);
            // Fallback to placeholder data on error
            this.loadPlaceholderData();
            this.renderAllValues();
            this.showNotification('Using demo data - backend not configured', 'info');
        } finally {
            this.hideLoading();
        }
    }
    
    loadPlaceholderData() {
        // Placeholder data for demonstration
        this.formValues = {
            kulam: [
                { id: 1, value: 'Agastyar' },
                { id: 2, value: 'Kasyapar' },
                { id: 3, value: 'Vashishtar' },
                { id: 4, value: 'Bharadwajar' },
                { id: 5, value: 'Gautamar' }
            ],
            kulaDeivam: [
                { id: 1, value: 'Murugan' },
                { id: 2, value: 'Ganesha' },
                { id: 3, value: 'Shiva' },
                { id: 4, value: 'Vishnu' },
                { id: 5, value: 'Devi' }
            ],
            kaani: [
                { id: 1, value: 'Kaani 1' },
                { id: 2, value: 'Kaani 2' },
                { id: 3, value: 'Kaani 3' },
                { id: 4, value: 'Kaani 4' },
                { id: 5, value: 'Kaani 5' }
            ],
            degree: [
                { id: 1, value: 'Bachelor of Engineering' },
                { id: 2, value: 'Master of Engineering' },
                { id: 3, value: 'Bachelor of Technology' },
                { id: 4, value: 'Master of Technology' },
                { id: 5, value: 'Bachelor of Science' },
                { id: 6, value: 'Master of Science' },
                { id: 7, value: 'Bachelor of Arts' },
                { id: 8, value: 'Master of Arts' },
                { id: 9, value: 'Bachelor of Commerce' },
                { id: 10, value: 'Master of Commerce' }
            ],
            department: [
                { id: 1, value: 'Computer Science Engineering' },
                { id: 2, value: 'Electronics and Communication' },
                { id: 3, value: 'Mechanical Engineering' },
                { id: 4, value: 'Civil Engineering' },
                { id: 5, value: 'Information Technology' },
                { id: 6, value: 'Mathematics' },
                { id: 7, value: 'Physics' },
                { id: 8, value: 'Chemistry' },
                { id: 9, value: 'English Literature' },
                { id: 10, value: 'History' }
            ],
            institution: [
                { id: 1, value: 'Anna University' },
                { id: 2, value: 'IIT Madras' },
                { id: 3, value: 'IIT Delhi' },
                { id: 4, value: 'IISc Bangalore' },
                { id: 5, value: 'VIT University' },
                { id: 6, value: 'SRM University' },
                { id: 7, value: 'Madras University' },
                { id: 8, value: 'Bharathiar University' },
                { id: 9, value: 'Madurai Kamaraj University' },
                { id: 10, value: 'Periyar University' }
            ],
            company: [
                { id: 1, value: 'TCS' },
                { id: 2, value: 'Infosys' },
                { id: 3, value: 'Wipro' },
                { id: 4, value: 'Cognizant' },
                { id: 5, value: 'HCL Technologies' },
                { id: 6, value: 'Tech Mahindra' },
                { id: 7, value: 'Google' },
                { id: 8, value: 'Microsoft' },
                { id: 9, value: 'Amazon' },
                { id: 10, value: 'IBM' }
            ],
            position: [
                { id: 1, value: 'Software Engineer' },
                { id: 2, value: 'Senior Software Engineer' },
                { id: 3, value: 'Tech Lead' },
                { id: 4, value: 'Engineering Manager' },
                { id: 5, value: 'Project Manager' },
                { id: 6, value: 'Product Manager' },
                { id: 7, value: 'Business Analyst' },
                { id: 8, value: 'Data Scientist' },
                { id: 9, value: 'DevOps Engineer' },
                { id: 10, value: 'QA Engineer' }
            ]
        };
    }
    
    renderAllValues() {
        Object.keys(this.formValues).forEach(type => {
            this.renderValues(type);
        });
    }
    
    renderValues(type) {
        const container = document.getElementById(`${type}Container`);
        if (!container) return;
        
        const values = this.formValues[type] || [];
        
        container.innerHTML = values.map(item => `
            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <span class="text-sm text-gray-900">${this.escapeHtml(item.value)}</span>
                <div class="flex items-center space-x-2">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-type="${type}" data-id="${item.id}" data-value="${this.escapeHtml(item.value)}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-type="${type}" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for edit and delete buttons
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editItem(btn.dataset.type, btn.dataset.id, btn.dataset.value));
        });
        
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteItem(btn.dataset.type, btn.dataset.id));
        });
    }
    
    openAddModal(type) {
        this.currentType = type;
        this.currentSection = '';
        
        const modal = document.getElementById('addItemModal');
        const title = document.getElementById('modalTitle');
        const hint = document.getElementById('itemHint');
        const form = document.getElementById('addItemForm');
        const input = document.getElementById('itemValue');
        
        // Set modal title and hint based on type
        const typeLabels = {
            kulam: 'Kulam',
            kulaDeivam: 'Kula Deivam',
            kaani: 'Kaani',
            degree: 'Degree',
            department: 'Department',
            institution: 'Institution',
            company: 'Company',
            position: 'Position/Role'
        };
        
        title.textContent = `Add New ${typeLabels[type]}`;
        hint.textContent = `Enter the ${typeLabels[type].toLowerCase()} value to be displayed in the dropdown`;
        
        // Reset form
        form.reset();
        input.focus();
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    closeModal() {
        const modal = document.getElementById('addItemModal');
        modal.classList.add('hidden');
        this.currentType = '';
        this.currentSection = '';
    }
    
    async handleAddItem(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const value = formData.get('itemValue').trim();
        
        if (!value) {
            this.showNotification('Please enter a value', 'error');
            return;
        }
        
        // Check for duplicates
        const existingValues = this.formValues[this.currentType] || [];
        if (existingValues.some(item => item.value.toLowerCase() === value.toLowerCase())) {
            this.showNotification('This value already exists', 'error');
            return;
        }
        
        try {
            this.setSubmitLoading(true);
            
            // Try to add via API
            try {
                const response = await apiFetch('../backend/form_values.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: this.currentType,
                        value: value
                    })
                });
                
                if (response.success) {
                    // Add to local data
                    this.formValues[this.currentType].push(response.data);
                    this.renderValues(this.currentType);
                    this.showNotification('Value added successfully', 'success');
                    this.closeModal();
                } else {
                    this.showNotification(response.error || 'Failed to add value', 'error');
                }
            } catch (apiError) {
                // Fallback to local storage for demo
                const newItem = {
                    id: Date.now(),
                    value: value
                };
                
                this.formValues[this.currentType].push(newItem);
                this.renderValues(this.currentType);
                this.showNotification('Value added successfully (demo mode)', 'success');
                this.closeModal();
            }
            
        } catch (error) {
            console.error('Error adding item:', error);
            this.showNotification('Failed to add value', 'error');
        } finally {
            this.setSubmitLoading(false);
        }
    }
    
    async editItem(type, id, currentValue) {
        const newValue = prompt(`Edit ${type}:`, currentValue);
        if (newValue === null || newValue.trim() === '') return;
        
        const trimmedValue = newValue.trim();
        
        // Check for duplicates (excluding current item)
        const existingValues = this.formValues[type] || [];
        if (existingValues.some(item => item.id != id && item.value.toLowerCase() === trimmedValue.toLowerCase())) {
            this.showNotification('This value already exists', 'error');
            return;
        }
        
        try {
            // Try to update via API
            try {
                const response = await apiFetch('../backend/form_values.php', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: id,
                        value: trimmedValue
                    })
                });
                
                if (response.success) {
                    // Update local data
                    const itemIndex = this.formValues[type].findIndex(item => item.id == id);
                    if (itemIndex !== -1) {
                        this.formValues[type][itemIndex].value = trimmedValue;
                        this.renderValues(type);
                        this.showNotification('Value updated successfully', 'success');
                    }
                } else {
                    this.showNotification(response.error || 'Failed to update value', 'error');
                }
            } catch (apiError) {
                // Fallback to local storage for demo
                const itemIndex = this.formValues[type].findIndex(item => item.id == id);
                if (itemIndex !== -1) {
                    this.formValues[type][itemIndex].value = trimmedValue;
                    this.renderValues(type);
                    this.showNotification('Value updated successfully (demo mode)', 'success');
                }
            }
            
        } catch (error) {
            console.error('Error updating item:', error);
            this.showNotification('Failed to update value', 'error');
        }
    }
    
    async deleteItem(type, id) {
        if (!confirm('Are you sure you want to delete this value?')) return;
        
        try {
            // Try to delete via API
            try {
                const response = await apiFetch(`../backend/form_values.php?id=${id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    // Remove from local data
                    this.formValues[type] = this.formValues[type].filter(item => item.id != id);
                    this.renderValues(type);
                    this.showNotification('Value deleted successfully', 'success');
                } else {
                    this.showNotification(response.error || 'Failed to delete value', 'error');
                }
            } catch (apiError) {
                // Fallback to local storage for demo
                this.formValues[type] = this.formValues[type].filter(item => item.id != id);
                this.renderValues(type);
                this.showNotification('Value deleted successfully (demo mode)', 'success');
            }
            
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showNotification('Failed to delete value', 'error');
        }
    }
    
    setSubmitLoading(isLoading) {
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');
        const submitBtn = document.querySelector('#addItemForm button[type="submit"]');
        
        if (isLoading) {
            submitText.textContent = 'Adding...';
            submitSpinner.classList.remove('hidden');
            submitBtn.disabled = true;
        } else {
            submitText.textContent = 'Add Item';
            submitSpinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }
    
    showLoading() {
        // You can implement a loading indicator here
        console.log('Loading form values...');
    }
    
    hideLoading() {
        // Hide loading indicator
        console.log('Form values loaded');
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
        } else if (type === 'info') {
            notificationDiv.className = 'bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center';
            notificationDiv.querySelector('i').className = 'fas fa-info-circle mr-2';
        } else {
            notificationDiv.className = 'bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center';
            notificationDiv.querySelector('i').className = 'fas fa-check-circle mr-2';
        }
        
        // Show notification
        notification.classList.remove('hidden');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the form values manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FormValuesManager();
});
