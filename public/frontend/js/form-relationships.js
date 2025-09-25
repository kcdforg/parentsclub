/**
 * Form Relationships Manager
 * Handles dynamic dropdown relationships and autocomplete filtering
 */

import { apiFetch } from './api.js';

export class FormRelationshipsManager {
    constructor() {
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
        this.isLoaded = false;
        
        this.init();
    }
    
    async init() {
        await this.loadFormValues();
        this.setupRelationshipListeners();
    }
    
    async loadFormValues() {
        try {
            // Use fallback data for now since admin API access is causing issues
            console.log('Loading fallback form data...');
            this.loadFallbackData();
            
        } catch (error) {
            console.log('Error loading form values, using fallback data');
            this.loadFallbackData();
        }
    }
    
    loadFallbackData() {
        // Fallback data with relationships
        this.formValues = {
            kulam: [
                { id: 1, value: 'Agastyar' },
                { id: 2, value: 'Kasyapar' },
                { id: 3, value: 'Vashishtar' },
                { id: 4, value: 'Bharadwajar' },
                { id: 5, value: 'Gautamar' }
            ],
            kulaDeivam: [
                { id: 10, value: 'Murugan' },
                { id: 11, value: 'Ganesha' },
                { id: 12, value: 'Shiva' },
                { id: 13, value: 'Vishnu' },
                { id: 14, value: 'Devi' }
            ],
            kaani: [
                { id: 20, value: 'Murugan Kaani 1', parent_id: 10 },
                { id: 21, value: 'Murugan Kaani 2', parent_id: 10 },
                { id: 22, value: 'Ganesha Kaani 1', parent_id: 11 },
                { id: 23, value: 'Ganesha Kaani 2', parent_id: 11 },
                { id: 24, value: 'Shiva Kaani 1', parent_id: 12 },
                { id: 25, value: 'Devi Kaani 1', parent_id: 14 }
            ],
            degree: [
                { id: 30, value: 'Bachelor of Engineering' },
                { id: 31, value: 'Master of Engineering' },
                { id: 32, value: 'Bachelor of Technology' },
                { id: 33, value: 'Bachelor of Science' },
                { id: 34, value: 'Master of Science' }
            ],
            department: [
                { id: 40, value: 'Computer Science Engineering', parent_id: 30 },
                { id: 41, value: 'Electronics and Communication', parent_id: 30 },
                { id: 42, value: 'Mechanical Engineering', parent_id: 30 },
                { id: 43, value: 'Advanced Computer Science', parent_id: 31 },
                { id: 44, value: 'Information Technology', parent_id: 32 },
                { id: 45, value: 'Mathematics', parent_id: 33 },
                { id: 46, value: 'Physics', parent_id: 33 },
                { id: 47, value: 'Advanced Mathematics', parent_id: 34 }
            ],
            institution: [
                { id: 50, value: 'Anna University' },
                { id: 51, value: 'IIT Madras' },
                { id: 52, value: 'VIT University' }
            ],
            company: [
                { id: 60, value: 'TCS' },
                { id: 61, value: 'Infosys' },
                { id: 62, value: 'Google' }
            ],
            position: [
                { id: 70, value: 'Software Engineer' },
                { id: 71, value: 'Senior Software Engineer' },
                { id: 72, value: 'Tech Lead' }
            ]
        };
        
        // Build relationships
        this.relationships.kaani = {};
        this.relationships.department = {};
        
        this.formValues.kaani.forEach(item => {
            if (item.parent_id) {
                if (!this.relationships.kaani[item.parent_id]) {
                    this.relationships.kaani[item.parent_id] = [];
                }
                this.relationships.kaani[item.parent_id].push(item);
            }
        });
        
        this.formValues.department.forEach(item => {
            if (item.parent_id) {
                if (!this.relationships.department[item.parent_id]) {
                    this.relationships.department[item.parent_id] = [];
                }
                this.relationships.department[item.parent_id].push(item);
            }
        });
        
        this.isLoaded = true;
        this.populateAllDropdowns();
    }
    
    populateAllDropdowns() {
        // Populate Kulam dropdowns
        this.populateDropdownsByClass('kulam-dropdown', this.formValues.kulam);
        this.populateDropdownsByClass('kula-deivam-dropdown', this.formValues.kulaDeivam);
        
        // Populate Education datalists
        this.populateDatalistsByClass('degree-datalist', this.formValues.degree);
        this.populateDatalistsByClass('institution-datalist', this.formValues.institution);
        
        // Populate Profession datalists
        this.populateDatalistsByClass('company-datalist', this.formValues.company);
        this.populateDatalistsByClass('position-datalist', this.formValues.position);
        
        // Setup initial Kaani and Department dropdowns
        this.populateInitialRelatedDropdowns();
    }
    
    populateDropdownsByClass(className, options) {
        const dropdowns = document.querySelectorAll(`.${className}`);
        dropdowns.forEach(dropdown => {
            this.populateDropdown(dropdown, options);
        });
    }
    
