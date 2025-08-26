import { apiFetch } from './api.js';
import { formRelationships } from './form-relationships.js';
import { MemberDetailsComponent } from './components/MemberDetailsComponent.js';
import { SpouseDetailsComponent } from './components/SpouseDetailsComponent.js';
import { ChildrenDetailsComponent } from './components/ChildrenDetailsComponent.js';
import { ParentsComponent } from './components/ParentsComponent.js';
import { GrandparentsComponent } from './components/GrandparentsComponent.js';

// State management
let userData = {};
let sectionCompletionStatus = {
    'member-details': false,
    'spouse-details': false,
    'children-details': false,
    'member-family-tree': false,
    'spouse-family-tree': false
};

// Component instances
let memberDetailsComponent;
let spouseDetailsComponent;
let childrenDetailsComponent;
let memberParentsComponent;
let memberPaternalGrandparentsComponent;
let memberMaternalGrandparentsComponent;
let spouseParentsComponent;
let spousePaternalGrandparentsComponent;
let spouseMaternalGrandparentsComponent;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    // Check authentication first
    const sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    initializeEventListeners();
    
    // Load existing profile data and populate form (this will include intro data from database)
    await loadExistingProfile();
    
    // Populate location data after DOM is ready
    populateLocationData();
    
    // Initialize sections
    initializeSections();
    
    // Initialize components
    initializeComponents();
    
    // Initialize DOB functionality
    initializeDOBFields();
    
    // Initialize Kulam functionality
    initializeKulamFields();
    
    // Wait for form relationships to load and populate dropdowns
    setTimeout(() => {
        console.log('Form relationships loaded:', formRelationships.isLoaded);
        if (!formRelationships.isLoaded) {
            console.log('Waiting for form relationships to load...');
            formRelationships.init();
        }
    }, 500);
    
    // Initialize Education functionality
    initializeEducationFields();
    
    // Initialize Profession functionality
    initializeProfessionFields();
}

function initializeEventListeners() {
    // Section save buttons
    document.getElementById('saveMemberDetails')?.addEventListener('click', () => saveMemberDetails());
    document.getElementById('saveSpouseDetails')?.addEventListener('click', () => saveSpouseDetails());
    document.getElementById('saveChildrenDetails')?.addEventListener('click', () => saveChildrenDetails());
    // Individual family tree save buttons are handled by components
    
    // Save & Submit button
    document.getElementById('saveSubmitBtn')?.addEventListener('click', () => handleSaveSubmit());

    // Child management
    document.getElementById('addChildBtn')?.addEventListener('click', addChildForm);
    
    // Add form change listeners to reset save button states
    setupFormChangeListeners();
}

function setupFormChangeListeners() {
    // Member details form
    const memberForm = document.getElementById('memberDetailsForm');
    if (memberForm) {
        memberForm.addEventListener('input', () => {
            if (sectionSaveStates['member-details']) {
                setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
                sectionSaveStates['member-details'] = false;
            }
        });
        memberForm.addEventListener('change', () => {
            if (sectionSaveStates['member-details']) {
                setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
                sectionSaveStates['member-details'] = false;
            }
        });
    }
    
    // Spouse details form
    const spouseForm = document.getElementById('spouseDetailsForm');
    if (spouseForm) {
        spouseForm.addEventListener('input', () => {
            if (sectionSaveStates['spouse-details']) {
                setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
                sectionSaveStates['spouse-details'] = false;
            }
        });
        spouseForm.addEventListener('change', () => {
            if (sectionSaveStates['spouse-details']) {
                setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
                sectionSaveStates['spouse-details'] = false;
            }
        });
    }
    
    // Children details - we'll handle this in the addChildForm function for dynamic forms
}

function initializeKulamFields() {
    // Setup "Other" option toggles for Member Kulam fields
    setupKulamOtherToggle('kulam', 'kulamOther');
    setupKulamOtherToggle('kulaDeivam', 'kulaDeivamOther');
    setupKulamOtherToggle('kaani', 'kaaniOther');
    
    // Setup "Other" option toggles for Spouse Kulam fields
    setupKulamOtherToggle('spouseKulam', 'spouseKulamOther');
    setupKulamOtherToggle('spouseKulaDeivam', 'spouseKulaDeivamOther');
    setupKulamOtherToggle('spouseKaani', 'spouseKaaniOther');
    
    // Load Kulam data options (placeholder for now - will be populated from admin settings)
    populateKulamOptions();
}

function setupKulamOtherToggle(selectId, otherInputId) {
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

function populateKulamOptions() {
    // Add CSS classes for relationship management
    const kulamDropdowns = ['kulam', 'spouseKulam'];
    const kulaDeivamDropdowns = ['kulaDeivam', 'spouseKulaDeivam'];
    const kaaniDropdowns = ['kaani', 'spouseKaani'];
    
    kulamDropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('kulam-dropdown');
    });
    
    kulaDeivamDropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('kula-deivam-dropdown');
    });
    
    kaaniDropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('kaani-dropdown');
    });
    
    // The actual population will be handled by formRelationships
}

function populateDropdown(selectId, options) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    
    // Clear existing options except the first two (default and "other")
    while (selectElement.children.length > 2) {
        selectElement.removeChild(selectElement.lastChild);
    }
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.toLowerCase().replace(/\s+/g, '_');
        optionElement.textContent = option;
        selectElement.insertBefore(optionElement, selectElement.lastElementChild);
    });
}

function populateChildKulamDropdowns(childNumber) {
    // Add CSS classes for relationship management
    const childKulamId = `childKulam_${childNumber}`;
    const childKulaDeivamId = `childKulaDeivam_${childNumber}`;
    const childKaaniId = `childKaani_${childNumber}`;
    
    const kulamElement = document.getElementById(childKulamId);
    const kulaDeivamElement = document.getElementById(childKulaDeivamId);
    const kaaniElement = document.getElementById(childKaaniId);
    
    if (kulamElement) kulamElement.classList.add('kulam-dropdown');
    if (kulaDeivamElement) kulaDeivamElement.classList.add('kula-deivam-dropdown');
    if (kaaniElement) kaaniElement.classList.add('kaani-dropdown');
    
    // Populate the new dropdowns using the form relationships system
    if (formRelationships.isLoaded) {
        formRelationships.populateAllDropdowns();
    }
}

function initializeEducationFields() {
    // Initialize enhanced education components
    try {
        if (typeof EnhancedEducationComponent !== 'undefined') {
            // Initialize enhanced education for member
            const memberEducation = new EnhancedEducationComponent('member');
            
            // Initialize enhanced education for spouse if section exists
            const spouseEducationContainer = document.getElementById('spouseEducationContainer');
            if (spouseEducationContainer) {
                const spouseEducation = new EnhancedEducationComponent('spouse');
            }
            
            // Initialize for children (up to 10 children)
            window.childrenEducationComponents = [];
            for (let i = 1; i <= 10; i++) {
                const childContainer = document.getElementById(`child_${i}_educationContainer`);
                if (childContainer) {
                    window.childrenEducationComponents[i] = new EnhancedEducationComponent('child', i);
                    console.log(`Initialized education component for child ${i}`);
                }
            }
            
            console.log('Enhanced education components initialized');
        } else {
            // Fallback to old system
            console.log('Enhanced education component not available, using fallback');
            initializeLegacyEducationFields();
        }
    } catch (error) {
        console.error('Error initializing education fields:', error);
        initializeLegacyEducationFields();
    }
}

function initializeLegacyEducationFields() {
    // Legacy education field initialization
    const memberEducationBtn = document.getElementById('addMemberEducationBtn');
    const spouseEducationBtn = document.getElementById('addSpouseEducationBtn');
    
    console.log('Member education button found:', !!memberEducationBtn);
    console.log('Spouse education button found:', !!spouseEducationBtn);
    
    if (memberEducationBtn) {
        memberEducationBtn.addEventListener('click', () => {
            console.log('Member education button clicked');
            addEducationEntry('member');
        });
    }
    
    if (spouseEducationBtn) {
        spouseEducationBtn.addEventListener('click', () => {
            console.log('Spouse education button clicked'); 
            addEducationEntry('spouse');
        });
    }
    
    // Setup delegation for child education buttons (they're dynamic)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('addChildEducationBtn')) {
            const childNumber = e.target.getAttribute('data-child');
            addEducationEntry('child', childNumber);
        }
    });
}

let educationCounter = {
    member: 0,
    spouse: 0,
    child: {}
};

function addEducationEntry(type, childNumber = null) {
    const containerId = type === 'child' ? `childEducationContainer_${childNumber}` : `${type}EducationContainer`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Education container ${containerId} not found`);
        return;
    }
    
    // Initialize counter for this type/child
    if (type === 'child') {
        if (!educationCounter.child[childNumber]) {
            educationCounter.child[childNumber] = 0;
        }
        educationCounter.child[childNumber]++;
    } else {
        educationCounter[type]++;
    }
    
    const entryNumber = type === 'child' ? educationCounter.child[childNumber] : educationCounter[type];
    const entryId = type === 'child' ? `${type}_${childNumber}_education_${entryNumber}` : `${type}_education_${entryNumber}`;
    
    const educationHTML = `
        <div class="education-entry border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50" id="${entryId}">
            <div class="flex justify-between items-center mb-4">
                <h6 class="text-sm font-semibold text-gray-900">Education ${entryNumber}</h6>
                <button type="button" class="remove-education-btn text-red-600 hover:text-red-800 p-1 rounded text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Degree <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" name="${entryId}_degree" required
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary education-degree degree-input"
                               placeholder="e.g., B.Tech, MBA, Ph.D"
                               list="${entryId}_degree_list">
                        <i class="fas fa-graduation-cap absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <datalist id="${entryId}_degree_list" class="degree-datalist">
                            <!-- Will be populated with autocomplete options -->
                        </datalist>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Department/Field
                    </label>
                    <div class="relative">
                        <input type="text" name="${entryId}_department"
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary education-department"
                               placeholder="e.g., Computer Science, Business"
                               list="${entryId}_department_list">
                        <i class="fas fa-book absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <datalist id="${entryId}_department_list" class="department-datalist">
                            <!-- Will be populated with autocomplete options -->
                        </datalist>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Year of Completion <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <select name="${entryId}_year" required
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                            <option value="">Select Year</option>
                            <!-- Years will be populated by JavaScript -->
                        </select>
                        <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Institution
                    </label>
                    <div class="relative">
                        <input type="text" name="${entryId}_institution"
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary education-institution"
                               placeholder="e.g., IIT Madras, Anna University"
                               list="${entryId}_institution_list">
                        <i class="fas fa-university absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <datalist id="${entryId}_institution_list" class="institution-datalist">
                            <!-- Will be populated with autocomplete options -->
                        </datalist>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', educationHTML);
    
    // Add event listener for remove button
    const newEntry = container.lastElementChild;
    const removeBtn = newEntry.querySelector('.remove-education-btn');
    removeBtn.addEventListener('click', () => {
        newEntry.remove();
        // Reset save state when form is modified
        if (type === 'member' && sectionSaveStates['member-details']) {
            setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
            sectionSaveStates['member-details'] = false;
        } else if (type === 'spouse' && sectionSaveStates['spouse-details']) {
            setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
            sectionSaveStates['spouse-details'] = false;
        } else if (type === 'child' && sectionSaveStates['children-details']) {
            setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
            sectionSaveStates['children-details'] = false;
        }
    });
    
    // Populate year dropdown
    populateYearDropdown(newEntry.querySelector(`select[name="${entryId}_year"]`));
    
    // Setup autocomplete for this entry
    setupEducationAutocomplete(entryId);
    
    // Populate the new datalists using the form relationships system
    if (formRelationships.isLoaded) {
        formRelationships.populateAllDropdowns();
    }
    
    // Add change listeners for save state management
    const inputs = newEntry.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (type === 'member' && sectionSaveStates['member-details']) {
                setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
                sectionSaveStates['member-details'] = false;
            } else if (type === 'spouse' && sectionSaveStates['spouse-details']) {
                setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
                sectionSaveStates['spouse-details'] = false;
            } else if (type === 'child' && sectionSaveStates['children-details']) {
                setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
                sectionSaveStates['children-details'] = false;
            }
        });
    });
}

