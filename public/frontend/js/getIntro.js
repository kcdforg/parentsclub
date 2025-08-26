import { apiFetch } from './api.js';

// Get URL parameters (invitation code only used during registration flow)
const urlParams = new URLSearchParams(window.location.search);
const invitationCode = urlParams.get('invitation'); // Only present during registration, not login flow

// User data storage
let userData = {
    gender: '',
    marriageType: '',
    hasChildren: '',
    isMarried: '',
    marriageStatus: '',
    statusAcceptance: '',
    role: ''
};

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user has session first
    const sessionToken = localStorage.getItem('user_session_token');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return;
    }

    initializeEventListeners();
});

function initializeEventListeners() {
    // Welcome section
    document.getElementById('excitedBtn').addEventListener('click', showQuestions);

    // Form submission
    document.getElementById('introQuestionsForm').addEventListener('submit', handleFormSubmit);

    // Radio button listeners for conditional logic
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', handleGenderChange);
    });
    
    document.querySelectorAll('input[name="marriageType"]').forEach(radio => {
        radio.addEventListener('change', handleMarriageStatusChange);
    });
    
    document.querySelectorAll('input[name="hasChildren"]').forEach(radio => {
        radio.addEventListener('change', updateSubmitButton);
    });
}

function showQuestions() {
    document.getElementById('welcomeSection').classList.add('hidden');
    document.getElementById('questionsSection').classList.remove('hidden');
}

function handleGenderChange() {
    const gender = document.querySelector('input[name="gender"]:checked');
    if (gender) {
        userData.gender = gender.value;
        
        // If "others" is selected, hide marriage and children questions and set defaults
        if (gender.value === 'others') {
            hideConditionalQuestions();
            setDefaultsForOthers();
        } else {
            // Show marriage question for male/female
            showMarriageQuestion();
        }
        
        updateSubmitButton();
    }
}

function handleMarriageStatusChange() {
    const marriageType = document.querySelector('input[name="marriageType"]:checked');
    if (marriageType) {
        userData.marriageType = marriageType.value;
        calculateMarriageData();
        
        // Show/hide children question based on marriage status
        const marriedTypes = ['married', 'widowed', 'divorced', 'remarried'];
        const childrenQuestion = document.getElementById('childrenQuestion');
        
        if (marriedTypes.includes(marriageType.value)) {
            childrenQuestion.style.display = 'block';
            // Make hasChildren required for married users
            document.querySelectorAll('input[name="hasChildren"]').forEach(input => {
                input.setAttribute('required', 'required');
            });
        } else {
            childrenQuestion.style.display = 'none';
            // Set hasChildren to 'no' for unmarried users
            userData.hasChildren = 'no';
            // Remove required attribute
            document.querySelectorAll('input[name="hasChildren"]').forEach(input => {
                input.removeAttribute('required');
                input.checked = false;
            });
        }
        
        calculateRole();
        updateSubmitButton();
    }
}

function hideConditionalQuestions() {
    // Hide marriage and children questions for "others" gender
    const marriageSection = document.querySelector('input[name="marriageType"]').closest('.question-section');
    const childrenSection = document.getElementById('childrenQuestion');
    
    if (marriageSection) marriageSection.style.display = 'none';
    if (childrenSection) childrenSection.style.display = 'none';
    
    // Clear any previous selections
    document.querySelectorAll('input[name="marriageType"]').forEach(input => {
        input.checked = false;
        input.removeAttribute('required');
    });
    document.querySelectorAll('input[name="hasChildren"]').forEach(input => {
        input.checked = false;
        input.removeAttribute('required');
    });
}

function showMarriageQuestion() {
    const marriageSection = document.querySelector('input[name="marriageType"]').closest('.question-section');
    if (marriageSection) {
        marriageSection.style.display = 'block';
        // Make marriage type required for male/female
        document.querySelectorAll('input[name="marriageType"]').forEach(input => {
            input.setAttribute('required', 'required');
        });
    }
}

function setDefaultsForOthers() {
    // Set defaults for "others" gender
    userData.marriageType = 'unmarried';
    userData.isMarried = 'no';
    userData.marriageStatus = 'unmarried';
    userData.statusAcceptance = 'valid';
    userData.hasChildren = 'no';
    userData.role = 'member'; // neutral role
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submitQuestionsBtn');
    const form = document.getElementById('introQuestionsForm');
    
    // Check if all required fields are filled
    const requiredInputs = form.querySelectorAll('input[required]');
    let allValid = true;
    
    for (let input of requiredInputs) {
        if (input.type === 'radio') {
            const name = input.name;
            const checked = form.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                allValid = false;
                break;
            }
        } else if (!input.value.trim()) {
            allValid = false;
            break;
        }
    }
    
    submitBtn.disabled = !allValid;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect all form data
    const formData = new FormData(e.target);
    
    // Update userData with form values
    userData.gender = formData.get('gender') || '';
    userData.marriageType = formData.get('marriageType') || userData.marriageType; // Use existing if "others"
    userData.hasChildren = formData.get('hasChildren') || userData.hasChildren; // Use existing if not married or "others"
    
    // Calculate derived data if not already set
    if (userData.gender !== 'others') {
        calculateMarriageData();
        calculateRole();
    }
    
    // Submit the data
    await submitQuestions();
}

