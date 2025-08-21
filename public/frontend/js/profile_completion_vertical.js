import { apiFetch } from './api.js';
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
    // Check authentication
    const sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    initializeEventListeners();
    populateLocationData();
    
    // Load existing profile data and populate form (this will include intro data from database)
    await loadExistingProfile();
    
    // Initialize sections
    initializeSections();
    
    // Initialize components
    initializeComponents();
    
    // Initialize DOB functionality
    initializeDOBFields();
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
    const content = document.getElementById(sectionId + '-content');
    const icon = document.getElementById(sectionId + '-icon');
    
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
    
    const btn = document.getElementById('saveMemberDetails');
    const text = document.getElementById('saveMemberText');
    const spinner = document.getElementById('saveMemberSpinner');
    
    try {
        setButtonLoading(btn, text, spinner, 'Saving...', true);
        
        // Validate age before saving
        const dobInput = document.getElementById('dateOfBirth');
        if (dobInput && dobInput.value) {
            if (!validateMemberAge(dobInput.value)) {
                markSectionError('member-details');
                showNotification('You must be at least 18 years old to register.', 'error');
                return;
            }
        }
        
        const memberDetails = getFormData('memberDetailsForm');
        
        // Validate email format if provided
        if (memberDetails.email && memberDetails.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(memberDetails.email.trim())) {
                markSectionError('member-details');
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
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
            showNotification('Member details saved successfully!', 'success');
            checkProfileCompletion();
        } else {
            markSectionError('member-details');
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
        
        showNotification(errorMessage, 'error');
    } finally {
        setButtonLoading(btn, text, spinner, 'Save Section', false);
    }
}

async function saveSpouseDetails() {
    if (userData.isMarried !== 'yes') return;
    if (!validateSession()) return;
    
    const btn = document.getElementById('saveSpouseDetails');
    const text = document.getElementById('saveSpouseText');
    const spinner = document.getElementById('saveSpouseSpinner');
    
    try {
        setButtonLoading(btn, text, spinner, 'Saving...', true);
        
        const spouseDetails = getFormData('spouseDetailsForm');
        
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
            showNotification('Spouse details saved successfully!', 'success');
            checkProfileCompletion();
        } else {
            markSectionError('spouse-details');
            throw new Error(response.error || 'Failed to save spouse details.');
        }
    } catch (error) {
        console.error('Error saving spouse details:', error);
        markSectionError('spouse-details');
        showNotification('Failed to save spouse details: ' + error.message, 'error');
    } finally {
        setButtonLoading(btn, text, spinner, 'Save Section', false);
    }
}