function populateYearDropdown(selectElement) {
    if (!selectElement) return;
    
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1960; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    }
}

function setupEducationAutocomplete(entryId) {
    // Education autocomplete is now handled by the form relationships system
    // which loads data from admin-managed database via API
    
    // The datalists will be populated by formRelationships.populateAllDropdowns()
    // which runs during page initialization and loads:
    // - Degree options from database (with fallback data)
    // - Department options with smart filtering based on selected degree
    // - Institution options from database (with fallback data)
    
    // The CSS classes are already added in addEducationEntry() function:
    // - 'degree-datalist' for degree autocomplete
    // - 'department-datalist' for department autocomplete (with relationships)
    // - 'institution-datalist' for institution autocomplete
    
    // No additional setup needed - the form-relationships.js handles everything
}

// populateDatalist function removed - now handled by form-relationships.js system

function initializeProfessionFields() {
    // Setup add profession button event listeners with debugging
    const memberProfessionBtn = document.getElementById('addMemberProfessionBtn');
    const spouseProfessionBtn = document.getElementById('addSpouseProfessionBtn');
    
    console.log('Member profession button found:', !!memberProfessionBtn);
    console.log('Spouse profession button found:', !!spouseProfessionBtn);
    
    if (memberProfessionBtn) {
        memberProfessionBtn.addEventListener('click', () => {
            console.log('Member profession button clicked');
            addProfessionEntry('member');
        });
    }
    
    if (spouseProfessionBtn) {
        spouseProfessionBtn.addEventListener('click', () => {
            console.log('Spouse profession button clicked');
            addProfessionEntry('spouse');
        });
    }
    
    // Setup delegation for child profession buttons (they're dynamic)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('addChildProfessionBtn')) {
            const childNumber = e.target.getAttribute('data-child');
            addProfessionEntry('child', childNumber);
        }
    });
}

let professionCounter = {
    member: 0,
    spouse: 0,
    child: {}
};

function addProfessionEntry(type, childNumber = null) {
    const containerId = type === 'child' ? `childProfessionContainer_${childNumber}` : `${type}ProfessionContainer`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Profession container ${containerId} not found`);
        return;
    }
    
    // Initialize counter for this type/child
    if (type === 'child') {
        if (!professionCounter.child[childNumber]) {
            professionCounter.child[childNumber] = 0;
        }
        professionCounter.child[childNumber]++;
    } else {
        professionCounter[type]++;
    }
    
    const entryNumber = type === 'child' ? professionCounter.child[childNumber] : professionCounter[type];
    const entryId = type === 'child' ? `${type}_${childNumber}_profession_${entryNumber}` : `${type}_profession_${entryNumber}`;
    
    const professionHTML = `
        <div class="profession-entry border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50" id="${entryId}">
            <div class="flex justify-between items-center mb-4">
                <h6 class="text-sm font-semibold text-gray-900">Profession ${entryNumber}</h6>
                <button type="button" class="remove-profession-btn text-red-600 hover:text-red-800 p-1 rounded text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Job Type <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <select name="${entryId}_job_type" required
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white profession-job-type">
                            <option value="">Select Job Type</option>
                            <option value="self_employed">Self-employed</option>
                            <option value="government">Government</option>
                            <option value="private">Private</option>
                            <option value="others">Others</option>
                        </select>
                        <i class="fas fa-briefcase absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <input type="text" name="${entryId}_job_type_other" placeholder="Please specify job type"
                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden job-type-other">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                    </label>
                    <div class="relative">
                        <input type="text" name="${entryId}_company"
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary profession-company"
                               placeholder="e.g., TCS, Infosys, Google"
                               list="${entryId}_company_list">
                        <i class="fas fa-building absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <datalist id="${entryId}_company_list" class="company-datalist">
                            <!-- Will be populated with autocomplete options -->
                        </datalist>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Position/Role
                    </label>
                    <div class="relative">
                        <input type="text" name="${entryId}_position"
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary profession-position"
                               placeholder="e.g., Software Engineer, Manager"
                               list="${entryId}_position_list">
                        <i class="fas fa-user-tie absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <datalist id="${entryId}_position_list" class="position-datalist">
                            <!-- Will be populated with autocomplete options -->
                        </datalist>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Experience
                    </label>
                    <div class="flex space-x-2">
                        <div class="flex-1">
                            <div class="relative">
                                <select name="${entryId}_experience_years"
                                        class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                                    <option value="">Years</option>
                                    <!-- Years will be populated by JavaScript -->
                                </select>
                                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Yr</span>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="relative">
                                <select name="${entryId}_experience_months"
                                        class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                                    <option value="">Months</option>
                                    <!-- Months will be populated by JavaScript -->
                                </select>
                                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Mo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', professionHTML);
    
    // Add event listener for remove button
    const newEntry = container.lastElementChild;
    const removeBtn = newEntry.querySelector('.remove-profession-btn');
    removeBtn.addEventListener('click', () => {
        newEntry.remove();
        // Reset save state when form is modified
        if (type === 'member' && sectionSaveStates['member-details']) {
            setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
            sectionSaveStates['member-details'] = false;
        } else if (type === 'spouse' && sectionSaveStates['spouse-details']) {
            setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
            sectionSaveStates['spouse-details'] = false;
        } else if (type === 'child' && sectionSaveStates['children-details']) {
            setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
            sectionSaveStates['children-details'] = false;
        }
    });
    
    // Setup job type "Others" toggle
    const jobTypeSelect = newEntry.querySelector('.profession-job-type');
    const jobTypeOther = newEntry.querySelector('.job-type-other');
    
    jobTypeSelect.addEventListener('change', function() {
        if (this.value === 'others') {
            jobTypeOther.classList.remove('hidden');
            jobTypeOther.required = true;
        } else {
            jobTypeOther.classList.add('hidden');
            jobTypeOther.required = false;
            jobTypeOther.value = '';
        }
    });
    
    // Populate experience dropdowns
    populateExperienceDropdowns(newEntry.querySelector(`select[name="${entryId}_experience_years"]`), 
                                newEntry.querySelector(`select[name="${entryId}_experience_months"]`));
    
    // Setup autocomplete for this entry
    setupProfessionAutocomplete(entryId);
    
    // Populate the new datalists using the form relationships system
    if (formRelationships.isLoaded) {
        formRelationships.populateAllDropdowns();
    }
    
    // Add change listeners for save state management
    const inputs = newEntry.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (type === 'member' && sectionSaveStates['member-details']) {
                setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
                sectionSaveStates['member-details'] = false;
            } else if (type === 'spouse' && sectionSaveStates['spouse-details']) {
                setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
                sectionSaveStates['spouse-details'] = false;
            } else if (type === 'child' && sectionSaveStates['children-details']) {
                setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
                sectionSaveStates['children-details'] = false;
            }
        });
    });
}

function populateExperienceDropdowns(yearsSelect, monthsSelect) {
    if (yearsSelect) {
        for (let years = 0; years <= 50; years++) {
            const option = document.createElement('option');
            option.value = years;
            option.textContent = years === 0 ? '0' : years === 1 ? '1 year' : `${years} years`;
            yearsSelect.appendChild(option);
        }
    }
    
    if (monthsSelect) {
        for (let months = 0; months <= 11; months++) {
            const option = document.createElement('option');
            option.value = months;
            option.textContent = months === 0 ? '0' : months === 1 ? '1 month' : `${months} months`;
            monthsSelect.appendChild(option);
        }
    }
}

function setupProfessionAutocomplete(entryId) {
    // Profession autocomplete is now handled by the form relationships system
    // which loads data from admin-managed database via API
    
    // The datalists will be populated by formRelationships.populateAllDropdowns()
    // which runs during page initialization and loads:
    // - Company options from database (with fallback data)
    // - Position options from database (with fallback data)
    
    // The CSS classes are already added in addProfessionEntry() function:
    // - 'company-datalist' for company autocomplete
    // - 'position-datalist' for position autocomplete
    
    // No additional setup needed - the form-relationships.js handles everything
}

function updateSectionVisibility() {
    console.log('updateSectionVisibility called with userData:', userData);
    
    // Show/hide spouse sections based on marriage status
    const spouseSection = document.getElementById('spouseSection');
    const spouseFamilySection = document.getElementById('spouseFamilySection');
    
    if (userData.isMarried === 'yes') {
        if (spouseSection) spouseSection.style.display = 'block';
        if (spouseFamilySection) spouseFamilySection.style.display = 'block';
    } else {
        if (spouseSection) spouseSection.style.display = 'none';
        if (spouseFamilySection) spouseFamilySection.style.display = 'none';
        // Mark spouse sections as completed since they're not needed
        sectionCompletionStatus['spouse-details'] = true;
        sectionCompletionStatus['spouse-family-tree'] = true;
    }
    
    // Show/hide children section based on hasChildren
    const childrenSection = document.getElementById('childrenSection');
    if (userData.hasChildren === 'yes') {
        if (childrenSection) childrenSection.style.display = 'block';
        // Auto-add first child form if no children forms exist
        setTimeout(() => {
            const childrenContainer = document.getElementById('childrenFormsContainer');
            if (childrenContainer && childrenContainer.children.length === 0) {
                addChildForm();
            }
        }, 100);
    } else {
        if (childrenSection) childrenSection.style.display = 'none';
        // Mark children section as completed since they're not needed
        sectionCompletionStatus['children-details'] = true;
    }
    
    updateSectionNumbering();
    updateSaveSubmitButton();
}

function updateSectionNumbering() {
    let visibleSectionNumber = 1;
    
    // Define all sections in order
    const sections = [
        { id: 'member-details', element: document.querySelector('[data-section="member-details"]') },
        { id: 'spouse-details', element: document.getElementById('spouseSection') },
        { id: 'children-details', element: document.getElementById('childrenSection') },
        { id: 'member-family-tree', element: document.querySelector('[data-section="member-family-tree"]') },
        { id: 'spouse-family-tree', element: document.getElementById('spouseFamilySection') }
    ];
    
    sections.forEach(section => {
        if (section.element && section.element.style.display !== 'none') {
            const numberCircle = section.element.querySelector('.w-8.h-8');
            if (numberCircle) {
                numberCircle.textContent = visibleSectionNumber;
                visibleSectionNumber++;
            }
        }
    });
}

function initializeSections() {
    // Set first section as expanded by default
    const firstSection = document.getElementById('member-details-content');
    if (firstSection) {
        firstSection.style.display = 'block';
        const firstIcon = document.getElementById('member-details-icon');
        if (firstIcon) firstIcon.classList.add('rotate-180');
    }
}

