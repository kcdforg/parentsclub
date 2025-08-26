/**
 * Kulam Auto-Population System
 * Handles the patrilineal nature of Kulam inheritance
 */

class KulamAutoPopulate {
    constructor() {
        this.memberKulamData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for member kulam changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('select[name*="kulam"], input[name*="kulam"]')) {
                this.handleKulamChange(e.target);
            }
        });

        // Listen for auto-populate checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"][data-auto-populate]')) {
                this.handleAutoPopulateChange(e.target);
            }
        });
    }

    handleKulamChange(element) {
        const elementName = element.name;
        
        // Store member kulam data when it changes
        if (elementName.includes('member') || (!elementName.includes('spouse') && !elementName.includes('child'))) {
            this.updateMemberKulamData();
        }
    }

    updateMemberKulamData() {
        this.memberKulamData = {
            kulam: this.getFieldValue('kulam'),
            kulaDeivam: this.getFieldValue('kula_deivam'),
            kulaDeivamOther: this.getFieldValue('kula_deivam_other'),
            kaani: this.getFieldValue('kaani'),
            kaaniOther: this.getFieldValue('kaani_other')
        };
    }

    getFieldValue(fieldType) {
        // Look for member fields first, then fallback to general fields
        const selectors = [
            `select[name="member_${fieldType}"]`,
            `input[name="member_${fieldType}"]`,
            `select[name="${fieldType}"]`,
            `input[name="${fieldType}"]`,
            `select[id="${fieldType}"]`,
            `input[id="${fieldType}"]`
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.value;
            }
        }
        return '';
    }

    handleAutoPopulateChange(checkbox) {
        const targetType = checkbox.dataset.autoPopulate;
        const isChecked = checkbox.checked;

        if (isChecked) {
            this.populateKulamData(targetType);
        } else {
            this.clearKulamData(targetType);
        }
    }

    populateKulamData(targetType) {
        if (!this.memberKulamData) {
            this.updateMemberKulamData();
        }

        const targetPrefix = this.getTargetPrefix(targetType);
        
        if (this.memberKulamData) {
            this.setFieldValue(`${targetPrefix}_kulam`, this.memberKulamData.kulam);
            this.setFieldValue(`${targetPrefix}_kula_deivam`, this.memberKulamData.kulaDeivam);
            this.setFieldValue(`${targetPrefix}_kula_deivam_other`, this.memberKulamData.kulaDeivamOther);
            this.setFieldValue(`${targetPrefix}_kaani`, this.memberKulamData.kaani);
            this.setFieldValue(`${targetPrefix}_kaani_other`, this.memberKulamData.kaaniOther);
            
            // Trigger change events to update UI
            this.triggerChangeEvents(targetPrefix);
        }
    }

    clearKulamData(targetType) {
        const targetPrefix = this.getTargetPrefix(targetType);
        
        this.setFieldValue(`${targetPrefix}_kulam`, '');
        this.setFieldValue(`${targetPrefix}_kula_deivam`, '');
        this.setFieldValue(`${targetPrefix}_kula_deivam_other`, '');
        this.setFieldValue(`${targetPrefix}_kaani`, '');
        this.setFieldValue(`${targetPrefix}_kaani_other`, '');
        
        // Trigger change events to update UI
        this.triggerChangeEvents(targetPrefix);
    }

    getTargetPrefix(targetType) {
        const prefixes = {
            'spouse': 'spouse',
            'child1': 'child_1',
            'child2': 'child_2',
            'child3': 'child_3',
            'father': 'father',
            'mother': 'mother',
            'paternal_grandfather': 'paternal_grandfather',
            'paternal_grandmother': 'paternal_grandmother',
            'maternal_grandfather': 'maternal_grandfather',
            'maternal_grandmother': 'maternal_grandmother',
            'spouse_father': 'spouse_father',
            'spouse_mother': 'spouse_mother',
            'spouse_paternal_grandfather': 'spouse_paternal_grandfather',
            'spouse_paternal_grandmother': 'spouse_paternal_grandmother',
            'spouse_maternal_grandfather': 'spouse_maternal_grandfather',
            'spouse_maternal_grandmother': 'spouse_maternal_grandmother'
        };
        
        return prefixes[targetType] || targetType;
    }

    setFieldValue(fieldName, value) {
        const selectors = [
            `select[name="${fieldName}"]`,
            `input[name="${fieldName}"]`,
            `select[id="${fieldName}"]`,
            `input[id="${fieldName}"]`
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                element.value = value;
                
                // Handle "Other" field visibility
                if (fieldName.includes('kula_deivam') || fieldName.includes('kaani') || fieldName.includes('kulam')) {
                    this.handleOtherFieldVisibility(element);
                }
                break;
            }
        }
    }

    handleOtherFieldVisibility(selectElement) {
        const isOther = selectElement.value === 'other' || selectElement.value === 'Other';
        const otherFieldName = selectElement.name + '_other';
        const otherField = document.querySelector(`input[name="${otherFieldName}"]`);
        
        if (otherField) {
            if (isOther) {
                otherField.classList.remove('hidden');
                otherField.style.display = 'block';
            } else {
                otherField.classList.add('hidden');
                otherField.style.display = 'none';
                otherField.value = '';
            }
        }
    }

    triggerChangeEvents(targetPrefix) {
        const fieldTypes = ['kulam', 'kula_deivam', 'kaani'];
        
        fieldTypes.forEach(fieldType => {
            const element = document.querySelector(`select[name="${targetPrefix}_${fieldType}"]`);
            if (element) {
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    // Static method to create auto-populate checkboxes
    static createAutoPopulateCheckbox(targetType, label) {
        return `
            <div class="flex items-center mb-2">
                <input type="checkbox" 
                       id="auto_populate_${targetType}" 
                       data-auto-populate="${targetType}"
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="auto_populate_${targetType}" class="ml-2 text-sm text-gray-700">
                    ${label}
                </label>
            </div>
        `;
    }

    // Static method to create residence auto-populate checkboxes  
    static createResidenceAutoPopulateCheckbox(targetType, label) {
        return `
            <div class="flex items-center mb-2">
                <input type="checkbox" 
                       id="auto_populate_residence_${targetType}" 
                       data-auto-populate-residence="${targetType}"
                       class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="auto_populate_residence_${targetType}" class="ml-2 text-sm text-gray-700">
                    ${label}
                </label>
            </div>
        `;
    }
}

/**
 * Residence Auto-Population System
 * Handles "Same as Native" and "Same as Grandfather" options
 */
class ResidenceAutoPopulate {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for residence auto-populate checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"][data-auto-populate-residence]')) {
                this.handleResidenceAutoPopulateChange(e.target);
            }
        });
    }

    handleResidenceAutoPopulateChange(checkbox) {
        const targetType = checkbox.dataset.autoPopulateResidence;
        const isChecked = checkbox.checked;

        if (isChecked) {
            this.populateResidenceData(targetType);
        } else {
            this.clearResidenceData(targetType);
        }
    }

    populateResidenceData(targetType) {
        // Implementation for residence auto-population
        // This would copy native place to residence or grandfather's residence to grandmother's
        console.log('Populating residence data for:', targetType);
    }

    clearResidenceData(targetType) {
        // Implementation for clearing residence data
        console.log('Clearing residence data for:', targetType);
    }
}

// Initialize the systems when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new KulamAutoPopulate();
    new ResidenceAutoPopulate();
});

// Export for module use
if (typeof window !== 'undefined') {
    window.KulamAutoPopulate = KulamAutoPopulate;
    window.ResidenceAutoPopulate = ResidenceAutoPopulate;
}
