/**
 * Grandparents Component
 * Reusable component for collecting grandparent information in family trees
 */

import { formRelationships } from '../form-relationships.js';

export class GrandparentsComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            title: 'Grandparents',
            prefix: '', // 'spouse_' for spouse grandparents
            type: 'paternal', // 'paternal' or 'maternal'
            icon: 'fa-male',
            iconColor: 'green-500',
            sectionId: 'grandparents',
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
        const { prefix, type, title, icon, iconColor, sectionId } = this.options;
        const fullSectionId = `${prefix}${type}-${sectionId}`;
        
        return `
            <div class="family-subsection mb-8 border-2 border-gray-300 rounded-lg p-4" id="${fullSectionId}-subsection">
                <div class="subsection-header cursor-pointer mb-4" onclick="toggleSubsection('${fullSectionId}')">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center mr-3 text-sm font-medium" id="${fullSectionId}-number">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                                    <i class="fas ${icon} mr-2 text-${iconColor}"></i>
                                    ${title}
                                </h4>
                                <span class="text-sm text-red-500" id="${fullSectionId}-status">Not completed</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transform transition-transform" id="${fullSectionId}-icon"></i>
                    </div>
                </div>
                <div class="subsection-content" id="${fullSectionId}-content" style="display: none;">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="${prefix}${type}Grandfather" class="block text-sm font-medium text-gray-700 mb-2">
                                ${this.getTypeTitle()} Grandfather's Name
                            </label>
                            <div class="relative">
                                <input type="text" id="${prefix}${type}Grandfather" name="${prefix}${type}_grandfather_name"
                                       class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                       placeholder="Enter grandfather's name">
                                <i class="fas fa-male absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                        <div>
                            <label for="${prefix}${type}Grandmother" class="block text-sm font-medium text-gray-700 mb-2">
                                ${this.getTypeTitle()} Grandmother's Name
                            </label>
                            <div class="relative">
                                <input type="text" id="${prefix}${type}Grandmother" name="${prefix}${type}_grandmother_name"
                                       class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                       placeholder="Enter grandmother's name">
                                <i class="fas fa-female absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Grandparent Details -->
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <h5 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-map-marker-alt mr-2 text-purple-500"></i>Location Details
                        </h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Grandfather Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">${this.getTypeTitle()} Grandfather's Details</h6>
                                <div>
                                    <label for="${prefix}${type}GrandfatherNative" class="block text-sm font-medium text-gray-700 mb-2">
                                        Native/Place of Birth
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}${type}GrandfatherNative" name="${prefix}${type}_grandfather_native"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter grandfather's native place">
                                        <i class="fas fa-home absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>
                                <div>
                                    <label for="${prefix}${type}GrandfatherResidence" class="block text-sm font-medium text-gray-700 mb-2">
                                        Place of Residence
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}${type}GrandfatherResidence" name="${prefix}${type}_grandfather_residence"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter grandfather's residence">
                                        <i class="fas fa-building absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <div class="mt-2">
                                        <label class="flex items-center text-sm text-gray-600">
                                            <input type="checkbox" id="${prefix}${type}GrandfatherSameAsNative" class="mr-2 rounded focus:ring-primary">
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
                                            <input type="radio" name="${prefix}${type}_grandfather_status" value="live" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Live</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="${prefix}${type}_grandfather_status" value="deceased" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Deceased</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Grandmother Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">${this.getTypeTitle()} Grandmother's Details</h6>
                                <div>
                                    <label for="${prefix}${type}GrandmotherNative" class="block text-sm font-medium text-gray-700 mb-2">
                                        Native/Place of Birth
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}${type}GrandmotherNative" name="${prefix}${type}_grandmother_native"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter grandmother's native place">
                                        <i class="fas fa-home absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>
                                <div>
                                    <label for="${prefix}${type}GrandmotherResidence" class="block text-sm font-medium text-gray-700 mb-2">
                                        Place of Residence
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="${prefix}${type}GrandmotherResidence" name="${prefix}${type}_grandmother_residence"
                                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                               placeholder="Enter grandmother's residence">
                                        <i class="fas fa-building absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <div class="mt-2">
                                        <label class="flex items-center text-sm text-gray-600">
                                            <input type="checkbox" id="${prefix}${type}GrandmotherSameAsNative" class="mr-2 rounded focus:ring-primary">
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
                                            <input type="radio" name="${prefix}${type}_grandmother_status" value="live" class="mr-2 focus:ring-primary" required>
                                            <span class="text-sm text-gray-700">Live</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="${prefix}${type}_grandmother_status" value="deceased" class="mr-2 focus:ring-primary" required>
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
                            <!-- Grandfather Kulam Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">${this.getTypeTitle()} Grandfather's Kulam Details</h6>
                                <div>
                                    <label for="${prefix}${type}GrandfatherKulam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kulam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}${type}GrandfatherKulam" name="${prefix}${type}_grandfather_kulam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kulam-dropdown">
                                            <option value="">Select Kulam</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-star absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}${type}GrandfatherKulamOther" name="${prefix}${type}_grandfather_kulam_other"
                                           placeholder="Please specify kulam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}${type}GrandfatherKulaDeivam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kula Deivam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}${type}GrandfatherKulaDeivam" name="${prefix}${type}_grandfather_kula_deivam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kula-deivam-dropdown">
                                            <option value="">Select Kula Deivam</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-pray absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}${type}GrandfatherKulaDeivamOther" name="${prefix}${type}_grandfather_kula_deivam_other"
                                           placeholder="Please specify kula deivam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}${type}GrandfatherKaani" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kaani
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}${type}GrandfatherKaani" name="${prefix}${type}_grandfather_kaani"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kaani-dropdown">
                                            <option value="">Select Kaani</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-crown absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}${type}GrandfatherKaaniOther" name="${prefix}${type}_grandfather_kaani_other"
                                           placeholder="Please specify kaani"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                            </div>
                            
                            <!-- Grandmother Kulam Details -->
                            <div class="space-y-4">
                                <h6 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">${this.getTypeTitle()} Grandmother's Kulam Details</h6>
                                <div>
                                    <label for="${prefix}${type}GrandmotherKulam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kulam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}${type}GrandmotherKulam" name="${prefix}${type}_grandmother_kulam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kulam-dropdown">
                                            <option value="">Select Kulam</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-star absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}${type}GrandmotherKulamOther" name="${prefix}${type}_grandmother_kulam_other"
                                           placeholder="Please specify kulam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}${type}GrandmotherKulaDeivam" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kula Deivam
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}${type}GrandmotherKulaDeivam" name="${prefix}${type}_grandmother_kula_deivam"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kula-deivam-dropdown">
                                            <option value="">Select Kula Deivam</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-pray absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}${type}GrandmotherKulaDeivamOther" name="${prefix}${type}_grandmother_kula_deivam_other"
                                           placeholder="Please specify kula deivam"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                                <div>
                                    <label for="${prefix}${type}GrandmotherKaani" class="block text-sm font-medium text-gray-700 mb-2">
                                        Kaani
                                    </label>
                                    <div class="relative">
                                        <select id="${prefix}${type}GrandmotherKaani" name="${prefix}${type}_grandmother_kaani"
                                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white kaani-dropdown">
                                            <option value="">Select Kaani</option>
                                            <!-- Options will be populated by JavaScript -->
                                        </select>
                                        <i class="fas fa-crown absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <input type="text" id="${prefix}${type}GrandmotherKaaniOther" name="${prefix}${type}_grandmother_kaani_other"
                                           placeholder="Please specify kaani"
                                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Save Button -->
                    <div class="mt-6 flex justify-end">
                        <button type="button" id="save${this.getCapitalizedId()}Grandparents" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <span id="save${this.getCapitalizedId()}GrandparentsText">Save ${this.getTypeTitle()} Grandparents</span>
                            <i id="save${this.getCapitalizedId()}GrandparentsSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getTypeTitle() {
        return this.options.type.charAt(0).toUpperCase() + this.options.type.slice(1);
    }

    getCapitalizedId() {
        const prefix = this.options.prefix ? this.options.prefix.charAt(0).toUpperCase() + this.options.prefix.slice(1, -1) : '';
        const type = this.getTypeTitle();
        return `${prefix}${type}`;
    }

    attachEventListeners() {
        const saveButton = document.getElementById(`save${this.getCapitalizedId()}Grandparents`);
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.save();
            });
        }
        
        // Setup "same as native" functionality
        const { prefix, type } = this.options;
        
        // Grandfather same as native checkbox
        const grandfatherSameCheckbox = document.getElementById(`${prefix}${type}GrandfatherSameAsNative`);
        const grandfatherNativeInput = document.getElementById(`${prefix}${type}GrandfatherNative`);
        const grandfatherResidenceInput = document.getElementById(`${prefix}${type}GrandfatherResidence`);
        
        if (grandfatherSameCheckbox && grandfatherNativeInput && grandfatherResidenceInput) {
            grandfatherSameCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    grandfatherResidenceInput.value = grandfatherNativeInput.value;
                    grandfatherResidenceInput.disabled = true;
                } else {
                    grandfatherResidenceInput.disabled = false;
                }
            });
            
            // Also copy when native place changes and checkbox is checked
            grandfatherNativeInput.addEventListener('input', function() {
                if (grandfatherSameCheckbox.checked) {
                    grandfatherResidenceInput.value = this.value;
                }
            });
        }
        
        // Grandmother same as native checkbox
        const grandmotherSameCheckbox = document.getElementById(`${prefix}${type}GrandmotherSameAsNative`);
        const grandmotherNativeInput = document.getElementById(`${prefix}${type}GrandmotherNative`);
        const grandmotherResidenceInput = document.getElementById(`${prefix}${type}GrandmotherResidence`);
        
        if (grandmotherSameCheckbox && grandmotherNativeInput && grandmotherResidenceInput) {
            grandmotherSameCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    grandmotherResidenceInput.value = grandmotherNativeInput.value;
                    grandmotherResidenceInput.disabled = true;
                } else {
                    grandmotherResidenceInput.disabled = false;
                }
            });
            
            // Also copy when native place changes and checkbox is checked
            grandmotherNativeInput.addEventListener('input', function() {
                if (grandmotherSameCheckbox.checked) {
                    grandmotherResidenceInput.value = this.value;
                }
            });
        }
        
        // Setup Kulam "other" field toggles
        this.setupKulamOtherToggles();
    }
    
    setupKulamOtherToggles() {
        const { prefix, type } = this.options;
        
        // Grandfather Kulam toggles
        this.setupKulamOtherToggle(`${prefix}${type}GrandfatherKulam`, `${prefix}${type}GrandfatherKulamOther`);
        this.setupKulamOtherToggle(`${prefix}${type}GrandfatherKulaDeivam`, `${prefix}${type}GrandfatherKulaDeivamOther`);
        this.setupKulamOtherToggle(`${prefix}${type}GrandfatherKaani`, `${prefix}${type}GrandfatherKaaniOther`);
        
        // Grandmother Kulam toggles
        this.setupKulamOtherToggle(`${prefix}${type}GrandmotherKulam`, `${prefix}${type}GrandmotherKulamOther`);
        this.setupKulamOtherToggle(`${prefix}${type}GrandmotherKulaDeivam`, `${prefix}${type}GrandmotherKulaDeivamOther`);
        this.setupKulamOtherToggle(`${prefix}${type}GrandmotherKaani`, `${prefix}${type}GrandmotherKaaniOther`);
    }
    
    setupKulamOtherToggle(selectId, otherInputId) {
        const selectElement = document.getElementById(selectId);
        const otherInput = document.getElementById(otherInputId);
        
        if (selectElement && otherInput) {
            selectElement.addEventListener('change', function() {
                if (this.value === 'other') {
                    otherInput.classList.remove('hidden');
                    otherInput.required = true;
                } else {
                    otherInput.classList.add('hidden');
                    otherInput.required = false;
                    otherInput.value = '';
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

        const btn = document.getElementById(`save${this.getCapitalizedId()}Grandparents`);
        const text = document.getElementById(`save${this.getCapitalizedId()}GrandparentsText`);
        const spinner = document.getElementById(`save${this.getCapitalizedId()}GrandparentsSpinner`);
        
        try {
            this.setButtonLoading(btn, text, spinner, 'Saving...', true);
            
            // Call the save function if provided in options
            if (this.options.onSave) {
                await this.options.onSave(data, this.options.prefix, this.options.type);
                this.markSectionComplete();
                this.showNotification(`${this.getTypeTitle()} grandparents saved successfully!`, 'success');
            }
            
        } catch (error) {
            console.error(`Error saving ${this.getTypeTitle()} grandparents:`, error);
            this.markSectionError();
            this.showNotification(`Failed to save ${this.getTypeTitle()} grandparents: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(btn, text, spinner, `Save ${this.getTypeTitle()}`, false);
        }
    }

    populate(data) {
        this.data = data;
        
        console.log('GrandparentsComponent populate called with data:', data);
        console.log('Component prefix:', this.options.prefix, 'type:', this.options.type);
        
        const { prefix, type } = this.options;
        const fields = {
            [`${prefix}${type}Grandfather`]: data[`${type}_grandfather_name`] || data[`${prefix}${type}_grandfather_name`],
            [`${prefix}${type}Grandmother`]: data[`${type}_grandmother_name`] || data[`${prefix}${type}_grandmother_name`],
            [`${prefix}${type}GrandfatherNative`]: data[`${type}_grandfather_native`] || data[`${prefix}${type}_grandfather_native`],
            [`${prefix}${type}GrandfatherResidence`]: data[`${type}_grandfather_residence`] || data[`${prefix}${type}_grandfather_residence`],
            [`${prefix}${type}GrandmotherNative`]: data[`${type}_grandmother_native`] || data[`${prefix}${type}_grandmother_native`],
            [`${prefix}${type}GrandmotherResidence`]: data[`${type}_grandmother_residence`] || data[`${prefix}${type}_grandmother_residence`],
            [`${prefix}${type}GrandfatherKulamOther`]: data[`${type}_grandfather_kulam_other`] || data[`${prefix}${type}_grandfather_kulam_other`],
            [`${prefix}${type}GrandfatherKulaDeivamOther`]: data[`${type}_grandfather_kula_deivam_other`] || data[`${prefix}${type}_grandfather_kula_deivam_other`],
            [`${prefix}${type}GrandfatherKaaniOther`]: data[`${type}_grandfather_kaani_other`] || data[`${prefix}${type}_grandfather_kaani_other`],
            [`${prefix}${type}GrandmotherKulamOther`]: data[`${type}_grandmother_kulam_other`] || data[`${prefix}${type}_grandmother_kulam_other`],
            [`${prefix}${type}GrandmotherKulaDeivamOther`]: data[`${type}_grandmother_kula_deivam_other`] || data[`${prefix}${type}_grandmother_kula_deivam_other`],
            [`${prefix}${type}GrandmotherKaaniOther`]: data[`${type}_grandmother_kaani_other`] || data[`${prefix}${type}_grandmother_kaani_other`]
        };
        
        console.log('Trying to populate grandparent fields:', fields);
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            console.log(`Field ${fieldId}:`, field ? 'found' : 'not found', 'value:', value);
            if (field && value) {
                field.value = value;
                console.log(`Set ${fieldId} to:`, value);
            }
        });
        
        // Populate radio buttons for status
        const grandfatherStatus = data[`${type}_grandfather_status`] || data[`${prefix}${type}_grandfather_status`];
        if (grandfatherStatus) {
            const grandfatherRadio = document.querySelector(`input[name="${prefix}${type}_grandfather_status"][value="${grandfatherStatus}"]`);
            if (grandfatherRadio) grandfatherRadio.checked = true;
        }
        
        const grandmotherStatus = data[`${type}_grandmother_status`] || data[`${prefix}${type}_grandmother_status`];
        if (grandmotherStatus) {
            const grandmotherRadio = document.querySelector(`input[name="${prefix}${type}_grandmother_status"][value="${grandmotherStatus}"]`);
            if (grandmotherRadio) grandmotherRadio.checked = true;
        }
        
        // Check "same as native" checkboxes if residence matches native
        const grandfatherNative = fields[`${prefix}${type}GrandfatherNative`];
        const grandfatherResidence = fields[`${prefix}${type}GrandfatherResidence`];
        if (grandfatherNative && grandfatherResidence && grandfatherNative === grandfatherResidence) {
            const checkbox = document.getElementById(`${prefix}${type}GrandfatherSameAsNative`);
            if (checkbox) {
                checkbox.checked = true;
                const residenceField = document.getElementById(`${prefix}${type}GrandfatherResidence`);
                if (residenceField) residenceField.disabled = true;
            }
        }
        
        const grandmotherNative = fields[`${prefix}${type}GrandmotherNative`];
        const grandmotherResidence = fields[`${prefix}${type}GrandmotherResidence`];
        if (grandmotherNative && grandmotherResidence && grandmotherNative === grandmotherResidence) {
            const checkbox = document.getElementById(`${prefix}${type}GrandmotherSameAsNative`);
            if (checkbox) {
                checkbox.checked = true;
                const residenceField = document.getElementById(`${prefix}${type}GrandmotherResidence`);
                if (residenceField) residenceField.disabled = true;
            }
        }
        
        // Populate Kulam dropdowns
        const kulamDropdowns = {
            [`${prefix}${type}GrandfatherKulam`]: data[`${type}_grandfather_kulam`] || data[`${prefix}${type}_grandfather_kulam`],
            [`${prefix}${type}GrandfatherKulaDeivam`]: data[`${type}_grandfather_kula_deivam`] || data[`${prefix}${type}_grandfather_kula_deivam`],
            [`${prefix}${type}GrandfatherKaani`]: data[`${type}_grandfather_kaani`] || data[`${prefix}${type}_grandfather_kaani`],
            [`${prefix}${type}GrandmotherKulam`]: data[`${type}_grandmother_kulam`] || data[`${prefix}${type}_grandmother_kulam`],
            [`${prefix}${type}GrandmotherKulaDeivam`]: data[`${type}_grandmother_kula_deivam`] || data[`${prefix}${type}_grandmother_kula_deivam`],
            [`${prefix}${type}GrandmotherKaani`]: data[`${type}_grandmother_kaani`] || data[`${prefix}${type}_grandmother_kaani`]
        };
        
        Object.entries(kulamDropdowns).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
                // If "other" is selected, show the corresponding text field
                if (value === 'other') {
                    const otherFieldId = fieldId + 'Other';
                    const otherField = document.getElementById(otherFieldId);
                    if (otherField) {
                        otherField.classList.remove('hidden');
                        otherField.required = true;
                    }
                }
            }
        });
    }

    getData() {
        const { prefix, type } = this.options;
        return {
            [`${type}_grandfather_name`]: document.getElementById(`${prefix}${type}Grandfather`)?.value || '',
            [`${type}_grandmother_name`]: document.getElementById(`${prefix}${type}Grandmother`)?.value || '',
            [`${type}_grandfather_native`]: document.getElementById(`${prefix}${type}GrandfatherNative`)?.value || '',
            [`${type}_grandfather_residence`]: document.getElementById(`${prefix}${type}GrandfatherResidence`)?.value || '',
            [`${type}_grandfather_status`]: document.querySelector(`input[name="${prefix}${type}_grandfather_status"]:checked`)?.value || '',
            [`${type}_grandmother_native`]: document.getElementById(`${prefix}${type}GrandmotherNative`)?.value || '',
            [`${type}_grandmother_residence`]: document.getElementById(`${prefix}${type}GrandmotherResidence`)?.value || '',
            [`${type}_grandmother_status`]: document.querySelector(`input[name="${prefix}${type}_grandmother_status"]:checked`)?.value || '',
            [`${type}_grandfather_kulam`]: document.getElementById(`${prefix}${type}GrandfatherKulam`)?.value || '',
            [`${type}_grandfather_kulam_other`]: document.getElementById(`${prefix}${type}GrandfatherKulamOther`)?.value || '',
            [`${type}_grandfather_kula_deivam`]: document.getElementById(`${prefix}${type}GrandfatherKulaDeivam`)?.value || '',
            [`${type}_grandfather_kula_deivam_other`]: document.getElementById(`${prefix}${type}GrandfatherKulaDeivamOther`)?.value || '',
            [`${type}_grandfather_kaani`]: document.getElementById(`${prefix}${type}GrandfatherKaani`)?.value || '',
            [`${type}_grandfather_kaani_other`]: document.getElementById(`${prefix}${type}GrandfatherKaaniOther`)?.value || '',
            [`${type}_grandmother_kulam`]: document.getElementById(`${prefix}${type}GrandmotherKulam`)?.value || '',
            [`${type}_grandmother_kulam_other`]: document.getElementById(`${prefix}${type}GrandmotherKulamOther`)?.value || '',
            [`${type}_grandmother_kula_deivam`]: document.getElementById(`${prefix}${type}GrandmotherKulaDeivam`)?.value || '',
            [`${type}_grandmother_kula_deivam_other`]: document.getElementById(`${prefix}${type}GrandmotherKulaDeivamOther`)?.value || '',
            [`${type}_grandmother_kaani`]: document.getElementById(`${prefix}${type}GrandmotherKaani`)?.value || '',
            [`${type}_grandmother_kaani_other`]: document.getElementById(`${prefix}${type}GrandmotherKaaniOther`)?.value || ''
        };
    }

    validate() {
        const data = this.getData();
        const { type } = this.options;
        
        // Check if any grandparent name is filled, then status is required
        if (data[`${type}_grandfather_name`] && data[`${type}_grandfather_name`].trim()) {
            if (!data[`${type}_grandfather_status`]) {
                return {
                    valid: false,
                    message: `Please select ${this.getTypeTitle().toLowerCase()} grandfather's status (Live/Deceased)`
                };
            }
        }
        
        if (data[`${type}_grandmother_name`] && data[`${type}_grandmother_name`].trim()) {
            if (!data[`${type}_grandmother_status`]) {
                return {
                    valid: false,
                    message: `Please select ${this.getTypeTitle().toLowerCase()} grandmother's status (Live/Deceased)`
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
            textElement.textContent = textElement.textContent.replace('Saving...', `Save ${this.getTypeTitle()}`);
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
        const { prefix, type } = this.options;
        const fullSectionId = `${prefix}${type}-grandparents`;
        const subsection = document.getElementById(`${fullSectionId}-subsection`);
        const status = document.getElementById(`${fullSectionId}-status`);
        const number = document.getElementById(`${fullSectionId}-number`);
        
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
        const { prefix, type } = this.options;
        const fullSectionId = `${prefix}${type}-grandparents`;
        const subsection = document.getElementById(`${fullSectionId}-subsection`);
        const status = document.getElementById(`${fullSectionId}-status`);
        const number = document.getElementById(`${fullSectionId}-number`);
        
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