function initializeComponents() {
    // Initialize Member Details Component (keeping existing form)
    // Note: Member details form is already in HTML, so we don't render the component
    
    // Initialize Spouse Details Component (keeping existing form)
    // Note: Spouse details form is already in HTML, so we don't render the component
    
    // Initialize Children Details Component (keeping existing functionality)
    // Note: Children details functionality is already implemented
    
    // Initialize Family Tree Components
    
    // Member Family Tree Components
    memberParentsComponent = new ParentsComponent('memberParentsContainer', {
        title: 'Parents',
        prefix: '',
        sectionId: 'parents',
        onSave: saveFamilyTreeSubsection
    });
    memberParentsComponent.render();
    
    memberPaternalGrandparentsComponent = new GrandparentsComponent('memberPaternalGrandparentsContainer', {
        title: 'Paternal Grandparents',
        prefix: '',
        type: 'paternal',
        icon: 'fa-male',
        iconColor: 'green-500',
        onSave: saveFamilyTreeSubsection
    });
    memberPaternalGrandparentsComponent.render();
    
    memberMaternalGrandparentsComponent = new GrandparentsComponent('memberMaternalGrandparentsContainer', {
        title: 'Maternal Grandparents',
        prefix: '',
        type: 'maternal',
        icon: 'fa-female',
        iconColor: 'pink-500',
        onSave: saveFamilyTreeSubsection
    });
    memberMaternalGrandparentsComponent.render();
    
    // Spouse Family Tree Components
    spouseParentsComponent = new ParentsComponent('spouseParentsContainer', {
        title: 'Spouse\'s Parents',
        prefix: 'spouse_',
        sectionId: 'parents',
        onSave: saveFamilyTreeSubsection
    });
    spouseParentsComponent.render();
    
    spousePaternalGrandparentsComponent = new GrandparentsComponent('spousePaternalGrandparentsContainer', {
        title: 'Spouse\'s Paternal Grandparents',
        prefix: 'spouse_',
        type: 'paternal',
        icon: 'fa-male',
        iconColor: 'green-500',
        onSave: saveFamilyTreeSubsection
    });
    spousePaternalGrandparentsComponent.render();
    
    spouseMaternalGrandparentsComponent = new GrandparentsComponent('spouseMaternalGrandparentsContainer', {
        title: 'Spouse\'s Maternal Grandparents',
        prefix: 'spouse_',
        type: 'maternal',
        icon: 'fa-female',
        iconColor: 'pink-500',
        onSave: saveFamilyTreeSubsection
    });
    spouseMaternalGrandparentsComponent.render();
}

// Global functions for HTML onclick handlers
window.toggleSection = function(sectionId) {
    console.log('Toggle section called for:', sectionId);
    const content = document.getElementById(sectionId + '-content');
    const icon = document.getElementById(sectionId + '-icon');
    
    console.log('Content element found:', !!content);
    console.log('Icon element found:', !!icon);
    
    if (content && icon) {
        const isHidden = content.style.display === 'none' || content.style.display === '';
        if (isHidden) {
            content.style.display = 'block';
            icon.classList.add('rotate-180');
            console.log('✅ Section expanded:', sectionId);
        } else {
            content.style.display = 'none';
            icon.classList.remove('rotate-180');
            console.log('✅ Section collapsed:', sectionId);
        }
    } else {
        console.log('❌ Elements not found for section:', sectionId);
    }
}

// Ensure toggleSection is globally available
if (typeof window !== 'undefined') {
    window.toggleSection = window.toggleSection;
};

window.toggleSubsection = function(subsectionId) {
    const content = document.getElementById(subsectionId + '-content');
    const icon = document.getElementById(subsectionId + '-icon');
    
    if (content && icon) {
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            icon.classList.add('rotate-180');
        } else {
            content.style.display = 'none';
            icon.classList.remove('rotate-180');
        }
    }
};

function validateSession() {
    const sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    return true;
}

async function saveMemberDetails() {
    if (!validateSession()) return;
    
    const spinner = document.getElementById('saveMemberSpinner');
    
    try {
        setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save', true);
        spinner.classList.remove('hidden');
        
        // Validate age before saving
        const dobInput = document.getElementById('dateOfBirth');
        if (dobInput && dobInput.value) {
            // First validate for future dates
            if (!validateFutureDate(dobInput.value)) {
                markSectionError('member-details');
                showNotification('Date of birth cannot be in the future.', 'error');
                return;
            }
            
            // Then validate age requirement
            if (!validateMemberAge(dobInput.value)) {
                markSectionError('member-details');
                showNotification('You must be at least 18 years old to register.', 'error');
                return;
            }
        } else {
            markSectionError('member-details');
            showNotification('Date of birth is required.', 'error');
            return;
        }
        
        const memberDetails = getFormData('memberDetailsForm');
        
        // Add education data
        memberDetails.education = getEducationData('member');
        // Add profession data
        memberDetails.profession = getProfessionData('member');
        
        // Validate email format if provided
        if (memberDetails.email && memberDetails.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(memberDetails.email.trim())) {
                markSectionError('member-details');
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
        }
        
        // Ensure phone number is properly formatted with country code
        if (memberDetails.phone && memberDetails.country_code) {
            memberDetails.phone = memberDetails.country_code + memberDetails.phone;
            console.log('Phone number formatted:', memberDetails.phone);
        }
        
        console.log('Saving member details:', memberDetails);
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: 'member_details',
                member_details: memberDetails
            })
        });
        
        console.log('Member details save response:', response);

        if (response.success) {
            markSectionComplete('member-details');
            setSaveButtonState('saveMemberDetails', 'saveMemberText', 'saved');
            sectionSaveStates['member-details'] = true;
            showNotification('Member details saved successfully!', 'success');
            checkProfileCompletion();
        } else {
            markSectionError('member-details');
            setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
            throw new Error(response.error || 'Failed to save member details.');
        }
    } catch (error) {
        console.error('Error saving member details:', error);
        markSectionError('member-details');
        
        // More detailed error message
        let errorMessage = 'Failed to save member details';
        if (error.message.includes('Authorization token required')) {
            errorMessage += ': Please log in again';
            // Redirect to login if session expired
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else if (error.message.includes('Invalid or expired session')) {
            errorMessage += ': Session expired. Please log in again';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorMessage += ': ' + error.message;
        }
        
        setSaveButtonState('saveMemberDetails', 'saveMemberText', 'save');
        showNotification(errorMessage, 'error');
    } finally {
        const spinner = document.getElementById('saveMemberSpinner');
        if (spinner) spinner.classList.add('hidden');
    }
}

async function saveSpouseDetails() {
    if (userData.isMarried !== 'yes') return;
    if (!validateSession()) return;
    
    const spinner = document.getElementById('saveSpouseSpinner');
    
    try {
        setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save', true);
        spinner.classList.remove('hidden');
        
        // Validate spouse DOB if provided
        const spouseDobInput = document.getElementById('spouseDateOfBirth');
        if (spouseDobInput && spouseDobInput.value) {
            // First validate for future dates
            if (!validateFutureDate(spouseDobInput.value)) {
                markSectionError('spouse-details');
                showNotification('Spouse date of birth cannot be in the future.', 'error');
                return;
            }
        }
        
        const spouseDetails = getFormData('spouseDetailsForm');
        
        // Add education data
        spouseDetails.education = getEducationData('spouse');
        // Add profession data
        spouseDetails.profession = getProfessionData('spouse');
        
        // Validate spouse email format if provided
        if (spouseDetails.spouse_email && spouseDetails.spouse_email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(spouseDetails.spouse_email.trim())) {
                markSectionError('spouse-details');
                showNotification('Please enter a valid email address for spouse.', 'error');
                return;
            }
        }
        
        console.log('Saving spouse details:', spouseDetails);
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: 'spouse_details',
                spouse_details: spouseDetails
            })
        });
        
        console.log('Spouse details save response:', response);

        if (response.success) {
            markSectionComplete('spouse-details');
            setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'saved');
            sectionSaveStates['spouse-details'] = true;
            showNotification('Spouse details saved successfully!', 'success');
            checkProfileCompletion();
        } else {
            markSectionError('spouse-details');
            setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
            throw new Error(response.error || 'Failed to save spouse details.');
        }
    } catch (error) {
        console.error('Error saving spouse details:', error);
        markSectionError('spouse-details');
        setSaveButtonState('saveSpouseDetails', 'saveSpouseText', 'save');
        showNotification('Failed to save spouse details: ' + error.message, 'error');
    } finally {
        const spinner = document.getElementById('saveSpouseSpinner');
        if (spinner) spinner.classList.add('hidden');
    }
}

async function saveChildrenDetails() {
    if (userData.hasChildren !== 'yes') return;
    if (!validateSession()) return;
    
    const spinner = document.getElementById('saveChildrenSpinner');
    
    try {
        setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save', true);
        spinner.classList.remove('hidden');
        
        // Validate all children DOB
        const childForms = document.querySelectorAll('.child-form');
        for (let i = 0; i < childForms.length; i++) {
            const childDobInput = childForms[i].querySelector(`input[name*="child_date_of_birth"]`);
            if (childDobInput && childDobInput.value) {
                // Validate for future dates
                if (!validateFutureDate(childDobInput.value)) {
                    markSectionError('children-details');
                    showNotification(`Child ${i + 1} date of birth cannot be in the future.`, 'error');
                    return;
                }
            }
        }
        
        const childrenDetails = getChildrenData();
        
        console.log('Saving children details:', childrenDetails);
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: 'children_details',
                children_details: childrenDetails
            })
        });
        
        console.log('Children details save response:', response);

        if (response.success) {
            markSectionComplete('children-details');
            setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'saved');
            sectionSaveStates['children-details'] = true;
            showNotification('Children details saved successfully!', 'success');
            checkProfileCompletion();
        } else {
            markSectionError('children-details');
            setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
            throw new Error(response.error || 'Failed to save children details.');
        }
    } catch (error) {
        console.error('Error saving children details:', error);
        markSectionError('children-details');
        setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
        showNotification('Failed to save children details: ' + error.message, 'error');
    } finally {
        const spinner = document.getElementById('saveChildrenSpinner');
        if (spinner) spinner.classList.add('hidden');
    }
}

async function saveMemberFamilyTree() {
    const btn = document.getElementById('saveMemberFamilyTree');
    const text = document.getElementById('saveMemberFamilyText');
    const spinner = document.getElementById('saveMemberFamilySpinner');
    
    try {
        setButtonLoading(btn, text, spinner, 'Saving...', true);
        
        // Collect family tree data from all subsections
        const familyTreeData = {
            father_name: document.getElementById('fatherName')?.value || '',
            mother_name: document.getElementById('motherName')?.value || '',
            paternal_grandfather_name: document.getElementById('paternalGrandfather')?.value || '',
            paternal_grandmother_name: document.getElementById('paternalGrandmother')?.value || '',
            maternal_grandfather_name: document.getElementById('maternalGrandfather')?.value || '',
            maternal_grandmother_name: document.getElementById('maternalGrandmother')?.value || ''
        };
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: 'member_family_tree',
                member_family_tree: familyTreeData
            })
        });

        if (response.success) {
            markSectionComplete('member-family-tree');
            showNotification('Family tree saved successfully!', 'success');
        } else {
            markSectionError('member-family-tree');
            throw new Error(response.error || 'Failed to save family tree.');
        }
    } catch (error) {
        console.error('Error saving member family tree:', error);
        markSectionError('member-family-tree');
        showNotification('Failed to save family tree: ' + error.message, 'error');
    } finally {
        setButtonLoading(btn, text, spinner, 'Save Section', false);
    }
}

async function saveSpouseFamilyTree() {
    if (userData.isMarried !== 'yes') return;
    
    const btn = document.getElementById('saveSpouseFamilyTree');
    const text = document.getElementById('saveSpouseFamilyText');
    const spinner = document.getElementById('saveSpouseFamilySpinner');
    
    try {
        setButtonLoading(btn, text, spinner, 'Saving...', true);
        
        // Collect spouse family tree data
        const spouseFamilyTreeData = {
            spouse_father_name: document.getElementById('spouseFatherName')?.value || '',
            spouse_mother_name: document.getElementById('spouseMotherName')?.value || '',
            spouse_paternal_grandfather_name: document.getElementById('spousePaternalGrandfather')?.value || '',
            spouse_paternal_grandmother_name: document.getElementById('spousePaternalGrandmother')?.value || '',
            spouse_maternal_grandfather_name: document.getElementById('spouseMaternalGrandfather')?.value || '',
            spouse_maternal_grandmother_name: document.getElementById('spouseMaternalGrandmother')?.value || ''
        };
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: 'spouse_family_tree',
                spouse_family_tree: spouseFamilyTreeData
            })
        });

        if (response.success) {
            markSectionComplete('spouse-family-tree');
            showNotification('Spouse family tree saved successfully!', 'success');
        } else {
            markSectionError('spouse-family-tree');
            throw new Error(response.error || 'Failed to save spouse family tree.');
        }
    } catch (error) {
        console.error('Error saving spouse family tree:', error);
        markSectionError('spouse-family-tree');
        showNotification('Failed to save spouse family tree: ' + error.message, 'error');
    } finally {
        setButtonLoading(btn, text, spinner, 'Save Section', false);
    }
}

