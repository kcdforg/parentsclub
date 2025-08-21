/**
 * Grandparents Component
 * Reusable component for collecting grandparent information in family trees
 */

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
            [`${prefix}${type}Grandmother`]: data[`${type}_grandmother_name`] || data[`${prefix}${type}_grandmother_name`]
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
    }

    getData() {
        const { prefix, type } = this.options;
        return {
            [`${type}_grandfather_name`]: document.getElementById(`${prefix}${type}Grandfather`)?.value || '',
            [`${type}_grandmother_name`]: document.getElementById(`${prefix}${type}Grandmother`)?.value || ''
        };
    }

    validate() {
        const data = this.getData();
        // Grandparents are optional, so no validation required
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
