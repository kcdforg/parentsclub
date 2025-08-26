/**
 * Gender-Based Kulam Collection System
 * Implements smart Kulam collection based on member's gender following patrilineal rules
 */

class GenderBasedKulamSystem {
    constructor() {
        this.memberGender = null;
        this.kulamRequirements = {
            Male: {
                collect: [
                    'member',           // Copy for: member's children, father, paternal grandfather
                    'member_mother',    // Copy for: member's maternal grandfather  
                    'member_paternal_grandmother',
                    'member_maternal_grandmother',
                    'spouse',          // Copy for: spouse's father, paternal grandfather
                    'spouse_mother',   // Copy for: spouse's maternal grandfather
                    'spouse_paternal_grandmother',
                    'spouse_maternal_grandmother'
                ],
                copyMap: {
                    'member': ['member_children', 'member_father', 'member_paternal_grandfather'],
                    'member_mother': ['member_maternal_grandfather'],
                    'spouse': ['spouse_father', 'spouse_paternal_grandfather']
                }
            },
            Female: {
                collect: [
                    'member',          // Copy for: member's father, paternal grandfather
                    'member_mother',   // Copy for: member's maternal grandfather
                    'member_paternal_grandmother',
                    'member_maternal_grandmother', 
                    'spouse',          // Copy for: spouse's children, father, paternal grandfather
                    'spouse_mother',   // Copy for: spouse's maternal grandfather
                    'spouse_paternal_grandmother',
                    'spouse_maternal_grandmother'
                ],
                copyMap: {
                    'member': ['member_father', 'member_paternal_grandfather'],
                    'member_mother': ['member_maternal_grandfather'],
                    'spouse': ['spouse_children', 'spouse_father', 'spouse_paternal_grandfather']
                }
            }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBasedOnGender();
    }

    setupEventListeners() {
        // Listen for gender changes
        const genderField = document.getElementById('gender');
        if (genderField) {
            genderField.addEventListener('change', () => {
                this.memberGender = genderField.value;
                this.updateBasedOnGender();
                this.updateKulamCollectionInfo();
            });
        }

        // Listen for kulam field changes to trigger auto-population
        document.addEventListener('change', (e) => {
            if (e.target.matches('select[name*="kulam"], input[name*="kulam"]')) {
                this.handleKulamFieldChange(e.target);
            }
        });
    }

    updateBasedOnGender() {
        const genderField = document.getElementById('gender');
        if (genderField && genderField.value) {
            this.memberGender = genderField.value;
            this.updateKulamCollectionInfo();
            this.hideUnnecessaryKulamSections();
        }
    }

    updateKulamCollectionInfo() {
        const infoContainer = document.getElementById('kulamCollectionInfo');
        if (!infoContainer || !this.memberGender || this.memberGender === 'Others') {
            if (infoContainer) {
                infoContainer.innerHTML = '<p class="text-gray-600">Select gender to see Kulam collection strategy</p>';
            }
            return;
        }

        const requirements = this.kulamRequirements[this.memberGender];
        if (!requirements) return;

        let infoHtml = `
            <div class="bg-white p-3 rounded border border-blue-200 mb-2">
                <strong class="text-blue-900">As a ${this.memberGender.toLowerCase()}, we'll collect Kulam details for:</strong>
                <ul class="mt-1 space-y-1">
        `;

        const labels = {
            'member': 'You (Member)',
            'member_mother': 'Your Mother', 
            'member_paternal_grandmother': 'Your Paternal Grandmother',
            'member_maternal_grandmother': 'Your Maternal Grandmother',
            'spouse': 'Your Spouse',
            'spouse_mother': 'Spouse\'s Mother',
            'spouse_paternal_grandmother': 'Spouse\'s Paternal Grandmother',
            'spouse_maternal_grandmother': 'Spouse\'s Maternal Grandmother'
        };

        requirements.collect.forEach(key => {
            const copyTargets = requirements.copyMap[key] || [];
            const copyText = copyTargets.length > 0 ? 
                ` <span class="text-green-600">(auto-copies to: ${copyTargets.map(t => this.getTargetLabel(t)).join(', ')})</span>` : '';
            infoHtml += `<li class="text-sm">• ${labels[key] || key}${copyText}</li>`;
        });

        infoHtml += `
                </ul>
            </div>
        `;

        infoContainer.innerHTML = infoHtml;
    }

    getTargetLabel(target) {
        const labels = {
            'member_children': 'Your Children',
            'member_father': 'Your Father',
            'member_paternal_grandfather': 'Your Paternal Grandfather',
            'member_maternal_grandfather': 'Your Maternal Grandfather',
            'spouse_children': 'Spouse\'s Children',
            'spouse_father': 'Spouse\'s Father',
            'spouse_paternal_grandfather': 'Spouse\'s Paternal Grandfather'
        };
        return labels[target] || target;
    }

    hideUnnecessaryKulamSections() {
        if (!this.memberGender || this.memberGender === 'Others') return;

        const requirements = this.kulamRequirements[this.memberGender];
        if (!requirements) return;

        // Hide sections that are not in the collect list
        const allSections = [
            'member', 'member_mother', 'member_paternal_grandmother', 'member_maternal_grandmother',
            'spouse', 'spouse_mother', 'spouse_paternal_grandmother', 'spouse_maternal_grandmother'
        ];

        allSections.forEach(section => {
            if (!requirements.collect.includes(section)) {
                this.hideKulamSection(section);
            } else {
                this.showKulamSection(section);
            }
        });
    }

    hideKulamSection(sectionKey) {
        // Implementation would hide specific kulam sections in family tree
        // This depends on how the family tree components are structured
        console.log(`Hiding Kulam section for: ${sectionKey}`);
    }

    showKulamSection(sectionKey) {
        // Implementation would show specific kulam sections in family tree
        console.log(`Showing Kulam section for: ${sectionKey}`);
    }

    handleKulamFieldChange(changedField) {
        if (!this.memberGender || this.memberGender === 'Others') return;

        const requirements = this.kulamRequirements[this.memberGender];
        if (!requirements) return;

        // Determine which source field changed
        const sourceKey = this.identifySourceField(changedField);
        if (!sourceKey) return;

        // Get targets to copy to
        const targets = requirements.copyMap[sourceKey] || [];
        
        // Perform the copy
        this.copyKulamData(changedField, targets);
    }

    identifySourceField(field) {
        const fieldName = field.name;
        
        // Map field names to source keys
        if (fieldName.includes('kulam') && !fieldName.includes('spouse')) {
            if (fieldName.includes('mother')) return 'member_mother';
            return 'member';
        } else if (fieldName.includes('spouse') && fieldName.includes('kulam')) {
            if (fieldName.includes('mother')) return 'spouse_mother';
            return 'spouse';
        }
        
        return null;
    }

    copyKulamData(sourceField, targets) {
        const sourceValue = sourceField.value;
        const fieldType = this.getKulamFieldType(sourceField.name);

        targets.forEach(target => {
            const targetFieldName = `${target}_${fieldType}`;
            const targetField = document.querySelector(`[name="${targetFieldName}"]`);
            
            if (targetField) {
                targetField.value = sourceValue;
                
                // Trigger change event to handle "Other" field visibility
                targetField.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Show visual feedback
                this.showCopyFeedback(targetField);
            }
        });
    }

    getKulamFieldType(fieldName) {
        if (fieldName.includes('kula_deivam')) return 'kula_deivam';
        if (fieldName.includes('kaani')) return 'kaani';
        return 'kulam';
    }

    showCopyFeedback(field) {
        // Add temporary visual feedback
        field.classList.add('bg-green-100', 'border-green-500');
        
        setTimeout(() => {
            field.classList.remove('bg-green-100', 'border-green-500');
        }, 1000);
    }

    // Method to remove old auto-populate checkboxes
    removeOldAutoPopulateCheckboxes() {
        const oldCheckboxes = document.querySelectorAll('[data-auto-populate]');
        oldCheckboxes.forEach(checkbox => {
            const container = checkbox.closest('.bg-blue-50');
            if (container) {
                container.remove();
            }
        });
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const kulamSystem = new GenderBasedKulamSystem();
    
    // Remove old auto-populate checkboxes after a delay
    setTimeout(() => {
        kulamSystem.removeOldAutoPopulateCheckboxes();
    }, 1000);
});

// Export for module use
if (typeof window !== 'undefined') {
    window.GenderBasedKulamSystem = GenderBasedKulamSystem;
}