async function finalSubmitProfile() {
    const btn = document.getElementById('saveSubmitBtn');
    const text = document.getElementById('saveSubmitText');
    const spinner = document.getElementById('saveSubmitSpinner');
    const icon = document.getElementById('saveSubmitIcon');
    
    try {
        btn.disabled = true;
        text.textContent = 'Completing Profile...';
        spinner.classList.remove('hidden');
        icon.classList.add('hidden');
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: 'complete_profile'
            })
        });

        if (response.success) {
            text.textContent = 'Profile Completed!';
            spinner.classList.add('hidden');
            icon.classList.remove('hidden');
            
            showNotification('Profile completed successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } else {
            throw new Error(response.error || 'Failed to complete profile.');
        }
    } catch (error) {
        console.error('Error completing profile:', error);
        showNotification('Failed to complete profile: ' + error.message, 'error');
        
        btn.disabled = false;
        text.textContent = 'Complete Profile';
        spinner.classList.add('hidden');
        icon.classList.remove('hidden');
    }
}

function markSectionComplete(sectionId) {
    sectionCompletionStatus[sectionId] = true;
    
    // Update UI
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
        section.setAttribute('data-completed', 'true');
        section.classList.remove('border-red-500', 'border-gray-200');
        section.classList.add('border-green-500');
        
        const statusSpan = section.querySelector('.section-status');
        if (statusSpan) {
            statusSpan.textContent = 'Completed';
            statusSpan.classList.remove('text-gray-500', 'text-red-500');
            statusSpan.classList.add('text-green-600', 'completed');
        }
        
        // Update section number color
        const numberCircle = section.querySelector('.w-8.h-8');
        if (numberCircle) {
            numberCircle.classList.remove('bg-gray-400', 'bg-red-500');
            numberCircle.classList.add('bg-green-600');
        }
    }
    
    updateSaveSubmitButton();
}

function markSectionError(sectionId) {
    // Update UI for error state
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
        section.setAttribute('data-completed', 'false');
        section.classList.remove('border-green-500', 'border-gray-200');
        section.classList.add('border-red-500');
        
        const statusSpan = section.querySelector('.section-status');
        if (statusSpan) {
            statusSpan.textContent = 'Error - needs attention';
            statusSpan.classList.remove('text-gray-500', 'text-green-600', 'completed');
            statusSpan.classList.add('text-red-500');
        }
        
        // Update section number color
        const numberCircle = section.querySelector('.w-8.h-8');
        if (numberCircle) {
            numberCircle.classList.remove('bg-gray-400', 'bg-green-600');
            numberCircle.classList.add('bg-red-500');
        }
    }
}

function updateSaveSubmitButton() {
    const saveSubmitBtn = document.getElementById('saveSubmitBtn');
    const completionStatus = document.getElementById('completion-status');
    if (!saveSubmitBtn) return;
    
    // Check if all required sections are completed
    const requiredSections = ['member-details'];
    
    // Add spouse sections if married
    if (userData.isMarried === 'yes') {
        requiredSections.push('spouse-details');
    }
    
    // Add children section if has children
    if (userData.hasChildren === 'yes') {
        requiredSections.push('children-details');
    }
    
    // Family tree sections are optional but encouraged
    // Check if at least one family tree section has data
    const memberFamilyComplete = sectionCompletionStatus['member-family-tree'];
    const spouseFamilyComplete = userData.isMarried === 'yes' ? sectionCompletionStatus['spouse-family-tree'] : true;
    
    const allRequiredCompleted = requiredSections.every(section => sectionCompletionStatus[section]);
    const hasAnyChanges = hasUnsavedChanges();
    
    if (allRequiredCompleted) {
        // Enable button and make it green
        saveSubmitBtn.disabled = false;
        saveSubmitBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg';
        
        if (hasAnyChanges) {
            document.getElementById('saveSubmitText').textContent = 'Save & Submit';
            document.getElementById('saveSubmitIcon').className = 'fas fa-save ml-2';
        } else {
            document.getElementById('saveSubmitText').textContent = 'Submit Profile';
            document.getElementById('saveSubmitIcon').className = 'fas fa-check ml-2';
        }
        
        if (completionStatus) {
            completionStatus.textContent = 'Ready to submit! Click to save changes and complete your profile.';
            completionStatus.className = 'text-sm text-green-600 mt-2';
        }
    } else {
        // Keep button grey and disabled
        saveSubmitBtn.disabled = false; // Allow clicking to show what's missing
        saveSubmitBtn.className = 'bg-gray-400 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg';
        document.getElementById('saveSubmitText').textContent = 'Save & Submit';
        document.getElementById('saveSubmitIcon').className = 'fas fa-save ml-2';
        
        if (completionStatus) {
            completionStatus.textContent = 'Complete all required sections above to enable submission';
            completionStatus.className = 'text-sm text-gray-500 mt-2';
        }
    }
}

function setButtonLoading(btn, textElement, spinner, loadingText, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        textElement.textContent = loadingText;
        spinner.classList.remove('hidden');
    } else {
        btn.disabled = false;
        textElement.textContent = textElement.textContent.replace('Saving...', 'Save Section');
        spinner.classList.add('hidden');
    }
}

function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const data = {};
    const formData = new FormData(form);
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

function getChildrenData() {
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
            // Add education data for this child
            childData.education = getEducationData('child', index + 1);
            // Add profession data for this child
            childData.profession = getProfessionData('child', index + 1);
            childrenData.push(childData);
        }
    });
    
    return childrenData;
}

function getEducationData(type, childNumber = null) {
    const containerId = type === 'child' ? `childEducationContainer_${childNumber}` : `${type}EducationContainer`;
    const container = document.getElementById(containerId);
    
    if (!container) return [];
    
    const educationEntries = container.querySelectorAll('.education-entry');
    const educationData = [];
    
    educationEntries.forEach(entry => {
        const inputs = entry.querySelectorAll('input, select');
        const entryData = {};
        
        inputs.forEach(input => {
            if (input.name) {
                const key = input.name.split('_').pop(); // Get the last part (degree, department, year, institution)
                entryData[key] = input.value;
            }
        });
        
        // Only include if degree is filled (required field)
        if (entryData.degree && entryData.degree.trim()) {
            educationData.push(entryData);
        }
    });
    
    // Sort by year (latest first)
    return educationData.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
    });
}

function getProfessionData(type, childNumber = null) {
    const containerId = type === 'child' ? `childProfessionContainer_${childNumber}` : `${type}ProfessionContainer`;
    const container = document.getElementById(containerId);
    
    if (!container) return [];
    
    const professionEntries = container.querySelectorAll('.profession-entry');
    const professionData = [];
    
    professionEntries.forEach(entry => {
        const inputs = entry.querySelectorAll('input, select');
        const entryData = {};
        
        inputs.forEach(input => {
            if (input.name) {
                let key = input.name.split('_').pop(); // Get the last part
                if (key === 'type' && input.name.includes('job_type')) {
                    key = 'job_type';
                } else if (key === 'other' && input.name.includes('job_type_other')) {
                    key = 'job_type_other';
                } else if (key === 'years') {
                    key = 'experience_years';
                } else if (key === 'months') {
                    key = 'experience_months';
                }
                entryData[key] = input.value;
            }
        });
        
        // Only include if job type is filled (required field)
        if (entryData.job_type && entryData.job_type.trim()) {
            professionData.push(entryData);
        }
    });
    
    // Sort by experience (most experienced first)
    return professionData.sort((a, b) => {
        const expA = (parseInt(a.experience_years) || 0) * 12 + (parseInt(a.experience_months) || 0);
        const expB = (parseInt(b.experience_years) || 0) * 12 + (parseInt(b.experience_months) || 0);
        return expB - expA;
    });
}

let childrenCount = 0;

