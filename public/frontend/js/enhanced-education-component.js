/**
 * Enhanced Education Component
 * Handles the new education flow with Education Status and Education Level dropdowns
 */

class EnhancedEducationComponent {
    constructor(containerPrefix = 'member', childIndex = null) {
        this.containerPrefix = containerPrefix;
        this.childIndex = childIndex;
        this.educationCounter = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Education button listener
        const addBtn = document.getElementById(`add${this.containerPrefix.charAt(0).toUpperCase() + this.containerPrefix.slice(1)}EducationBtn`);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addEducationEntry());
        }
    }

    addEducationEntry() {
        const containerSuffix = this.childIndex ? `_${this.childIndex}` : '';
        const container = document.getElementById(`${this.containerPrefix}EducationContainer${containerSuffix}`);
        if (!container) return;

        const entryId = this.childIndex ? 
            `${this.containerPrefix}_${this.childIndex}_education_${this.educationCounter}` :
            `${this.containerPrefix}_education_${this.educationCounter}`;
            
        const educationHtml = this.generateEducationHTML(entryId, this.educationCounter);
        
        const entryDiv = document.createElement('div');
        entryDiv.id = entryId;
        entryDiv.className = 'education-entry bg-gray-50 p-4 rounded-lg mb-4 border';
        entryDiv.innerHTML = educationHtml;
        
        container.appendChild(entryDiv);
        
        // Setup change listeners for this entry
        this.setupEntryListeners(entryId);
        
        this.educationCounter++;
    }

    generateEducationHTML(entryId, counter) {
        const prefix = this.containerPrefix;
        
        return `
            <div class="flex justify-between items-center mb-4">
                <h5 class="font-semibold text-gray-800">Education ${counter}</h5>
                <button type="button" onclick="removeEducationEntry('${entryId}')" 
                        class="text-red-600 hover:text-red-800 text-sm">
                    <i class="fas fa-trash mr-1"></i>Remove
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Education Status -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Education Status *</label>
                    <select name="${prefix}_education_status_${counter}" 
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onchange="handleEducationStatusChange('${entryId}', this.value)">
                        <option value="">Select Status</option>
                        <option value="completed">Completed</option>
                        <option value="pursuing">Pursuing</option>
                        <option value="illiterate">Illiterate</option>
                    </select>
                </div>
                
                <!-- Education Level -->
                <div id="${entryId}_level_container" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Education Level *</label>
                    <select name="${prefix}_education_level_${counter}" 
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onchange="handleEducationLevelChange('${entryId}', this.value)">
                        <option value="">Select Level</option>
                        <option value="school">School</option>
                        <option value="college">College</option>
                    </select>
                </div>
            </div>
            
            <!-- Dynamic fields container -->
            <div id="${entryId}_dynamic_fields"></div>
        `;
    }

    setupEntryListeners(entryId) {
        // Event listeners are handled via onchange attributes in HTML
        // This method can be extended for additional listeners if needed
    }

    static removeEducationEntry(entryId) {
        const entry = document.getElementById(entryId);
        if (entry) {
            entry.remove();
        }
    }

    // Static methods for global access
    static handleEducationStatusChange(entryId, status) {
        const levelContainer = document.getElementById(`${entryId}_level_container`);
        const dynamicFieldsContainer = document.getElementById(`${entryId}_dynamic_fields`);
        const addEducationBtn = document.getElementById(`add${entryId.split('_')[0].charAt(0).toUpperCase() + entryId.split('_')[0].slice(1)}EducationBtn`);
        
        if (status === 'illiterate') {
            // Hide all other fields for illiterate
            levelContainer.classList.add('hidden');
            dynamicFieldsContainer.innerHTML = '';
            
            // Hide Add Education button if this is the only entry
            const container = document.getElementById(`${entryId.split('_')[0]}EducationContainer`);
            const entries = container.querySelectorAll('.education-entry');
            if (entries.length === 1 && addEducationBtn) {
                addEducationBtn.style.display = 'none';
                addEducationBtn.disabled = true;
            }
            
            // Show illiterate message
            dynamicFieldsContainer.innerHTML = `
                <div class="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
                    <i class="fas fa-info-circle text-gray-500 text-2xl mb-2"></i>
                    <p class="text-gray-600 font-medium">No additional education details required</p>
                    <p class="text-gray-500 text-sm">Status: Illiterate</p>
                </div>
            `;
        } else if (status === 'completed' || status === 'pursuing') {
            // Show education level dropdown
            levelContainer.classList.remove('hidden');
            dynamicFieldsContainer.innerHTML = '';
            
            // Show Add Education button
            if (addEducationBtn) {
                addEducationBtn.style.display = 'inline-flex';
                addEducationBtn.disabled = false;
            }
        } else {
            // Clear everything for empty selection
            levelContainer.classList.add('hidden');
            dynamicFieldsContainer.innerHTML = '';
            
            // Show Add Education button
            if (addEducationBtn) {
                addEducationBtn.style.display = 'inline-flex';
                addEducationBtn.disabled = false;
            }
        }
    }

    static handleEducationLevelChange(entryId, level) {
        const dynamicFieldsContainer = document.getElementById(`${entryId}_dynamic_fields`);
        const statusSelect = document.querySelector(`#${entryId} select[name*="_education_status_"]`);
        const status = statusSelect ? statusSelect.value : '';
        
        if (!level || !status || status === 'illiterate') {
            dynamicFieldsContainer.innerHTML = '';
            return;
        }

        let fieldsHtml = '';
        
        if (level === 'school') {
            fieldsHtml = EnhancedEducationComponent.generateSchoolFields(entryId, status);
        } else if (level === 'college') {
            fieldsHtml = EnhancedEducationComponent.generateCollegeFields(entryId, status);
        }
        
        dynamicFieldsContainer.innerHTML = fieldsHtml;
        
        // Initialize auto-suggestions for school fields
        if (level === 'school') {
            EnhancedEducationComponent.initializeSchoolAutoSuggestions(entryId);
        }
    }

    static generateSchoolFields(entryId, status) {
        const prefix = entryId.split('_education_')[0];
        const counter = entryId.split('_').pop();
        
        let fields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- School Name -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                    <input type="text" name="${prefix}_school_name_${counter}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Enter school name">
                    <div id="${entryId}_school_suggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden max-h-40 overflow-y-auto"></div>
                </div>
                
                <!-- Board -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Board *</label>
                    <select name="${prefix}_board_${counter}" 
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Board</option>
                        <option value="stateboard">State Board</option>
                        <option value="cbse">CBSE</option>
                        <option value="icse">ICSE</option>
                        <option value="others">Others</option>
                    </select>
                </div>
            </div>
        `;

        if (status === 'pursuing') {
            fields += `
                <div class="grid grid-cols-1 gap-4">
                    <!-- Current Class -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Current Class *</label>
                        <select name="${prefix}_current_class_${counter}" 
                                class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select Class</option>
                            <option value="playschool">Play School</option>
                            <option value="prekkg">Pre KG</option>
                            <option value="lkg">LKG</option>
                            <option value="ukg">UKG</option>
                            <option value="1">I</option>
                            <option value="2">II</option>
                            <option value="3">III</option>
                            <option value="4">IV</option>
                            <option value="5">V</option>
                            <option value="6">VI</option>
                            <option value="7">VII</option>
                            <option value="8">VIII</option>
                            <option value="9">IX</option>
                            <option value="10">X</option>
                            <option value="11">XI</option>
                            <option value="12">XII</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (status === 'completed') {
            fields += `
                <div class="grid grid-cols-1 gap-4">
                    <!-- Completed Class -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Completed Level *</label>
                        <select name="${prefix}_completed_class_${counter}" 
                                class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select Level</option>
                            <option value="10th_sslc">X STD - SSLC</option>
                            <option value="12th_hsc">XII STD - HSC</option>
                            <option value="others">Others</option>
                        </select>
                    </div>
                </div>
            `;
        }

        return fields;
    }

    static generateCollegeFields(entryId, status) {
        const prefix = entryId.split('_education_')[0];
        const counter = entryId.split('_').pop();
        
        let fields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- College Name -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">College Name *</label>
                    <input type="text" name="${prefix}_college_name_${counter}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Enter college name">
                </div>
                
                <!-- Department -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input type="text" name="${prefix}_department_${counter}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Enter department">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Degree -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                    <input type="text" name="${prefix}_degree_${counter}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Enter degree">
                </div>
        `;

        if (status === 'pursuing') {
            fields += `
                <!-- Current Year -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Current Year *</label>
                    <select name="${prefix}_current_year_${counter}" 
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                    </select>
                </div>
            `;
        } else if (status === 'completed') {
            fields += `
                <!-- Qualification -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                    <select name="${prefix}_qualification_${counter}" 
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Qualification</option>
                        <option value="diploma">Diploma</option>
                        <option value="ug">UG</option>
                        <option value="pg">PG</option>
                        <option value="doctorate">Doctorate</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4">
                <!-- Year of Completion -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Year of Completion *</label>
                    <select name="${prefix}_year_of_completion_${counter}" 
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Year</option>
            `;
            
            // Generate years from 1950 to current year
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= 1950; year--) {
                fields += `<option value="${year}">${year}</option>`;
            }
            
            fields += `
                    </select>
                </div>
            `;
        }

        fields += `</div>`;
        return fields;
    }

    static initializeSchoolAutoSuggestions(entryId) {
        // This would integrate with the form values API to provide school name suggestions
        // For now, we'll create a placeholder that can be enhanced later
        const schoolInput = document.querySelector(`#${entryId} input[name*="_school_name_"]`);
        if (schoolInput) {
            schoolInput.addEventListener('input', function() {
                // TODO: Implement auto-suggestion logic
                // This would call the form values API to get school suggestions
                console.log('School auto-suggestion for:', this.value);
            });
        }
    }
}

// Global functions for HTML event handlers
window.handleEducationStatusChange = EnhancedEducationComponent.handleEducationStatusChange;
window.handleEducationLevelChange = EnhancedEducationComponent.handleEducationLevelChange;
window.removeEducationEntry = EnhancedEducationComponent.removeEducationEntry;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedEducationComponent;
}