    populateDatalistsByClass(className, options) {
        const datalists = document.querySelectorAll(`.${className}`);
        datalists.forEach(datalist => {
            this.populateDatalist(datalist, options);
        });
    }
    
    populateDropdown(selectElement, options) {
        if (!selectElement) return;
        
        // Keep existing options (like "Select..." and "other")
        const existingOptions = Array.from(selectElement.options).filter(option => 
            option.value === '' || option.value === 'other'
        );
        
        // Clear and re-add
        selectElement.innerHTML = '';
        existingOptions.forEach(option => selectElement.appendChild(option));
        
        // Add new options
        options.forEach(item => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.value;
            selectElement.appendChild(option);
        });
    }
    
    populateDatalist(datalistElement, options) {
        if (!datalistElement) return;
        
        datalistElement.innerHTML = '';
        options.forEach(item => {
            const option = document.createElement('option');
            option.value = item.value;
            datalistElement.appendChild(option);
        });
    }
    
    populateInitialRelatedDropdowns() {
        // Setup Kaani dropdowns based on current Kula Deivam selections
        const kulaDeivamDropdowns = document.querySelectorAll('.kula-deivam-dropdown');
        kulaDeivamDropdowns.forEach(dropdown => {
            if (dropdown.value) {
                this.updateRelatedKaaniDropdown(dropdown);
            }
        });
        
        // Setup Department datalists based on current Degree selections
        const degreeInputs = document.querySelectorAll('.degree-input');
        degreeInputs.forEach(input => {
            if (input.value) {
                this.updateRelatedDepartmentDatalist(input);
            }
        });
    }
    
    setupRelationshipListeners() {
        // Use event delegation for dynamically added elements
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('kula-deivam-dropdown')) {
                this.updateRelatedKaaniDropdown(e.target);
            }
        });
        
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('degree-input')) {
                this.updateRelatedDepartmentDatalist(e.target);
            }
        });
    }
    
    updateRelatedKaaniDropdown(kulaDeivamDropdown) {
        if (!this.isLoaded) return;
        
        const selectedKulaDeivam = kulaDeivamDropdown.value;
        
        // Find the related Kaani dropdown
        const kaaniDropdownId = kulaDeivamDropdown.id.replace('KulaDeivam', 'Kaani');
        const kaaniDropdown = document.getElementById(kaaniDropdownId);
        
        if (!kaaniDropdown) return;
        
        // Clear current Kaani options (except default ones)
        const defaultOptions = Array.from(kaaniDropdown.options).filter(option => 
            option.value === '' || option.value === 'other'
        );
        kaaniDropdown.innerHTML = '';
        defaultOptions.forEach(option => kaaniDropdown.appendChild(option));
        
        if (selectedKulaDeivam && selectedKulaDeivam !== 'other') {
            // Find the Kula Deivam ID
            const kulaDeivamItem = this.formValues.kulaDeivam.find(item => item.value === selectedKulaDeivam);
            if (kulaDeivamItem) {
                const relatedKaanis = this.relationships.kaani[kulaDeivamItem.id] || [];
                
                // Add related Kaani options
                relatedKaanis.forEach(kaani => {
                    const option = document.createElement('option');
                    option.value = kaani.value;
                    option.textContent = kaani.value;
                    kaaniDropdown.appendChild(option);
                });
            }
        }
    }
    
    updateRelatedDepartmentDatalist(degreeInput) {
        if (!this.isLoaded) return;
        
        const selectedDegree = degreeInput.value.trim();
        
        // Find the related department datalist
        const departmentDatalistId = degreeInput.getAttribute('list').replace('degree', 'department');
        const departmentDatalist = document.getElementById(departmentDatalistId);
        
        if (!departmentDatalist) return;
        
        // Clear current options
        departmentDatalist.innerHTML = '';
        
        if (selectedDegree) {
            // Find exact or partial match for degree
            const degreeItem = this.formValues.degree.find(item => 
                item.value.toLowerCase() === selectedDegree.toLowerCase()
            );
            
            if (degreeItem) {
                const relatedDepartments = this.relationships.department[degreeItem.id] || [];
                
                // Add related department options
                relatedDepartments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.value;
                    departmentDatalist.appendChild(option);
                });
            } else {
                // If no exact match, show all departments
                this.formValues.department.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.value;
                    departmentDatalist.appendChild(option);
                });
            }
        }
    }
    
    // Helper method to get all available values for a type
    getAvailableValues(type) {
        return this.formValues[type] || [];
    }
    
    // Helper method to get related values
    getRelatedValues(parentType, parentValue, childType) {
        if (!this.relationships[childType]) return [];
        
        const parentItem = this.formValues[parentType].find(item => item.value === parentValue);
        if (!parentItem) return [];
        
        return this.relationships[childType][parentItem.id] || [];
    }
}

// Create a global instance
export const formRelationships = new FormRelationshipsManager();