function addChildForm() {
    childrenCount++;
    const container = document.getElementById('childrenFormsContainer');
    
    const childForm = document.createElement('div');
    childForm.className = 'child-form border border-gray-200 rounded-lg p-6 mb-4 bg-gray-50';
    childForm.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-semibold text-gray-900">Child ${childrenCount}</h4>
            <button type="button" class="remove-child-btn text-red-600 hover:text-red-800 p-2 rounded">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span class="text-red-500">*</span>
                </label>
                <input type="text" name="child_first_name_${childrenCount}" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Second Name
                </label>
                <input type="text" name="child_second_name_${childrenCount}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span class="text-red-500">*</span>
                </label>
                <select name="child_gender_${childrenCount}" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                <input type="date" name="child_date_of_birth_${childrenCount}" required
                           class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                           placeholder="DD-MM-YYYY">
                    <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <p class="text-xs text-gray-500 mt-1">Enter child's date of birth</p>
                <p id="childDobHelp_${childrenCount}" class="text-sm text-blue-600 mt-1">📅 Please enter the actual date of birth</p>
            </div>
            
            <div id="childAgeFieldContainer_${childrenCount}" class="hidden">
                <label for="childAgeField_${childrenCount}" class="block text-sm font-medium text-gray-700 mb-2">
                    Age (Auto-calculated)
                </label>
                <div class="relative">
                    <input type="text" id="childAgeField_${childrenCount}" readonly
                           class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                           placeholder="Age will be calculated from DOB">
                    <i class="fas fa-clock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
        </div>
        
        <!-- Child Kulam Details Section -->
        <div class="border-t border-gray-200 pt-4 mt-4">
            <h5 class="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <i class="fas fa-temple mr-2 text-orange-500"></i>Kulam Details
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="childKulam_${childrenCount}" class="block text-sm font-medium text-gray-700 mb-2">
                        Kulam
                    </label>
                    <div class="relative">
                        <select id="childKulam_${childrenCount}" name="child_kulam_${childrenCount}"
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select Kulam</option>
                            <option value="other">Other (specify below)</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                        <i class="fas fa-users absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <input type="text" id="childKulamOther_${childrenCount}" name="child_kulam_other_${childrenCount}" placeholder="Please specify child's Kulam"
                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                </div>

                <div>
                    <label for="childKulaDeivam_${childrenCount}" class="block text-sm font-medium text-gray-700 mb-2">
                        Kula Deivam
                    </label>
                    <div class="relative">
                        <select id="childKulaDeivam_${childrenCount}" name="child_kula_deivam_${childrenCount}"
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select Kula Deivam</option>
                            <option value="other">Other (specify below)</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                        <i class="fas fa-om absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <input type="text" id="childKulaDeivamOther_${childrenCount}" name="child_kula_deivam_other_${childrenCount}" placeholder="Please specify child's Kula Deivam"
                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                </div>

                <div>
                    <label for="childKaani_${childrenCount}" class="block text-sm font-medium text-gray-700 mb-2">
                        Kaani
                    </label>
                    <div class="relative">
                        <select id="childKaani_${childrenCount}" name="child_kaani_${childrenCount}"
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select Kaani</option>
                            <option value="other">Other (specify below)</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                        <i class="fas fa-place-of-worship absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <input type="text" id="childKaaniOther_${childrenCount}" name="child_kaani_other_${childrenCount}" placeholder="Please specify child's Kaani"
                           class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hidden">
                </div>
            </div>
        </div>
        
        <!-- Child Education Details Section -->
        <div class="border-t border-gray-200 pt-4 mt-4">
            <h5 class="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <i class="fas fa-graduation-cap mr-2 text-blue-500"></i>Education Details
            </h5>
            <div id="childEducationContainer_${childrenCount}">
                <!-- Education entries will be added here dynamically -->
            </div>
            <button type="button" class="addChildEducationBtn mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors" data-child="${childrenCount}">
                <i class="fas fa-plus mr-1"></i>Add Education
            </button>
        </div>
        
        <!-- Child Profession Details Section -->
        <div class="border-t border-gray-200 pt-4 mt-4">
            <h5 class="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <i class="fas fa-briefcase mr-2 text-green-500"></i>Profession Details
            </h5>
            <div id="childProfessionContainer_${childrenCount}">
                <!-- Profession entries will be added here dynamically -->
            </div>
            <button type="button" class="addChildProfessionBtn mt-3 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors" data-child="${childrenCount}">
                <i class="fas fa-plus mr-1"></i>Add Profession
            </button>
        </div>
    `;
    
    container.appendChild(childForm);
    
    // Add event listeners
    childForm.querySelector('.remove-child-btn').addEventListener('click', () => {
        childForm.remove();
        // Reset children save state when form is modified
        if (sectionSaveStates['children-details']) {
            setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
            sectionSaveStates['children-details'] = false;
        }
    });
    
    // Add change listeners to all child form inputs
    const childInputs = childForm.querySelectorAll('input, select');
    childInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (sectionSaveStates['children-details']) {
                setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
                sectionSaveStates['children-details'] = false;
            }
        });
        input.addEventListener('change', () => {
            if (sectionSaveStates['children-details']) {
                setSaveButtonState('saveChildrenDetails', 'saveChildrenText', 'save');
                sectionSaveStates['children-details'] = false;
            }
        });
    });
    
    // Setup Kulam "Other" toggles for this child
    setupKulamOtherToggle(`childKulam_${childrenCount}`, `childKulamOther_${childrenCount}`);
    setupKulamOtherToggle(`childKulaDeivam_${childrenCount}`, `childKulaDeivamOther_${childrenCount}`);
    setupKulamOtherToggle(`childKaani_${childrenCount}`, `childKaaniOther_${childrenCount}`);
    
    // Populate child Kulam dropdowns
    populateChildKulamDropdowns(childrenCount);
    
    // Add event listener for child education button
    const childEducationBtn = childForm.querySelector('.addChildEducationBtn');
    if (childEducationBtn) {
        childEducationBtn.addEventListener('click', () => {
            addEducationEntry('child', childrenCount);
        });
    }
    
    // Add event listener for child profession button
    const childProfessionBtn = childForm.querySelector('.addChildProfessionBtn');
    if (childProfessionBtn) {
        childProfessionBtn.addEventListener('click', () => {
            addProfessionEntry('child', childrenCount);
        });
    }
    
    // Add DOB validation for child
    const childDobInput = childForm.querySelector(`input[name="child_date_of_birth_${childrenCount}"]`);
    if (childDobInput) {
        childDobInput.addEventListener('change', function() {
            if (this.value) {
                // Validate for future dates
                if (validateFutureDate(this.value)) {
                    updateAgeDisplay(this.value, `childAgeField_${childrenCount}`, `childAgeFieldContainer_${childrenCount}`);
                    const childDobHelp = document.getElementById(`childDobHelp_${childrenCount}`);
                    if (childDobHelp) {
                        childDobHelp.textContent = '📅 Please enter the actual date of birth';
                        childDobHelp.className = 'text-sm text-blue-600 mt-1';
                    }
                } else {
                    // Clear the field if it's a future date
                    this.value = '';
                    const childAgeDisplay = document.getElementById(`childAgeFieldContainer_${childrenCount}`);
                    if (childAgeDisplay) childAgeDisplay.classList.add('hidden');
                    const childDobHelp = document.getElementById(`childDobHelp_${childrenCount}`);
                    if (childDobHelp) {
                        childDobHelp.textContent = '❌ Date of birth cannot be in the future';
                        childDobHelp.className = 'text-sm text-red-600 mt-1';
                    }
                }
            } else {
                // Hide age display when field is empty
                const childAgeDisplay = document.getElementById(`childAgeFieldContainer_${childrenCount}`);
                if (childAgeDisplay) childAgeDisplay.classList.add('hidden');
                const childDobHelp = document.getElementById(`childDobHelp_${childrenCount}`);
                if (childDobHelp) {
                    childDobHelp.textContent = '📅 Please enter the actual date of birth';
                    childDobHelp.className = 'text-sm text-blue-600 mt-1';
                }
            }
        });
    }
}

function populateLocationData() {
    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];
    
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    }
    
    const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        countrySelect.value = 'India';
    }
}

async function loadExistingProfile() {
    try {
        const data = await apiFetch('account.php', {
            method: 'GET'
        });

        console.log('API response data in loadExistingProfile:', data);
        
        if (data.success && data.user) {
            // Use user data from account.php
            const profile = data.user;
            // Check if this is an edit request from profile page
            const urlParams = new URLSearchParams(window.location.search);
            const isEditMode = urlParams.get('edit') === 'true';
            
            if (profile.profile_completed && !isEditMode) {
                window.location.href = 'dashboard.html';
                return;
            }
            console.log('Profile data to populate:', profile);
            console.log('Gender from profile:', profile.gender);
            console.log('IsMarried from profile:', profile.isMarried);
            console.log('HasChildren from profile:', profile.hasChildren);
            console.log('All profile columns:', Object.keys(profile));
            
            // Extract intro data from profile for userData
            if (profile.gender || profile.isMarried || profile.hasChildren) {
                userData.gender = profile.gender;
                userData.isMarried = profile.isMarried;
                userData.hasChildren = profile.hasChildren;
                userData.marriageType = profile.marriageType;
                userData.marriageStatus = profile.marriageStatus;
                userData.role = profile.role;
                console.log('Updated userData with database intro data:', userData);
            } else {
                console.log('No intro data found in database, user may need to complete intro questions first');
                // Set defaults for users who haven't completed intro questions
                userData.isMarried = 'no';
                userData.hasChildren = 'no';
            }
            
            populateForm(profile);
            
            // Update section visibility based on database intro data
            console.log('Updating section visibility with userData:', userData);
            updateSectionVisibility();
            
            // Force re-check section visibility after a short delay
            setTimeout(() => {
                console.log('Re-checking section visibility...');
                updateSectionVisibility();
            }, 500);
            
            // Trigger spouse gender auto-population after a short delay to ensure form is populated
            setTimeout(() => {
                debouncedAutoPopulateSpouseGender();
            }, 100);
            
            // Check if member details section should be marked as completed
            if (profile.first_name && profile.date_of_birth && profile.phone) {
                markSectionComplete('member-details');
            }
            
            // Load all section data after components are initialized
            setTimeout(async () => {
                await loadAllSectionData();
                
                // Check profile completion status after loading
                setTimeout(() => {
                    checkProfileCompletion();
                }, 200);
            }, 300);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadAllSectionData() {
    try {
        // Load spouse details
        const spouseData = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({ step: 'get_spouse_details' })
        });
        
        if (spouseData.success && spouseData.spouse) {
            populateSpouseForm(spouseData.spouse);
            markSectionComplete('spouse-details');
        }
        
        // Load children details
        const childrenData = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({ step: 'get_children_details' })
        });
        
        if (childrenData.success && childrenData.children && childrenData.children.length > 0) {
            populateChildrenForms(childrenData.children);
            markSectionComplete('children-details');
        }
        
        // Load member family tree
        const memberFamilyData = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({ step: 'get_member_family_tree' })
        });
        
        if (memberFamilyData.success && memberFamilyData.family_tree) {
            console.log('Full member family tree data:', memberFamilyData.family_tree);
            populateMemberFamilyTree(memberFamilyData.family_tree);
            // Populate individual components
            if (memberParentsComponent) {
                console.log('Populating member parents component with:', memberFamilyData.family_tree);
                memberParentsComponent.populate(memberFamilyData.family_tree);
                // Mark component as complete if it has data
                if (memberFamilyData.family_tree.father_name || memberFamilyData.family_tree.mother_name) {
                    console.log('Marking member parents as complete');
                    memberParentsComponent.markSectionComplete();
                }
            } else {
                console.warn('Member parents component not initialized');
            }
            if (memberPaternalGrandparentsComponent) {
                memberPaternalGrandparentsComponent.populate(memberFamilyData.family_tree);
                // Mark component as complete if it has data
                if (memberFamilyData.family_tree.paternal_grandfather_name || memberFamilyData.family_tree.paternal_grandmother_name) {
                    memberPaternalGrandparentsComponent.markSectionComplete();
                }
            }
            if (memberMaternalGrandparentsComponent) {
                memberMaternalGrandparentsComponent.populate(memberFamilyData.family_tree);
                // Mark component as complete if it has data
                if (memberFamilyData.family_tree.maternal_grandfather_name || memberFamilyData.family_tree.maternal_grandmother_name) {
                    memberMaternalGrandparentsComponent.markSectionComplete();
                }
            }
            // Only mark main section complete if it has substantial data
            if (hasSubstantialFamilyTreeData(memberFamilyData.family_tree)) {
                markSectionComplete('member-family-tree');
            }
        }
        
        // Load spouse family tree
        const spouseFamilyData = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({ step: 'get_spouse_family_tree' })
        });
        
        if (spouseFamilyData.success && spouseFamilyData.family_tree) {
            console.log('Full spouse family tree data:', spouseFamilyData.family_tree);
            populateSpouseFamilyTree(spouseFamilyData.family_tree);
            // Populate individual components
            if (spouseParentsComponent) {
                console.log('Populating spouse parents component with:', spouseFamilyData.family_tree);
                spouseParentsComponent.populate(spouseFamilyData.family_tree);
                // Mark component as complete if it has data
                if (spouseFamilyData.family_tree.father_name || spouseFamilyData.family_tree.mother_name) {
                    console.log('Marking spouse parents as complete');
                    spouseParentsComponent.markSectionComplete();
                }
            } else {
                console.warn('Spouse parents component not initialized');
            }
            if (spousePaternalGrandparentsComponent) {
                spousePaternalGrandparentsComponent.populate(spouseFamilyData.family_tree);
                // Mark component as complete if it has data
                if (spouseFamilyData.family_tree.paternal_grandfather_name || spouseFamilyData.family_tree.paternal_grandmother_name) {
                    spousePaternalGrandparentsComponent.markSectionComplete();
                }
            }
            if (spouseMaternalGrandparentsComponent) {
                spouseMaternalGrandparentsComponent.populate(spouseFamilyData.family_tree);
                // Mark component as complete if it has data
                if (spouseFamilyData.family_tree.maternal_grandfather_name || spouseFamilyData.family_tree.maternal_grandmother_name) {
                    spouseMaternalGrandparentsComponent.markSectionComplete();
                }
            }
            // Only mark main section complete if it has substantial data
            if (hasSubstantialFamilyTreeData(spouseFamilyData.family_tree)) {
                markSectionComplete('spouse-family-tree');
            }
        }
        
    } catch (error) {
        console.error('Error loading section data:', error);
    }
}

function hasSubstantialFamilyTreeData(familyTreeData) {
    if (!familyTreeData) return false;
    
    // Count how many family tree fields have data
    const fieldsWithData = [
        familyTreeData.father_name,
        familyTreeData.mother_name,
        familyTreeData.paternal_grandfather_name,
        familyTreeData.paternal_grandmother_name,
        familyTreeData.maternal_grandfather_name,
        familyTreeData.maternal_grandmother_name
    ].filter(field => field && field.trim()).length;
    
    // Consider section substantially complete if at least 3 fields are filled
    // or if parents are complete (both father and mother)
    const parentsComplete = familyTreeData.father_name && familyTreeData.mother_name;
    
    return fieldsWithData >= 3 || parentsComplete;
}

function populateForm(profile) {
    console.log('Inside populateForm, profile object:', profile);
    
    // Get user data for invitation details
    const storedUserData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Populate name
    const fullName = profile.full_name || profile.name || storedUserData.full_name || '';
    const [first, ...rest] = fullName.trim().split(' ');
    
    const firstNameInput = document.getElementById('firstName');
    const secondNameInput = document.getElementById('secondName');
    if (firstNameInput) firstNameInput.value = first || '';
    if (secondNameInput) secondNameInput.value = rest.join(' ') || '';
    
    // Populate gender from database profile (which includes intro data)
    const genderInput = document.getElementById('gender');
    if (genderInput) {
        console.log('Gender input field found. Current value:', genderInput.value);
        console.log('Profile gender value:', profile.gender);
        console.log('UserData gender value:', userData.gender);
        
        // Priority: profile.gender (from database, includes intro data) > userData.gender
        const genderToUse = profile.gender || userData.gender;
        if (genderToUse) {
            genderInput.value = genderToUse;
            console.log('✅ Set gender field value to:', genderToUse);
            
            // Update userData with the gender value
            userData.gender = genderToUse;
        } else {
            console.log('❌ No gender data found in profile or userData');
            console.log('Profile object keys:', Object.keys(profile));
        }
        
        // Double-check after setting
        setTimeout(() => {
            console.log('Gender field value after 100ms:', document.getElementById('gender')?.value);
        }, 100);
    } else {
        console.log('❌ Gender input field not found!');
    }
    
    // Populate date of birth
    const dobInput = document.getElementById('dateOfBirth');
    if (dobInput) {
        const dob = profile.date_of_birth;
        if (dob && dob !== '0000-00-00' && dob !== '1900-01-01' && dob !== 'NULL') {
            dobInput.value = dob;
            // Update age display immediately and ensure it's visible
            updateAgeDisplay(dob, 'memberAgeField', 'ageFieldContainer');
            // Force show the age field container
            const ageDisplay = document.getElementById('ageFieldContainer');
            if (ageDisplay) {
                ageDisplay.classList.remove('hidden');
                console.log('✅ Age field container made visible');
            }
        } else {
            // Leave field blank if no valid DOB in database
            dobInput.value = '';
            // Hide age display
            const ageDisplay = document.getElementById('ageFieldContainer');
            if (ageDisplay) ageDisplay.classList.add('hidden');
        }
    }
    
    // Populate phone and email
    let phoneToUse = profile.phone || storedUserData.phone || '';
    const emailInput = document.getElementById('email');
    
    console.log('Phone data available:', {
        'profile.phone': profile.phone,
        'storedUserData.phone': storedUserData.phone,
        'phoneToUse': phoneToUse
    });
    
    if (emailInput && (profile.email || storedUserData.email)) {
        const emailToUse = profile.email || storedUserData.email || '';
        emailInput.value = emailToUse;
        if (storedUserData.email && storedUserData.created_via_invitation) {
            emailInput.readOnly = true;
            emailInput.classList.add('bg-gray-50');
        }
    }

    if (phoneToUse) {
        const { countryCode, phoneNumber } = parsePhoneNumber(phoneToUse);
        const countryCodeSelect = document.getElementById('countryCode');
        const phoneInput = document.getElementById('phone');
        
        console.log('Parsed phone data:', { countryCode, phoneNumber });
        
        if (countryCodeSelect) {
            countryCodeSelect.value = countryCode || '+91';
            console.log('✅ Country code set to:', countryCodeSelect.value);
        }
        if (phoneInput) {
            phoneInput.value = phoneNumber;
            console.log('✅ Phone number set to:', phoneInput.value);
            if (storedUserData.phone && storedUserData.created_via_invitation) {
                phoneInput.readOnly = true;
                phoneInput.classList.add('bg-gray-50');
                console.log('✅ Phone made readonly (invitation user)');
            }
        }
    } else {
        console.log('❌ No phone data available to populate');
    }
    
    // Handle address fields - populate from individual database columns
    const addressLine1Input = document.getElementById('addressLine1');
    const addressLine2Input = document.getElementById('addressLine2');
    const cityInput = document.getElementById('city');
    const pinCodeInput = document.getElementById('pinCode');
    const stateInput = document.getElementById('state');
    const countryInput = document.getElementById('country');
    
    if (addressLine1Input) addressLine1Input.value = profile.address_line1 || '';
    if (addressLine2Input) addressLine2Input.value = profile.address_line2 || '';
    if (cityInput) cityInput.value = profile.city || '';
    if (pinCodeInput) pinCodeInput.value = profile.pin_code || '';
    if (stateInput) stateInput.value = profile.state || '';
    if (countryInput) countryInput.value = profile.country || 'India';
    
    console.log('Address fields populated:', {
        address_line1: profile.address_line1,
        address_line2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        pin_code: profile.pin_code
    });
    
    // Trigger auto-populate spouse gender if gender is set and ensure userData has the gender
    setTimeout(() => {
        // Update userData with current gender if it's not already set
        const genderInput = document.getElementById('gender');
        console.log('In timeout - Gender input current value:', genderInput?.value);
        console.log('In timeout - userData.gender:', userData.gender);
        
        if (genderInput && genderInput.value && !userData.gender) {
            userData.gender = genderInput.value;
            console.log('Updated userData.gender from form:', userData.gender);
        } else if (genderInput && userData.gender && !genderInput.value) {
            // If gender input is empty but we have gender in userData, set it
            genderInput.value = userData.gender;
            console.log('Set gender input from userData:', userData.gender);
        }
        
        debouncedAutoPopulateSpouseGender();
        
        // Trigger age validation if DOB is set
        const dobInput = document.getElementById('dateOfBirth');
        if (dobInput && dobInput.value) {
            validateMemberAge(dobInput.value);
        }
        
        const spouseDobInput = document.getElementById('spouseDateOfBirth');
        if (spouseDobInput && spouseDobInput.value) {
            validateSpouseAge(spouseDobInput.value);
        }
    }, 100);
}

async function saveFamilyTreeSubsection(data, prefix = '', type = '') {
    try {
        // Determine the step based on prefix and type
        let step;
        if (prefix === 'spouse_') {
            step = type ? `save_spouse_${type}_grandparents` : 'save_spouse_parents';
        } else {
            step = type ? `save_member_${type}_grandparents` : 'save_member_parents';
        }
        
        const response = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({
                step: step,
                data: data
            })
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to save family tree subsection');
        }
        
        // Check if all subsections in the family tree are complete and mark main section complete
        checkFamilyTreeCompletion(prefix);
        
        return response;
        
    } catch (error) {
        console.error('Error saving family tree subsection:', error);
        throw error;
    }
}

function checkFamilyTreeCompletion(prefix = '') {
    // Determine which family tree we're checking
    const sectionId = prefix === 'spouse_' ? 'spouse-family-tree' : 'member-family-tree';
    
    // Check if all subsections have any data or are marked complete
    let hasSubstantialData = false;
    
    if (prefix === 'spouse_') {
        // Check spouse family tree subsections
        const spouseParentsData = spouseParentsComponent ? spouseParentsComponent.getData() : {};
        const spousePaternalData = spousePaternalGrandparentsComponent ? spousePaternalGrandparentsComponent.getData() : {};
        const spouseMaternalData = spouseMaternalGrandparentsComponent ? spouseMaternalGrandparentsComponent.getData() : {};
        
        const dataCount = [
            spouseParentsData.father_name,
            spouseParentsData.mother_name,
            spousePaternalData.paternal_grandfather_name,
            spousePaternalData.paternal_grandmother_name,
            spouseMaternalData.maternal_grandfather_name,
            spouseMaternalData.maternal_grandmother_name
        ].filter(field => field && field.trim()).length;
        
        hasSubstantialData = dataCount >= 2; // At least 2 fields filled
    } else {
        // Check member family tree subsections
        const memberParentsData = memberParentsComponent ? memberParentsComponent.getData() : {};
        const memberPaternalData = memberPaternalGrandparentsComponent ? memberPaternalGrandparentsComponent.getData() : {};
        const memberMaternalData = memberMaternalGrandparentsComponent ? memberMaternalGrandparentsComponent.getData() : {};
        
        const dataCount = [
            memberParentsData.father_name,
            memberParentsData.mother_name,
            memberPaternalData.paternal_grandfather_name,
            memberPaternalData.paternal_grandmother_name,
            memberMaternalData.maternal_grandfather_name,
            memberMaternalData.maternal_grandmother_name
        ].filter(field => field && field.trim()).length;
        
        hasSubstantialData = dataCount >= 2; // At least 2 fields filled
    }
    
    if (hasSubstantialData) {
        markSectionComplete(sectionId);
    }
}

function parsePhoneNumber(phone) {
    if (!phone) return { countryCode: '+91', phoneNumber: '' };
    
    const countryCodes = ['+91', '+1', '+44', '+61', '+81', '+49', '+33', '+39', '+34', '+86'];
    
    for (let code of countryCodes) {
        if (phone.startsWith(code)) {
            return {
                countryCode: code,
                phoneNumber: phone.substring(code.length)
            };
        }
    }
    
    return { countryCode: '+91', phoneNumber: phone };
}

function initializeDOBFields() {
    // Add DOB validation listeners
    const memberDobInput = document.getElementById('dateOfBirth');
    if (memberDobInput) {
        memberDobInput.addEventListener('change', function() {
            if (this.value) {
                // Validate for future dates
                if (validateFutureDate(this.value)) {
                    validateMemberAge(this.value);
                    updateAgeDisplay(this.value, 'memberAgeField', 'ageFieldContainer');
                } else {
                    // Clear the field if it's a future date
                    this.value = '';
                    const ageDisplay = document.getElementById('ageFieldContainer');
                    if (ageDisplay) ageDisplay.classList.add('hidden');
                    const dobHelp = document.getElementById('dobHelp');
                    if (dobHelp) {
                        dobHelp.textContent = '❌ Date of birth cannot be in the future';
                        dobHelp.className = 'text-sm text-red-600 mt-1';
                    }
                }
            } else {
                // Hide age display when field is empty
                const ageDisplay = document.getElementById('ageFieldContainer');
                if (ageDisplay) ageDisplay.classList.add('hidden');
                const dobHelp = document.getElementById('dobHelp');
                if (dobHelp) {
                    dobHelp.textContent = '📅 Please enter your actual date of birth';
                    dobHelp.className = 'text-sm text-blue-600 mt-1';
                }
            }
            debouncedAutoPopulateSpouseGender();
        });
    }
    
    const spouseDobInput = document.getElementById('spouseDateOfBirth');
    if (spouseDobInput) {
        spouseDobInput.addEventListener('change', function() {
            if (this.value) {
                // Validate for future dates
                if (validateFutureDate(this.value)) {
                    validateSpouseAge(this.value);
                    updateAgeDisplay(this.value, 'spouseAgeField', 'spouseAgeFieldContainer');
                } else {
                    // Clear the field if it's a future date
                    this.value = '';
                    const spouseAgeDisplay = document.getElementById('spouseAgeFieldContainer');
                    if (spouseAgeDisplay) spouseAgeDisplay.classList.add('hidden');
                    const spouseDobHelp = document.getElementById('spouseDobHelp');
                    if (spouseDobHelp) {
                        spouseDobHelp.textContent = '❌ Date of birth cannot be in the future';
                        spouseDobHelp.className = 'text-sm text-red-600 mt-1';
                    }
                }
            } else {
                // Hide age display when field is empty
                const spouseAgeDisplay = document.getElementById('spouseAgeFieldContainer');
                if (spouseAgeDisplay) spouseAgeDisplay.classList.add('hidden');
                const spouseDobHelp = document.getElementById('spouseDobHelp');
                if (spouseDobHelp) {
                    spouseDobHelp.textContent = '📅 Please enter the actual date of birth';
                    spouseDobHelp.className = 'text-sm text-blue-600 mt-1';
                }
            }
        });
    }
    
    // Add gender change listener for auto-populating spouse gender
    const genderInput = document.getElementById('gender');
    if (genderInput) {
        genderInput.addEventListener('change', debouncedAutoPopulateSpouseGender);
    }
}

// Helper function to validate future dates
function validateFutureDate(dateString) {
    if (!dateString) return true;
    
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    return inputDate <= today;
}

// Helper function to update age display in the new field format
function updateAgeDisplay(dateOfBirth, ageFieldId, containerElementId) {
    if (!dateOfBirth) return;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    const ageField = document.getElementById(ageFieldId);
    const containerElement = document.getElementById(containerElementId);
    
    if (ageField && containerElement) {
        ageField.value = `${age} years`;
        containerElement.classList.remove('hidden');
    }
}

// Debounced spouse gender auto-population to prevent multiple simultaneous triggers
let spouseGenderTimeout;
function debouncedAutoPopulateSpouseGender() {
    clearTimeout(spouseGenderTimeout);
    spouseGenderTimeout = setTimeout(autoPopulateSpouseGender, 100);
}

function validateMemberAge(dateOfBirth) {
    if (!dateOfBirth) return false;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear(); // Fixed: let instead of const
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--; // Now this works correctly
    }
    
    const dobHelp = document.getElementById('dobHelp');
    if (age < 18) {
        if (dobHelp) {
            dobHelp.textContent = `❌ You must be at least 18 years old. Current age: ${age}`;
            dobHelp.className = 'text-sm text-red-600 mt-1';
        }
        return false;
    } else {
        if (dobHelp) {
            dobHelp.textContent = `✅ Age: ${age} years`;
            dobHelp.className = 'text-sm text-green-600 mt-1';
        }
        return true;
    }
}

function validateSpouseAge(dateOfBirth) {
    if (!dateOfBirth) return true; // Optional field
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    const spouseDobHelp = document.getElementById('spouseDobHelp');
    if (spouseDobHelp) {
        spouseDobHelp.textContent = `✅ Age: ${age} years`;
        spouseDobHelp.className = 'text-sm text-green-600 mt-1';
    }
    
    return true;
}

function autoPopulateSpouseGender() {
    const memberGender = document.getElementById('gender')?.value;
    const spouseGenderSelect = document.getElementById('spouseGender');
    
    if (!memberGender || !spouseGenderSelect) return;
    
    console.log('Auto-populating spouse gender. Member gender:', memberGender);
    
    // Set opposite gender for spouse (only for Male/Female, not Others)
    if (memberGender === 'Male') {
        spouseGenderSelect.value = 'Female';
        console.log('Set spouse gender to Female');
    } else if (memberGender === 'Female') {
        spouseGenderSelect.value = 'Male';
        console.log('Set spouse gender to Male');
    }
    // For "others" gender, leave spouse gender empty for manual selection
}

// Helper functions for button state management
function setSaveButtonState(buttonId, textId, state, isLoading = false) {
    const button = document.getElementById(buttonId);
    const textElement = document.getElementById(textId);
    
    if (!button || !textElement) return;
    
    if (isLoading) {
        button.disabled = true;
        textElement.textContent = 'Saving...';
        button.className = 'bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors';
    } else if (state === 'saved') {
        button.disabled = false;
        textElement.textContent = 'Saved';
        button.className = 'bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors';
    } else { // state === 'save'
        button.disabled = false;
        textElement.textContent = 'Save';
        button.className = 'bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-colors';
    }
}

function setSubmitButtonState(state, isLoading = false) {
    const button = document.getElementById('saveSubmitBtn');
    const textElement = document.getElementById('saveSubmitText');
    const icon = document.getElementById('saveSubmitIcon');
    
    if (!button || !textElement || !icon) return;
    
    if (isLoading) {
        button.disabled = true;
        textElement.textContent = 'Submitting...';
        button.className = 'bg-blue-500 hover:bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg';
        icon.className = 'fas fa-spinner fa-spin ml-2';
    } else if (state === 'submitted') {
        button.disabled = true;
        textElement.textContent = 'Submitted';
        button.className = 'bg-green-500 hover:bg-green-600 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg';
        icon.className = 'fas fa-check ml-2';
    } else { // state === 'submit'
        button.disabled = false;
        textElement.textContent = 'Submit';
        button.className = 'bg-gray-400 hover:bg-gray-500 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg';
        icon.className = 'fas fa-paper-plane ml-2';
    }
}

// Track which sections have been saved
let sectionSaveStates = {
    'member-details': false,
    'spouse-details': false,
    'children-details': false,
    'member-family-tree': false,
    'spouse-family-tree': false
};

// Subsection save states for tracking individual subsection changes
let subsectionSaveStates = {
    'parents': false,
    'paternal-grandparents': false,
    'maternal-grandparents': false,
    'spouse-parents': false,
    'spouse-paternal-grandparents': false,
    'spouse-maternal-grandparents': false
};

// Subsection save button management
function updateSubsectionSaveButtonState(subsectionId) {
    const saveBtn = document.getElementById(`save${subsectionId}Btn`);
    const saveText = document.getElementById(`save${subsectionId}Text`);
    
    if (saveBtn && saveText) {
        if (subsectionSaveStates[subsectionId]) {
            saveBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
            saveBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            saveText.textContent = 'Saved';
        } else {
            saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            saveBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
            saveText.textContent = 'Save';
        }
    }
}

function markSubsectionComplete(subsectionId) {
    subsectionSaveStates[subsectionId] = true;
    updateSubsectionSaveButtonState(subsectionId);
    
    // Update subsection visual indicator
    const numberElement = document.getElementById(`${subsectionId}-number`);
    if (numberElement) {
        numberElement.className = 'w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium';
        numberElement.innerHTML = '<i class="fas fa-check"></i>';
    }
}

function markSubsectionError(subsectionId) {
    const numberElement = document.getElementById(`${subsectionId}-number`);
    if (numberElement) {
        numberElement.className = 'w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-medium';
        numberElement.innerHTML = '<i class="fas fa-exclamation"></i>';
    }
}

// Make functions available globally for components
window.autoPopulateSpouseGender = autoPopulateSpouseGender;
window.debouncedAutoPopulateSpouseGender = debouncedAutoPopulateSpouseGender;
window.updateSubsectionSaveButtonState = updateSubsectionSaveButtonState;
window.markSubsectionComplete = markSubsectionComplete;
window.markSubsectionError = markSubsectionError;

async function saveAllChanges() {
    // This function is called by handleSaveSubmit, so we don't need to manage UI state here
    // The calling function handles the button state
    
    try {
        
        let savedSections = 0;
        let totalSections = 0;
        let errors = [];
        
        // Save member details if visible
        if (isElementVisible('member-details-content')) {
            totalSections++;
            try {
                await saveMemberDetails();
                savedSections++;
                console.log('Member details saved successfully');
            } catch (error) {
                errors.push('Member Details: ' + error.message);
                console.error('Failed to save member details:', error);
            }
        }
        
        // Save spouse details if visible and married
        if (userData.isMarried === 'yes' && isElementVisible('spouse-details-content')) {
            totalSections++;
            try {
                await saveSpouseDetails();
                savedSections++;
                console.log('Spouse details saved successfully');
            } catch (error) {
                errors.push('Spouse Details: ' + error.message);
                console.error('Failed to save spouse details:', error);
            }
        }
        
        // Save children details if visible and has children
        if (userData.hasChildren === 'yes' && isElementVisible('children-details-content')) {
            totalSections++;
            try {
                await saveChildrenDetails();
                savedSections++;
                console.log('Children details saved successfully');
            } catch (error) {
                errors.push('Children Details: ' + error.message);
                console.error('Failed to save children details:', error);
            }
        }
        
        // Save Member Family Tree subsections if visible
        if (isElementVisible('member-family-tree-content')) {
            // Save Member Parents
            if (memberParentsComponent) {
                totalSections++;
                try {
                    const parentsData = memberParentsComponent.getData();
                    if (parentsData.father_name || parentsData.mother_name) {
                        await saveFamilyTreeSubsection(parentsData, '', '');
                        memberParentsComponent.markSectionComplete();
                        savedSections++;
                        console.log('Member parents saved successfully');
                    } else {
                        savedSections++; // Count as saved even if empty
                    }
                } catch (error) {
                    errors.push('Member Parents: ' + error.message);
                    console.error('Failed to save member parents:', error);
                }
            }
            
            // Save Member Paternal Grandparents
            if (memberPaternalGrandparentsComponent) {
                totalSections++;
                try {
                    const grandparentsData = memberPaternalGrandparentsComponent.getData();
                    if (grandparentsData.paternal_grandfather_name || grandparentsData.paternal_grandmother_name) {
                        await saveFamilyTreeSubsection(grandparentsData, '', 'paternal');
                        memberPaternalGrandparentsComponent.markSectionComplete();
                        savedSections++;
                        console.log('Member paternal grandparents saved successfully');
                    } else {
                        savedSections++; // Count as saved even if empty
                    }
                } catch (error) {
                    errors.push('Member Paternal Grandparents: ' + error.message);
                    console.error('Failed to save member paternal grandparents:', error);
                }
            }
            
            // Save Member Maternal Grandparents
            if (memberMaternalGrandparentsComponent) {
                totalSections++;
                try {
                    const grandparentsData = memberMaternalGrandparentsComponent.getData();
                    if (grandparentsData.maternal_grandfather_name || grandparentsData.maternal_grandmother_name) {
                        await saveFamilyTreeSubsection(grandparentsData, '', 'maternal');
                        memberMaternalGrandparentsComponent.markSectionComplete();
                        savedSections++;
                        console.log('Member maternal grandparents saved successfully');
                    } else {
                        savedSections++; // Count as saved even if empty
                    }
                } catch (error) {
                    errors.push('Member Maternal Grandparents: ' + error.message);
                    console.error('Failed to save member maternal grandparents:', error);
                }
            }
        }
        
        // Save Spouse Family Tree subsections if visible and married
        if (userData.isMarried === 'yes' && isElementVisible('spouse-family-tree-content')) {
            // Save Spouse Parents
            if (spouseParentsComponent) {
                totalSections++;
                try {
                    const spouseParentsData = spouseParentsComponent.getData();
                    if (spouseParentsData.spouse_father_name || spouseParentsData.spouse_mother_name) {
                        await saveFamilyTreeSubsection(spouseParentsData, 'spouse_', '');
                        spouseParentsComponent.markSectionComplete();
                        savedSections++;
                        console.log('Spouse parents saved successfully');
                    } else {
                        savedSections++; // Count as saved even if empty
                    }
                } catch (error) {
                    errors.push('Spouse Parents: ' + error.message);
                    console.error('Failed to save spouse parents:', error);
                }
            }
            
            // Save Spouse Paternal Grandparents
            if (spousePaternalGrandparentsComponent) {
                totalSections++;
                try {
                    const spouseGrandparentsData = spousePaternalGrandparentsComponent.getData();
                    if (spouseGrandparentsData.spouse_paternal_grandfather_name || spouseGrandparentsData.spouse_paternal_grandmother_name) {
                        await saveFamilyTreeSubsection(spouseGrandparentsData, 'spouse_', 'paternal');
                        spousePaternalGrandparentsComponent.markSectionComplete();
                        savedSections++;
                        console.log('Spouse paternal grandparents saved successfully');
                    } else {
                        savedSections++; // Count as saved even if empty
                    }
                } catch (error) {
                    errors.push('Spouse Paternal Grandparents: ' + error.message);
                    console.error('Failed to save spouse paternal grandparents:', error);
                }
            }
            
            // Save Spouse Maternal Grandparents
            if (spouseMaternalGrandparentsComponent) {
                totalSections++;
                try {
                    const spouseGrandparentsData = spouseMaternalGrandparentsComponent.getData();
                    if (spouseGrandparentsData.spouse_maternal_grandfather_name || spouseGrandparentsData.spouse_maternal_grandmother_name) {
                        await saveFamilyTreeSubsection(spouseGrandparentsData, 'spouse_', 'maternal');
                        spouseMaternalGrandparentsComponent.markSectionComplete();
                        savedSections++;
                        console.log('Spouse maternal grandparents saved successfully');
                    } else {
                        savedSections++; // Count as saved even if empty
                    }
                } catch (error) {
                    errors.push('Spouse Maternal Grandparents: ' + error.message);
                    console.error('Failed to save spouse maternal grandparents:', error);
                }
            }
        }
        
        // Check for completion and update button text
        checkProfileCompletion();
        
        // Show results
        if (errors.length === 0) {
            showNotification(`Successfully saved ${savedSections} section${savedSections !== 1 ? 's' : ''}!`, 'success');
        } else if (savedSections > 0) {
            showNotification(`Saved ${savedSections}/${totalSections} sections. Some sections had errors.`, 'warning');
            console.warn('Save errors:', errors);
        } else {
            showNotification('Failed to save any sections. Please check the form data.', 'error');
            console.error('All save attempts failed:', errors);
        }
        
    } catch (error) {
        console.error('Error in saveAllChanges:', error);
        showNotification('An unexpected error occurred while saving.', 'error');
        throw error; // Re-throw to let calling function handle it
    }
}

function isElementVisible(elementId) {
    const element = document.getElementById(elementId);
    return element && element.style.display !== 'none';
}

function checkProfileCompletion() {
    updateSaveSubmitButton();
}

async function handleSaveSubmit() {
    // Check if all required sections are completed
    const requiredSections = ['member-details'];
    if (userData.isMarried === 'yes') {
        requiredSections.push('spouse-details');
    }
    if (userData.hasChildren === 'yes') {
        requiredSections.push('children-details');
    }
    
    const allRequiredCompleted = requiredSections.every(section => sectionCompletionStatus[section]);
    
    if (!allRequiredCompleted) {
        // Show what sections are missing
        const missingSections = requiredSections.filter(section => !sectionCompletionStatus[section]);
        const sectionNames = missingSections.map(section => {
            switch(section) {
                case 'member-details': return 'Member Details';
                case 'spouse-details': return 'Spouse Details';
                case 'children-details': return 'Children Details';
                default: return section;
            }
        });
        
        showNotification(`Please complete the following sections first: ${sectionNames.join(', ')}`, 'error');
        return;
    }
    
    try {
        // Start loading state
        setSubmitButtonState('submit', true);
        
        // First save all changes if needed
        const needsSaving = !sectionSaveStates['member-details'] || 
                           (userData.isMarried === 'yes' && !sectionSaveStates['spouse-details']) ||
                           (userData.hasChildren === 'yes' && !sectionSaveStates['children-details']);
        
        if (needsSaving) {
            await saveAllChanges();
        }
        
        // Then submit the profile
        await finalSubmitProfile();
        
        // Set submitted state
        setSubmitButtonState('submitted');
        
    } catch (error) {
        console.error('Error in handleSaveSubmit:', error);
        showNotification('Failed to save and submit profile: ' + error.message, 'error');
        
        // Reset button state
        setSubmitButtonState('submit');
    }
}

function hasUnsavedChanges() {
    // Simple check - in a real app, you'd track form changes
    // For now, assume there are always potential changes unless all sections are complete
    const allSectionsComplete = checkAllSectionsComplete();
    return !allSectionsComplete;
}

function checkAllSectionsComplete() {
    // Check if all required sections are completed
    const memberComplete = sectionCompletionStatus['member-details'];
    const spouseComplete = userData.isMarried === 'yes' ? sectionCompletionStatus['spouse-details'] : true;
    const childrenComplete = userData.hasChildren === 'yes' ? sectionCompletionStatus['children-details'] : true;
    
    // Check family tree completion (optional sections)
    const memberFamilyComplete = sectionCompletionStatus['member-family-tree'] || true; // Optional
    const spouseFamilyComplete = userData.isMarried === 'yes' ? (sectionCompletionStatus['spouse-family-tree'] || true) : true; // Optional
    
    return memberComplete && spouseComplete && childrenComplete && memberFamilyComplete && spouseFamilyComplete;
}

function populateSpouseForm(spouse) {
    console.log('Populating spouse form with:', spouse);
    
    const fields = {
        'spouseFirstName': spouse.first_name,
        'spouseSecondName': spouse.second_name,
        'spouseGender': spouse.gender,
        'spousePhone': spouse.phone ? parsePhoneNumber(spouse.phone).phoneNumber : '',
        'spouseEmail': spouse.email
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
        }
    });
    
    // Handle spouse date of birth with default if empty
    const spouseDobInput = document.getElementById('spouseDateOfBirth');
    if (spouseDobInput) {
        const dob = spouse.date_of_birth;
        if (dob && dob !== '0000-00-00' && dob !== '1900-01-01' && dob !== 'NULL') {
            spouseDobInput.value = dob;
            // Update age display immediately
            updateAgeDisplay(dob, 'spouseAgeField', 'spouseAgeFieldContainer');
        } else {
            // Leave field blank if no valid DOB in database
            spouseDobInput.value = '';
            // Hide age display
            const spouseAgeDisplay = document.getElementById('spouseAgeFieldContainer');
            if (spouseAgeDisplay) spouseAgeDisplay.classList.add('hidden');
        }
    }
    
    // Handle country code for spouse phone
    if (spouse.phone) {
        const { countryCode } = parsePhoneNumber(spouse.phone);
        const spouseCountryCodeSelect = document.getElementById('spouseCountryCode');
        if (spouseCountryCodeSelect) {
            spouseCountryCodeSelect.value = countryCode || '+91';
        }
    }
}

function populateChildrenForms(children) {
    console.log('Populating children forms with:', children);
    
    const container = document.getElementById('childrenFormsContainer');
    if (!container) return;
    
    // Clear existing forms
    container.innerHTML = '';
    childrenCount = 0;
    
    // Add forms for each child
    children.forEach((child, index) => {
        addChildForm();
        
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
                const dob = child.date_of_birth;
                if (dob && dob !== '0000-00-00' && dob !== '1900-01-01' && dob !== 'NULL') {
                    dobInput.value = dob;
                    // Update age display for existing child
                    updateAgeDisplay(dob, `childAgeField_${index + 1}`, `childAgeFieldContainer_${index + 1}`);
                } else {
                    dobInput.value = '';
                }
            }
        }
    });
}

function populateMemberFamilyTree(familyTree) {
    console.log('Populating member family tree with:', familyTree);
    
    const fields = {
        'fatherName': familyTree.father_name,
        'motherName': familyTree.mother_name,
        'paternalGrandfather': familyTree.paternal_grandfather_name,
        'paternalGrandmother': familyTree.paternal_grandmother_name,
        'maternalGrandfather': familyTree.maternal_grandfather_name,
        'maternalGrandmother': familyTree.maternal_grandmother_name
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
        }
    });
}

function populateSpouseFamilyTree(familyTree) {
    console.log('Populating spouse family tree with:', familyTree);
    
    const fields = {
        'spouseFatherName': familyTree.father_name,
        'spouseMotherName': familyTree.mother_name,
        'spousePaternalGrandfather': familyTree.paternal_grandfather_name,
        'spousePaternalGrandmother': familyTree.paternal_grandmother_name,
        'spouseMaternalGrandfather': familyTree.maternal_grandfather_name,
        'spouseMaternalGrandmother': familyTree.maternal_grandmother_name
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
        }
    });
}

function showNotification(message, type = 'info') {
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

// ====================================================================
// NAVIGATION FUNCTIONS
// ====================================================================

/**
 * Navigate back to intro questions page
 */
function goBackToIntroQuestions() {
    // Save current profile completion progress
    const progressData = {
        timestamp: new Date().toISOString(),
        currentStep: 'profile_completion',
        returnTo: 'profile_completion'
    };
    
    // Store in localStorage so user can return to this page
    localStorage.setItem('profile_completion_progress', JSON.stringify(progressData));
    
    // Navigate to intro questions page
    window.location.href = 'getIntro.html';
}

// Make function globally available
window.goBackToIntroQuestions = goBackToIntroQuestions;

// ====================================================================
// PERMANENT ADDRESS FUNCTIONALITY
// ====================================================================

/**
 * Toggle permanent address fields based on "Same as Current" checkbox
 */
function togglePermanentAddressFields(isSameAsCurrent) {
    const permanentFields = document.getElementById('permanentAddressFields');
    const permanentInputs = permanentFields.querySelectorAll('input, select');
    
    if (isSameAsCurrent) {
        // Copy current address to permanent address
        copyCurrentToPermanentAddress();
        
        // Make permanent address fields readonly
        permanentInputs.forEach(input => {
            input.readOnly = true;
            input.disabled = true;
            input.classList.add('bg-gray-100', 'cursor-not-allowed');
        });
    } else {
        // Enable permanent address fields for editing
        permanentInputs.forEach(input => {
            input.readOnly = false;
            input.disabled = false;
            input.classList.remove('bg-gray-100', 'cursor-not-allowed');
        });
    }
}

/**
 * Copy current address data to permanent address fields
 */
function copyCurrentToPermanentAddress() {
    const addressMappings = [
        { current: 'addressLine1', permanent: 'permanentAddressLine1' },
        { current: 'addressLine2', permanent: 'permanentAddressLine2' },
        { current: 'city', permanent: 'permanentCity' },
        { current: 'pinCode', permanent: 'permanentPinCode' },
        { current: 'state', permanent: 'permanentState' },
        { current: 'country', permanent: 'permanentCountry' }
    ];

    addressMappings.forEach(mapping => {
        const currentField = document.getElementById(mapping.current);
        const permanentField = document.getElementById(mapping.permanent);
        
        if (currentField && permanentField) {
            permanentField.value = currentField.value;
        }
    });
}

// Make function globally available for HTML onclick
window.togglePermanentAddressFields = togglePermanentAddressFields;

// ====================================================================
// RESIDENCE AUTO-POPULATE FUNCTIONALITY
// ====================================================================

/**
 * Handle residence auto-populate for family tree members
 */
function handleResidenceAutoPopulate(memberType, isChecked) {
    console.log('Residence auto-populate:', memberType, isChecked);
    
    if (isChecked) {
        copyResidenceData(memberType);
    } else {
        clearResidenceData(memberType);
    }
}

/**
 * Copy residence data based on type
 */
function copyResidenceData(memberType) {
    // For grandfathers: Same as Native
    if (memberType.includes('grandfather')) {
        const nativeField = document.querySelector(`[name="${memberType}_native"]`);
        const residenceField = document.querySelector(`[name="${memberType}_residence"]`);
        
        if (nativeField && residenceField) {
            residenceField.value = nativeField.value;
            residenceField.readOnly = true;
            residenceField.classList.add('bg-gray-100');
        }
    }
    // For grandmothers: Same as respective grandfather's residence
    else if (memberType.includes('grandmother')) {
        const grandfatherType = memberType.replace('grandmother', 'grandfather');
        const grandfatherResidenceField = document.querySelector(`[name="${grandfatherType}_residence"]`);
        const grandmotherResidenceField = document.querySelector(`[name="${memberType}_residence"]`);
        
        if (grandfatherResidenceField && grandmotherResidenceField) {
            grandmotherResidenceField.value = grandfatherResidenceField.value;
            grandmotherResidenceField.readOnly = true;
            grandmotherResidenceField.classList.add('bg-gray-100');
        }
    }
    // For parents: Same as Native
    else {
        const nativeField = document.querySelector(`[name="${memberType}_native"]`);
        const residenceField = document.querySelector(`[name="${memberType}_residence"]`);
        
        if (nativeField && residenceField) {
            residenceField.value = nativeField.value;
            residenceField.readOnly = true;
            residenceField.classList.add('bg-gray-100');
        }
    }
}

/**
 * Clear residence data and enable editing
 */
function clearResidenceData(memberType) {
    const residenceField = document.querySelector(`[name="${memberType}_residence"]`);
    
    if (residenceField) {
        residenceField.value = '';
        residenceField.readOnly = false;
        residenceField.classList.remove('bg-gray-100');
    }
}

// Make function globally available
window.handleResidenceAutoPopulate = handleResidenceAutoPopulate;

// ====================================================================
// END OF PROFILE COMPLETION SCRIPT
// ====================================================================
// Syntax error fix completed - duplicate functions removed
console.log('Profile completion vertical script loaded successfully');