function calculateMarriageData() {
    const marriageType = userData.marriageType;
    
    // Update isMarried, marriageStatus, and statusAcceptance based on marriageType
    switch(marriageType) {
        case 'unmarried':
            userData.isMarried = 'no';
            userData.marriageStatus = 'unmarried';
            userData.statusAcceptance = 'valid';
            userData.hasChildren = 'no'; // Set hasChildren for unmarried users
            break;
        case 'married':
            userData.isMarried = 'yes';
            userData.marriageStatus = 'married';
            userData.statusAcceptance = 'valid';
            break;
        case 'widowed':
            userData.isMarried = 'yes';
            userData.marriageStatus = 'married';
            userData.statusAcceptance = 'valid';
            break;
        case 'divorced':
            userData.isMarried = 'yes';
            userData.marriageStatus = 'married';
            userData.statusAcceptance = 'invalid';
            break;
        case 'remarried':
            userData.isMarried = 'yes';
            userData.marriageStatus = 'complicated';
            userData.statusAcceptance = 'invalid';
            break;
    }
    
    // Calculate initial role
    calculateRole();
}

function calculateRole() {
    const gender = userData.gender;
    const isMarried = userData.isMarried;
    const hasChildren = userData.hasChildren;
    
    if (gender && isMarried) {
        if (isMarried === 'no') {
            userData.role = gender === 'male' ? 'son' : 'daughter';
        } else if (isMarried === 'yes') {
            if (hasChildren === 'yes') {
                userData.role = gender === 'male' ? 'father' : 'mother';
            } else {
                userData.role = gender === 'male' ? 'husband' : 'wife';
            }
        }
    }
}

async function submitQuestions() {
    console.log('submitQuestions called with userData:', userData);
    
    // Validate all answers
    if (!userData.gender || !userData.marriageType) {
        showError('Please answer all required questions.');
        return;
    }

    // For unmarried users, ensure hasChildren is set to 'no'
    if (userData.isMarried === 'no' && !userData.hasChildren) {
        userData.hasChildren = 'no';
        console.log('Set hasChildren to no for unmarried user');
    }

    // If married, validate hasChildren (check if it's explicitly undefined/null/empty)
    if (userData.isMarried === 'yes' && (userData.hasChildren === undefined || userData.hasChildren === null || userData.hasChildren === '')) {
        console.log('Validation failed: married user missing hasChildren answer');
        showError('Please answer the children question.');
        return;
    }
    
    console.log('All validation passed, userData final:', userData);

    // Show loading state
    const submitBtn = document.getElementById('submitQuestionsBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const submitArrow = document.getElementById('submitArrow');
    
    submitBtn.disabled = true;
    submitText.textContent = 'Saving...';
    submitSpinner.classList.remove('hidden');
    submitArrow.classList.add('hidden');

    try {
        // Submit user data to backend (no invitation code needed for login flow)
        const response = await apiFetch('intro_questions.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success) {
            // Show success state
            submitText.textContent = 'Success!';
            submitSpinner.classList.add('hidden');
            
            // Redirect to profile completion steps after a short delay
            setTimeout(() => {
                window.location.href = 'profile_completion.html?step=1';
            }, 1000);
        } else {
            showError(response.error || 'Failed to save your information. Please try again.');
            resetSubmitButton();
        }
    } catch (error) {
        console.error('Error submitting questions:', error);
        showError('Network error. Please check your connection and try again.');
        resetSubmitButton();
    }
}

function resetSubmitButton() {
    const submitBtn = document.getElementById('submitQuestionsBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const submitArrow = document.getElementById('submitArrow');
    
    submitBtn.disabled = false;
    submitText.textContent = 'Continue';
    submitSpinner.classList.add('hidden');
    submitArrow.classList.remove('hidden');
}



function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorSection').classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        document.getElementById('errorSection').classList.add('hidden');
    }, 5000);
}

// ====================================================================
// RETURN FROM PROFILE COMPLETION HANDLING
// ====================================================================

/**
 * Check if user returned from profile completion and show appropriate message
 */
function checkReturnFromProfileCompletion() {
    const progressData = localStorage.getItem('profile_completion_progress');
    if (progressData) {
        try {
            const data = JSON.parse(progressData);
            if (data.returnTo === 'profile_completion') {
                // Show notification that they can return to profile completion
                showReturnMessage();
                // Clear the progress data
                localStorage.removeItem('profile_completion_progress');
            }
        } catch (error) {
            console.error('Error parsing profile completion progress:', error);
            localStorage.removeItem('profile_completion_progress');
        }
    }
}

/**
 * Show message about returning to profile completion
 */
function showReturnMessage() {
    const container = document.querySelector('.container');
    if (container) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-6';
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-arrow-left text-green-600 mr-3"></i>
                <div class="flex-1">
                    <h3 class="font-semibold text-green-800">Returned from Profile Completion</h3>
                    <p class="text-green-700 text-sm mt-1">
                        You can edit your answers below and then return to complete your profile.
                    </p>
                </div>
                <button onclick="returnToProfileCompletion()" 
                        class="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                    <i class="fas fa-arrow-right mr-1"></i>
                    Back to Profile
                </button>
            </div>
        `;
        
        // Insert after header
        const header = container.querySelector('.text-center');
        if (header) {
            header.insertAdjacentElement('afterend', messageDiv);
        }
    }
}

/**
 * Return to profile completion page
 */
function returnToProfileCompletion() {
    window.location.href = 'profile_completion.html';
}

// Make function globally available
window.returnToProfileCompletion = returnToProfileCompletion;

// Check for return on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add a delay to ensure page is fully loaded
    setTimeout(checkReturnFromProfileCompletion, 500);
});