async function saveChildrenDetails() {
    if (userData.hasChildren !== 'yes') return;
    if (!validateSession()) return;
    
    const btn = document.getElementById('saveChildrenDetails');
    const text = document.getElementById('saveChildrenText');
    const spinner = document.getElementById('saveChildrenSpinner');
    
    try {
        setButtonLoading(btn, text, spinner, 'Saving...', true);
        
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
            showNotification('Children details saved successfully!', 'success');
            checkProfileCompletion();
        } else {
            markSectionError('children-details');
            throw new Error(response.error || 'Failed to save children details.');
        }
    } catch (error) {
        console.error('Error saving children details:', error);
        markSectionError('children-details');
        showNotification('Failed to save children details: ' + error.message, 'error');
    } finally {
        setButtonLoading(btn, text, spinner, 'Save Section', false);
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
    const btn = document.getElementById('finalSubmitBtn');
    const text = document.getElementById('finalSubmitText');
    const spinner = document.getElementById('finalSubmitSpinner');
    const icon = document.getElementById('finalSubmitIcon');
    
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
            childrenData.push(childData);
        }
    });
    
    return childrenData;
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
                           class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
                    <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <p class="text-xs text-gray-500 mt-1">Enter child's date of birth</p>
                <p id="childDobHelp_${childrenCount}" class="text-sm text-blue-600 mt-1">📅 Please enter the actual date of birth</p>
            </div>
        </div>
    `;
    
    container.appendChild(childForm);
    
    childForm.querySelector('.remove-child-btn').addEventListener('click', () => {
        childForm.remove();
    });
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
        const data = await apiFetch('profile.php', {
            method: 'GET'
        });

        console.log('API response data in loadExistingProfile:', data);
        
        if (data.success && data.profile) {
            if (data.profile.profile_completed) {
                window.location.href = 'dashboard.html';
                return;
            }
            console.log('Profile data to populate:', data.profile);
            console.log('Gender from profile:', data.profile.gender);
            console.log('IsMarried from profile:', data.profile.isMarried);
            console.log('HasChildren from profile:', data.profile.hasChildren);
            console.log('All profile columns:', Object.keys(data.profile));
            
            // Extract intro data from profile for userData
            if (data.profile.gender || data.profile.isMarried || data.profile.hasChildren) {
                userData.gender = data.profile.gender;
                userData.isMarried = data.profile.isMarried;
                userData.hasChildren = data.profile.hasChildren;
                userData.marriageType = data.profile.marriageType;
                userData.marriageStatus = data.profile.marriageStatus;
                userData.role = data.profile.role;
                console.log('Updated userData with database intro data:', userData);
            } else {
                console.log('No intro data found in database, user may need to complete intro questions first');
                // Set defaults for users who haven't completed intro questions
                userData.isMarried = 'no';
                userData.hasChildren = 'no';
            }
            
            populateForm(data.profile);
            
            // Update section visibility based on database intro data
            updateSectionVisibility();
            
            // Trigger spouse gender auto-population after a short delay to ensure form is populated
            setTimeout(() => {
                debouncedAutoPopulateSpouseGender();
            }, 100);
            
            // Check if member details section should be marked as completed
            if (data.profile.first_name && data.profile.date_of_birth && data.profile.phone) {
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
        } else {
            // Set default to 25 years ago if no valid DOB in database
            const twentyFiveYearsAgo = new Date();
            twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
            dobInput.value = twentyFiveYearsAgo.toISOString().split('T')[0];
        }
    }
    
    // Populate phone and email
    let phoneToUse = profile.phone || storedUserData.phone || '';
    const emailInput = document.getElementById('email');
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
        
        if (countryCodeSelect) countryCodeSelect.value = countryCode || '+91';
        if (phoneInput) {
            phoneInput.value = phoneNumber;
            if (storedUserData.phone && storedUserData.created_via_invitation) {
                phoneInput.readOnly = true;
                phoneInput.classList.add('bg-gray-50');
            }
        }
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
    // Get a reasonable birth date (not today - set to 25 years ago as default)
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
    const defaultDate = twentyFiveYearsAgo.toISOString().split('T')[0];
    
    // Set default for member DOB
    const memberDobInput = document.getElementById('dateOfBirth');
    if (memberDobInput && !memberDobInput.value) {
        memberDobInput.value = defaultDate;
    }
    
    // Set default for spouse DOB
    const spouseDobInput = document.getElementById('spouseDateOfBirth');
    if (spouseDobInput && !spouseDobInput.value) {
        spouseDobInput.value = defaultDate;
    }
    
    // Add DOB validation listeners
    if (memberDobInput) {
        memberDobInput.addEventListener('change', function() {
            validateMemberAge(this.value);
            debouncedAutoPopulateSpouseGender();
        });
    }
    
    if (spouseDobInput) {
        spouseDobInput.addEventListener('change', function() {
            validateSpouseAge(this.value);
        });
    }
    
    // Add gender change listener for auto-populating spouse gender
    const genderInput = document.getElementById('gender');
    if (genderInput) {
        genderInput.addEventListener('change', debouncedAutoPopulateSpouseGender);
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
    
    // Set opposite gender for spouse (only for male/female, not others)
    if (memberGender === 'male') {
        spouseGenderSelect.value = 'female';
        console.log('Set spouse gender to female');
    } else if (memberGender === 'female') {
        spouseGenderSelect.value = 'male';
        console.log('Set spouse gender to male');
    }
    // For "others" gender, leave spouse gender empty for manual selection
}

// Make function available globally for components
window.autoPopulateSpouseGender = autoPopulateSpouseGender;
window.debouncedAutoPopulateSpouseGender = debouncedAutoPopulateSpouseGender;

async function saveAllChanges() {
    const saveAllBtn = document.getElementById('saveAllBtn');
    const saveAllText = document.getElementById('saveAllText');
    const saveAllSpinner = document.getElementById('saveAllSpinner');
    
    try {
        // Start loading state
        saveAllBtn.disabled = true;
        saveAllText.textContent = 'Saving...';
        saveAllSpinner.classList.remove('hidden');
        
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
    } finally {
        // Reset button state
        saveAllBtn.disabled = false;
        saveAllText.textContent = 'Save All Changes';
        saveAllSpinner.classList.add('hidden');
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
    const saveSubmitBtn = document.getElementById('saveSubmitBtn');
    const saveSubmitText = document.getElementById('saveSubmitText');
    const saveSubmitSpinner = document.getElementById('saveSubmitSpinner');
    const saveSubmitIcon = document.getElementById('saveSubmitIcon');
    
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
        saveSubmitBtn.disabled = true;
        saveSubmitText.textContent = 'Saving & Submitting...';
        saveSubmitSpinner.classList.remove('hidden');
        saveSubmitIcon.classList.add('hidden');
        
        // First save all changes
        await saveAllChanges();
        
        // Then submit the profile
        await finalSubmitProfile();
        
    } catch (error) {
        console.error('Error in handleSaveSubmit:', error);
        showNotification('Failed to save and submit profile: ' + error.message, 'error');
        
        // Reset button state
        saveSubmitBtn.disabled = false;
        updateSaveSubmitButton();
        saveSubmitSpinner.classList.add('hidden');
        saveSubmitIcon.classList.remove('hidden');
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
        } else {
            // Set default to 25 years ago if no valid DOB in database
            const twentyFiveYearsAgo = new Date();
            twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
            spouseDobInput.value = twentyFiveYearsAgo.toISOString().split('T')[0];
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
            if (dobInput) dobInput.value = child.date_of_birth || '';
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
