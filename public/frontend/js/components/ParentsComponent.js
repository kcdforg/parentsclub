/**
 * Parents Component
 * Reusable component for collecting parent information in family trees
 */

import { formRelationships } from '../form-relationships.js';

export class ParentsComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            title: 'Parents',
            prefix: '', // 'spouse_' for spouse parents
            icon: 'fa-user-friends',
            iconColor: 'blue-500',
            sectionId: 'parents',
            ...options
        };
        this.data = {};
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        container.innerHTML = this.getHTML();
        this.attachEventListeners();
        
        // Populate Kulam dropdowns using the form relationships system
        if (formRelationships.isLoaded) {
            formRelationships.populateAllDropdowns();
        }
    }

    getHTML() {
        const { prefix, title, icon, iconColor, sectionId } = this.options;
        
        return `
            <div class="family-subsection mb-8 border-2 border-gray-300 rounded-lg p-4" id="${prefix}${sectionId}-subsection">
                <div class="subsection-header cursor-pointer mb-4" onclick="toggleSubsection('${prefix}${sectionId}')">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center mr-3 text-sm font-medium" id="${prefix}${sectionId}-number">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                                    <i class="fas ${icon} mr-2 text-${iconColor}"></i>
                                    ${title}
                                </h4>
                                <span class="text-sm text-red-500" id="${prefix}${sectionId}-status">Not completed</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transform transition-transform" id="${prefix}${sectionId}-icon"></i>
                    </div>
                </div>
                <div class="subsection-content" id="${prefix}${sectionId}-content" style="display: block;">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="${prefix}fatherName" class="block text-sm font-medium text-gray-700 mb-2">
                                Father's Name
                            </label>
                            <div class="relative">
                                <input type="text" id="${prefix}fatherName" name="${prefix}father_name"
                                       class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                       placeholder="Enter father's name">
                                <i class="fas fa-male absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                        <div>
                            <label for="${prefix}motherName" class="block text-sm font-medium text-gray-700 mb-2">
                                Mother's Name
                            </label>
                            <div class="relative">
                                <input type="text" id="${prefix}motherName" name="${prefix}mother_name"
                                       class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                       placeholder="Enter mother's name">
                                <i class="fas fa-female absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Parent Details -->
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <h5 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-map-marker-alt mr-2 text-purple-500"></i>Location Details
                        </h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Father Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Father's Details</h6>
                                <div>
                                    <label for="${prefix}fatherNative" class="block text-sm font-medium text-gray-700 mb-2">
                                        Native/Place of Birth
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}fatherNative" name="${prefix}father_native"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter father's native place">
                                        <i class="fas fa-home absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>
                                <div>
                                    <label for="${prefix}fatherResidence" class="block text-sm font-medium text-gray-700 mb-2">
                                        Place of Residence
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}fatherResidence" name="${prefix}father_residence"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter father's residence">
                                        <i class="fas fa-building absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <div class="mt-2">
                                        <label class="flex items-center text-sm text-gray-600">
                                            <input type="checkbox" id="${prefix}fatherSameAsNative" class="mr-2 rounded focus:ring-primary">
                                            Same as native place
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Status <span class="text-red-500">*</span>
                                    </label>
                                    <div class="flex space-x-4">
                                        <label class="flex items-center">
                                            <input type="radio" name="${prefix}father_status" value="live" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Live</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="${prefix}father_status" value="deceased" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Deceased</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Mother Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Mother's Details</h6>
                                <div>
                                    <label for="${prefix}motherNative" class="block text-sm font-medium text-gray-700 mb-2">
                                        Native/Place of Birth
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}motherNative" name="${prefix}mother_native"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter mother's native place">
                                        <i class="fas fa-home absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>
                                <div>
                                    <label for="${prefix}motherResidence" class="block text-sm font-medium text-gray-700 mb-2">
                                        Place of Residence
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}motherResidence" name="${prefix}mother_residence"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter mother's residence">
                                        <i class="fas fa-building absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <div class="mt-2">
                                        <label class="flex items-center text-sm text-gray-600">
                                            <input type="checkbox" id="${prefix}motherSameAsNative" class="mr-2 rounded focus:ring-primary">
                                            Same as native place
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Status <span class="text-red-500">*</span>
                                    </label>
                                    <div class="flex space-x-4">
                                        <label class="flex items-center">
                                            <input type="radio" name="${prefix}mother_status" value="live" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Live</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="${prefix}mother_status" value="deceased" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Deceased</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Kulam Details Section -->
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <h5 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-star mr-2 text-orange-500"></i>Kulam Details
                        </h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Father Kulam Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Father's Kulam Details</h6>
                                <div>
                                    <label for="${prefix}fatherKulam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kulam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}fatherKulam" name="${prefix}father_kulam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kulam-dropdown">
                                            <option value="">Select Kulam</option>
                                            <option value="Other">Other (specify below)</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-star absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}fatherKulamOther" name="${prefix}father_kulam_other"
                                           placeholder="Please specify kulam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}fatherKulaDeivam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kula Deivam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}fatherKulaDeivam" name="${prefix}father_kula_deivam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kula-deivam-dropdown">
                                            <option value="">Select Kula Deivam</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-pray absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}fatherKulaDeivamOther" name="${prefix}father_kula_deivam_other"
                                           placeholder="Please specify kula deivam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}fatherKaani" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kaani
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}fatherKaani" name="${prefix}father_kaani"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kaani-dropdown">
                                            <option value="">Select Kaani</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-crown absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}fatherKaaniOther" name="${prefix}father_kaani_other"
                                           placeholder="Please specify kaani"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                            </div>
                            
                            <!-- Mother Kulam Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Mother's Kulam Details</h6>
                                <div>
                                    <label for="${prefix}motherKulam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kulam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}motherKulam" name="${prefix}mother_kulam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kulam-dropdown">
                                            <option value="">Select Kulam</option>
                                            <option value="Other">Other (specify below)</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-star absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}motherKulamOther" name="${prefix}mother_kulam_other"
                                           placeholder="Please specify kulam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}motherKulaDeivam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kula Deivam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}motherKulaDeivam" name="${prefix}mother_kula_deivam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kula-deivam-dropdown">
                                            <option value="">Select Kula Deivam</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-pray absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}motherKulaDeivamOther" name="${prefix}mother_kula_deivam_other"
                                           placeholder="Please specify kula deivam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}motherKaani" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kaani
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}motherKaani" name="${prefix}mother_kaani"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kaani-dropdown">
                                            <option value="">Select Kaani</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-crown absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}motherKaaniOther" name="${prefix}mother_kaani_other"
                                           placeholder="Please specify kaani"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Residence Auto-populate Options -->
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                            <h6 class="text-sm font-semibold text-green-800 mb-3">
                                <i class="fas fa-home mr-2"></i>Residence Auto-populate
                            </h6>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <input type="checkbox" 
                                           id="auto_populate_${prefix}father_residence" 
                                           data-auto-populate-residence="${prefix}father"
                                           class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                           onchange="handleResidenceAutoPopulate('${prefix}father', this.checked)">
                                    <label for="auto_populate_${prefix}father_residence" class="ml-2 text-sm text-green-700">
                                        Same as Native for Father's Residence
                                    </label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" 
                                           id="auto_populate_${prefix}mother_residence" 
                                           data-auto-populate-residence="${prefix}mother"
                                           class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                           onchange="handleResidenceAutoPopulate('${prefix}mother', this.checked)">
                                    <label for="auto_populate_${prefix}mother_residence" class="ml-2 text-sm text-green-700">
                                        Same as Native for Mother's Residence
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Save Button -->
                    <div class="mt-6 flex justify-end">
                        <button type="button" id="save${this.getCapitalizedPrefix()}Parents" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <span id="save${this.getCapitalizedPrefix()}ParentsText">Save ${title}</span>
                            <i id="save${this.getCapitalizedPrefix()}ParentsSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getCapitalizedPrefix() {
        if (!this.options.prefix) return '';
        return this.options.prefix.charAt(0).toUpperCase() + this.options.prefix.slice(1, -1); // Remove underscore
    }

    attachEventListeners() {
        const saveButton = document.getElementById(`save${this.getCapitalizedPrefix()}Parents`);
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.save();
            });
        }
        
        // Setup "same as native" functionality
        const { prefix } = this.options;
        
        // Father same as native checkbox
        const fatherSameCheckbox = document.getElementById(`${prefix}fatherSameAsNative`);
        const fatherNativeInput = document.getElementById(`${prefix}fatherNative`);
        const fatherResidenceInput = document.getElementById(`${prefix}fatherResidence`);
        
        if (fatherSameCheckbox && fatherNativeInput && fatherResidenceInput) {
            fatherSameCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    fatherResidenceInput.value = fatherNativeInput.value;
                    fatherResidenceInput.disabled = true;
                } else {
                    fatherResidenceInput.disabled = false;
                }
            });
            
            // Also copy when native place changes and checkbox is checked
            fatherNativeInput.addEventListener('input', function() {
                if (fatherSameCheckbox.checked) {
                    fatherResidenceInput.value = this.value;
                }
            });
        }
        
        // Mother same as native checkbox
        const motherSameCheckbox = document.getElementById(`${prefix}motherSameAsNative`);
        const motherNativeInput = document.getElementById(`${prefix}motherNative`);
        const motherResidenceInput = document.getElementById(`${prefix}motherResidence`);
        
        if (motherSameCheckbox && motherNativeInput && motherResidenceInput) {
            motherSameCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    motherResidenceInput.value = motherNativeInput.value;
                    motherResidenceInput.disabled = true;
                } else {
                    motherResidenceInput.disabled = false;
                }
            });
            
            // Also copy when native place changes and checkbox is checked
            motherNativeInput.addEventListener('input', function() {
                if (motherSameCheckbox.checked) {
                    motherResidenceInput.value = this.value;
                }
            });
        }
    }

    async save() {
        const data = this.getData();
        const validation = this.validate();
        
        if (!validation.valid) {
            this.showNotification(validation.message, 'error');
            return;
        }

        const btn = document.getElementById(`save${this.getCapitalizedPrefix()}Parents`);
        const text = document.getElementById(`save${this.getCapitalizedPrefix()}ParentsText`);
        const spinner = document.getElementById(`save${this.getCapitalizedPrefix()}ParentsSpinner`);
        
        try {
            this.setButtonLoading(btn, text, spinner, 'Saving...', true);
            
            // Call the save function if provided in options
            if (this.options.onSave) {
                await this.options.onSave(data, this.options.prefix);
                this.markSectionComplete();
                this.showNotification(`${this.options.title} saved successfully!`, 'success');
            }
            
        } catch (error) {
            console.error(`Error saving ${this.options.title}:`, error);
            this.markSectionError();
            this.showNotification(`Failed to save ${this.options.title}: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(btn, text, spinner, `Save ${this.options.title}`, false);
        }
    }

    populate(data) {
        this.data = data;
        
        console.log('ParentsComponent populate called with data:', data);
        console.log('Component prefix:', this.options.prefix);
        
        const { prefix } = this.options;
        const fields = {
            [`${prefix}fatherName`]: data.father_name || data[`${prefix}father_name`],
            [`${prefix}motherName`]: data.mother_name || data[`${prefix}mother_name`],
            [`${prefix}fatherNative`]: data.father_native || data[`${prefix}father_native`],
            [`${prefix}fatherResidence`]: data.father_residence || data[`${prefix}father_residence`],
            [`${prefix}motherNative`]: data.mother_native || data[`${prefix}mother_native`],
            [`${prefix}motherResidence`]: data.mother_residence || data[`${prefix}mother_residence`]
        };
        
        console.log('Trying to populate fields:', fields);
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            console.log(`Field ${fieldId}:`, field ? 'found' : 'not found', 'value:', value);
            if (field && value) {
                field.value = value;
                console.log(`Set ${fieldId} to:`, value);
            }
        });
        
        // Populate radio buttons for status
        const fatherStatus = data.father_status || data[`${prefix}father_status`];
        if (fatherStatus) {
            const fatherRadio = document.querySelector(`input[name="${prefix}father_status"][value="${fatherStatus}"]`);
            if (fatherRadio) fatherRadio.checked = true;
        }
        
        const motherStatus = data.mother_status || data[`${prefix}mother_status`];
        if (motherStatus) {
            const motherRadio = document.querySelector(`input[name="${prefix}mother_status"][value="${motherStatus}"]`);
            if (motherRadio) motherRadio.checked = true;
        }
        
        // Check "same as native" checkboxes if residence matches native
        const fatherNative = fields[`${prefix}fatherNative`];
        const fatherResidence = fields[`${prefix}fatherResidence`];
        if (fatherNative && fatherResidence && fatherNative === fatherResidence) {
            const checkbox = document.getElementById(`${prefix}fatherSameAsNative`);
            if (checkbox) {
                checkbox.checked = true;
                const residenceField = document.getElementById(`${prefix}fatherResidence`);
                if (residenceField) residenceField.disabled = true;
            }
        }
        
        const motherNative = fields[`${prefix}motherNative`];
        const motherResidence = fields[`${prefix}motherResidence`];
        if (motherNative && motherResidence && motherNative === motherResidence) {
            const checkbox = document.getElementById(`${prefix}motherSameAsNative`);
            if (checkbox) {
                checkbox.checked = true;
                const residenceField = document.getElementById(`${prefix}motherResidence`);
                if (residenceField) residenceField.disabled = true;
            }
        }
    }

    getData() {
        const { prefix } = this.options;
        return {
            'father_name': document.getElementById(`${prefix}fatherName`)?.value || '',
            'mother_name': document.getElementById(`${prefix}motherName`)?.value || '',
            'father_native': document.getElementById(`${prefix}fatherNative`)?.value || '',
            'father_residence': document.getElementById(`${prefix}fatherResidence`)?.value || '',
            'father_status': document.querySelector(`input[name="${prefix}father_status"]:checked`)?.value || '',
            'mother_native': document.getElementById(`${prefix}motherNative`)?.value || '',
            'mother_residence': document.getElementById(`${prefix}motherResidence`)?.value || '',
            'mother_status': document.querySelector(`input[name="${prefix}mother_status"]:checked`)?.value || ''
        };
    }

    validate() {
        const data = this.getData();
        const { prefix } = this.options;
        
        // Check if any parent name is filled, then status is required
        if (data.father_name && data.father_name.trim()) {
            if (!data.father_status) {
                return {
                    valid: false,
                    message: 'Please select father\'s status (Live/Deceased)'
                };
            }
        }
        
        if (data.mother_name && data.mother_name.trim()) {
            if (!data.mother_status) {
                return {
                    valid: false,
                    message: 'Please select mother\'s status (Live/Deceased)'
                };
            }
        }
        
        return { valid: true };
    }

    setButtonLoading(btn, textElement, spinner, loadingText, isLoading) {
        if (isLoading) {
            btn.disabled = true;
            textElement.textContent = loadingText;
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            textElement.textContent = textElement.textContent.replace('Saving...', `Save ${this.options.title}`);
            spinner.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    'fa-info-circle'
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    markSectionComplete() {
        const { prefix, sectionId } = this.options;
        const subsection = document.getElementById(`${prefix}${sectionId}-subsection`);
        const status = document.getElementById(`${prefix}${sectionId}-status`);
        const number = document.getElementById(`${prefix}${sectionId}-number`);
        
        if (subsection) {
            subsection.className = subsection.className.replace('border-gray-300', '').replace('border-red-500', '') + ' border-green-500';
        }
        if (status) {
            status.textContent = 'Completed';
            status.className = 'text-sm text-green-600';
        }
        if (number) {
            number.className = number.className.replace('bg-gray-300', '').replace('bg-red-500', '') + ' bg-green-500';
            number.innerHTML = '<i class="fas fa-check"></i>';
        }
    }

    markSectionError() {
        const { prefix, sectionId } = this.options;
        const subsection = document.getElementById(`${prefix}${sectionId}-subsection`);
        const status = document.getElementById(`${prefix}${sectionId}-status`);
        const number = document.getElementById(`${prefix}${sectionId}-number`);
        
        if (subsection) {
            subsection.className = subsection.className.replace('border-gray-300', '').replace('border-green-500', '') + ' border-red-500';
        }
        if (status) {
            status.textContent = 'Error - needs attention';
            status.className = 'text-sm text-red-600';
        }
        if (number) {
            number.className = number.className.replace('bg-gray-300', '').replace('bg-green-500', '') + ' bg-red-500';
            number.innerHTML = '<i class="fas fa-exclamation"></i>';
        }
    }
}
