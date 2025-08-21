/**
 * Children Details Component
 * Reusable component for collecting children information
 */

export class ChildrenDetailsComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            title: 'Children Details',
            description: 'Information about your children',
            sectionId: 'children-details',
            required: false,
            ...options
        };
        this.childrenCount = 0;
        this.data = [];
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
        return `
            <div id="childrenFormsContainer">
                <!-- Children forms will be dynamically added here -->
            </div>

            <div class="mb-6">
                <button type="button" id="addChildBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-plus mr-2"></i>Add Child
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        const addChildBtn = document.getElementById('addChildBtn');
        if (addChildBtn) {
            addChildBtn.addEventListener('click', () => {
                this.addChildForm();
            });
        }
    }

    addChildForm() {
        this.childrenCount++;
        const container = document.getElementById('childrenFormsContainer');
        
        const childForm = document.createElement('div');
        childForm.className = 'child-form border border-gray-200 rounded-lg p-6 mb-4 bg-gray-50';
        childForm.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-lg font-semibold text-gray-900">Child ${this.childrenCount}</h4>
                <button type="button" class="remove-child-btn text-red-600 hover:text-red-800 p-2 rounded">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" name="child_first_name_${this.childrenCount}" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter child's first name">
                        <i class="fas fa-child absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Second Name
                    </label>
                    <div class="relative">
                        <input type="text" name="child_second_name_${this.childrenCount}"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter child's second name (optional)">
                        <i class="fas fa-child absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <select name="child_gender_${this.childrenCount}" required
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                        <i class="fas fa-venus-mars absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="date" name="child_date_of_birth_${this.childrenCount}" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
                        <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Enter child's date of birth</p>
                    <p id="childDobHelp_${this.childrenCount}" class="text-sm text-blue-600 mt-1">📅 Please enter the actual date of birth</p>
                </div>
            </div>
        `;
        
        container.appendChild(childForm);
        
        // Add remove event listener
        childForm.querySelector('.remove-child-btn').addEventListener('click', () => {
            childForm.remove();
        });

        // Add DOB validation
        const dobInput = childForm.querySelector(`input[name="child_date_of_birth_${this.childrenCount}"]`);
        if (dobInput) {
            dobInput.addEventListener('change', (e) => {
                this.validateChildAge(e.target.value, this.childrenCount);
            });
        }
    }

    validateChildAge(dateOfBirth, childIndex) {
        if (!dateOfBirth) return true;
        
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        const childDobHelp = document.getElementById(`childDobHelp_${childIndex}`);
        if (childDobHelp) {
            childDobHelp.textContent = `✅ Age: ${age} years`;
            childDobHelp.className = 'text-sm text-green-600 mt-1';
        }
        
        return true;
    }

    populate(childrenData) {
        this.data = childrenData;
        
        // Clear existing forms
        const container = document.getElementById('childrenFormsContainer');
        if (container) {
            container.innerHTML = '';
            this.childrenCount = 0;
        }
        
        // Add forms for each child
        childrenData.forEach((child, index) => {
            this.addChildForm();
            
            // Populate the form
            const childForm = container.children[index];
            if (childForm) {
                const firstNameInput = childForm.querySelector(`input[name="child_first_name_${index + 1}"]`);
                const secondNameInput = childForm.querySelector(`input[name="child_second_name_${index + 1}"]`);
                const genderSelect = childForm.querySelector(`select[name="child_gender_${index + 1}"]`);
                const dobInput = childForm.querySelector(`input[name="child_date_of_birth_${index + 1}"]`);
                
                if (firstNameInput) firstNameInput.value = child.first_name || '';
                if (secondNameInput) secondNameInput.value = child.second_name || '';
                if (genderSelect) genderSelect.value = child.gender || '';
                if (dobInput) {
                    dobInput.value = child.date_of_birth || '';
                    if (child.date_of_birth) {
                        this.validateChildAge(child.date_of_birth, index + 1);
                    }
                }
            }
        });
    }

    getData() {
        const childForms = document.querySelectorAll('.child-form');
        const childrenData = [];
        
        childForms.forEach((form, index) => {
            const childData = {};
            const inputs = form.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                const key = input.name.replace(`_${index + 1}`, '');
                childData[key] = input.value;
            });
            
            if (childData.child_first_name) {
                childrenData.push(childData);
            }
        });
        
        return childrenData;
    }

    validate() {
        const childrenData = this.getData();
        
        for (let i = 0; i < childrenData.length; i++) {
            const child = childrenData[i];
            
            if (!child.child_first_name || !child.child_gender || !child.child_date_of_birth) {
                return { 
                    valid: false, 
                    message: `Please fill in all required fields for Child ${i + 1}` 
                };
            }
        }
        
        return { valid: true };
    }

    autoAddFirstChild() {
        // Auto-add first child if container is empty
        const container = document.getElementById('childrenFormsContainer');
        if (container && container.children.length === 0) {
            this.addChildForm();
        }
    }
}
