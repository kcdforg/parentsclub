import { apiFetch } from './api.js';

// Initialize profile page
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

    await loadProfileData();
    initializeEventListeners();
}

async function loadProfileData() {
    showLoading(true);
    
    try {
        const response = await apiFetch('profile.php', {
            method: 'GET'
        });

        if (response.success) {
            // Load all profile sections
            await loadAllProfileSections(response.profile);
        } else {
            console.error('Failed to load profile:', response.error);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    } finally {
        showLoading(false);
    }
}

async function loadAllProfileSections(profile) {
    try {
        // Display member details
        displayMemberDetails(profile);
        
        // Load spouse details if married
        if (profile.isMarried === 'yes') {
            const spouseData = await apiFetch('profile_completion.php', {
                method: 'POST',
                body: JSON.stringify({ step: 'get_spouse_details' })
            });
            
            if (spouseData.success && spouseData.spouse) {
                displaySpouseDetails(spouseData.spouse);
                document.getElementById('spouseDetailsSection').classList.remove('hidden');
            }
        }
        
        // Load children details if has children
        let childrenArray = [];
        if (profile.hasChildren === 'yes') {
            const childrenData = await apiFetch('profile_completion.php', {
                method: 'POST',
                body: JSON.stringify({ step: 'get_children_details' })
            });
            
            if (childrenData.success && childrenData.children && childrenData.children.length > 0) {
                childrenArray = childrenData.children;
                displayChildrenDetails(childrenData.children);
                document.getElementById('childrenDetailsSection').classList.remove('hidden');
            }
        }
        
        // Load member family tree
        const memberFamilyData = await apiFetch('profile_completion.php', {
            method: 'POST',
            body: JSON.stringify({ step: 'get_member_family_tree' })
        });
        
        if (memberFamilyData.success && memberFamilyData.family_tree) {
            displayMemberFamilyTree(memberFamilyData.family_tree);
        }
        
        // Load spouse family tree if married
        if (profile.isMarried === 'yes') {
            const spouseFamilyData = await apiFetch('profile_completion.php', {
                method: 'POST',
                body: JSON.stringify({ step: 'get_spouse_family_tree' })
            });
            
            if (spouseFamilyData.success && spouseFamilyData.family_tree) {
                displaySpouseFamilyTree(spouseFamilyData.family_tree);
                document.getElementById('spouseFamilyTreeSection').classList.remove('hidden');
            }
        }
        
        // Update profile summary with actual data
        updateProfileSummary(profile, childrenArray);
        
    } catch (error) {
        console.error('Error loading profile sections:', error);
    }
}

function displayProfileData(data) {
    // Display member details
    if (data.profile) {
        displayMemberDetails(data.profile);
    }

    // Display spouse details if available
    if (data.spouse && data.spouse.length > 0) {
        displaySpouseDetails(data.spouse[0]);
        document.getElementById('spouseDetailsSection').classList.remove('hidden');
    }

    // Display children details if available
    if (data.children && data.children.length > 0) {
        displayChildrenDetails(data.children);
        document.getElementById('childrenDetailsSection').classList.remove('hidden');
    }

    // Display family trees
    if (data.family_tree) {
        displayFamilyTree(data.family_tree);
    }

    // Update summary
    updateProfileSummary(data);
}

function displayMemberDetails(profile) {
    const container = document.getElementById('memberDetailsContent');
    container.innerHTML = `
        <div>
            <label class="text-sm font-medium text-gray-500">Name</label>
            <p class="text-gray-900">${profile.name || (profile.first_name + ' ' + (profile.second_name || '')).trim() || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Gender</label>
            <p class="text-gray-900">${profile.gender || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Date of Birth</label>
            <p class="text-gray-900">${profile.date_of_birth || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Phone</label>
            <p class="text-gray-900">${profile.phone || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Email</label>
            <p class="text-gray-900">${profile.email || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Role</label>
            <p class="text-gray-900">${profile.role || '-'}</p>
        </div>
        <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-500">Address</label>
            <p class="text-gray-900">
                ${[profile.address_line1, profile.address_line2, profile.city, profile.state, profile.country, profile.pin_code]
                    .filter(Boolean).join(', ') || '-'}
            </p>
        </div>
    `;
}

function displaySpouseDetails(spouse) {
    const container = document.getElementById('spouseDetailsContent');
    container.innerHTML = `
        <div>
            <label class="text-sm font-medium text-gray-500">Name</label>
            <p class="text-gray-900">${(spouse.first_name + ' ' + (spouse.second_name || '')).trim() || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Gender</label>
            <p class="text-gray-900">${spouse.gender || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Date of Birth</label>
            <p class="text-gray-900">${spouse.date_of_birth || '-'}</p>
        </div>
        <div>
            <label class="text-sm font-medium text-gray-500">Phone</label>
            <p class="text-gray-900">${spouse.phone || '-'}</p>
        </div>
    `;
}

function displayChildrenDetails(children) {
    const container = document.getElementById('childrenDetailsContent');
    let html = '';
    
    children.forEach((child, index) => {
        html += `
            <div class="border border-gray-200 rounded-lg p-4 mb-4">
                <h4 class="font-semibold text-gray-900 mb-3">Child ${index + 1}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium text-gray-500">Name</label>
                        <p class="text-gray-900">${(child.first_name + ' ' + (child.second_name || '')).trim() || '-'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Gender</label>
                        <p class="text-gray-900">${child.gender || '-'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p class="text-gray-900">${child.date_of_birth || '-'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Relationship</label>
                        <p class="text-gray-900">${child.relationship || '-'}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function displayMemberFamilyTree(familyTree) {
    const container = document.getElementById('memberFamilyTreeContent');
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="text-sm font-medium text-gray-500">Father's Name</label>
                <p class="text-gray-900">${familyTree.father_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Mother's Name</label>
                <p class="text-gray-900">${familyTree.mother_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Paternal Grandfather</label>
                <p class="text-gray-900">${familyTree.paternal_grandfather_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Paternal Grandmother</label>
                <p class="text-gray-900">${familyTree.paternal_grandmother_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Maternal Grandfather</label>
                <p class="text-gray-900">${familyTree.maternal_grandfather_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Maternal Grandmother</label>
                <p class="text-gray-900">${familyTree.maternal_grandmother_name || '-'}</p>
            </div>
        </div>
    `;
}

function displaySpouseFamilyTree(familyTree) {
    const container = document.getElementById('spouseFamilyTreeContent');
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="text-sm font-medium text-gray-500">Father's Name</label>
                <p class="text-gray-900">${familyTree.father_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Mother's Name</label>
                <p class="text-gray-900">${familyTree.mother_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Paternal Grandfather</label>
                <p class="text-gray-900">${familyTree.paternal_grandfather_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Paternal Grandmother</label>
                <p class="text-gray-900">${familyTree.paternal_grandmother_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Maternal Grandfather</label>
                <p class="text-gray-900">${familyTree.maternal_grandfather_name || '-'}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500">Maternal Grandmother</label>
                <p class="text-gray-900">${familyTree.maternal_grandmother_name || '-'}</p>
            </div>
        </div>
    `;
}

function updateProfileSummary(profile, children = []) {
    // Update role
    document.getElementById('userRole').textContent = profile.role || '-';
    
    // Update marriage status
    let marriageStatus = '-';
    if (profile.isMarried === 'yes') {
        marriageStatus = profile.marriageType || 'Married';
    } else {
        marriageStatus = 'Single';
    }
    document.getElementById('marriageStatus').textContent = marriageStatus;
    
    // Update children count
    const childrenCount = children.length || 0;
    document.getElementById('childrenCount').textContent = childrenCount;
    
    // Update member since (created_at from user data)
    if (profile.created_at) {
        const date = new Date(profile.created_at);
        document.getElementById('memberSince').textContent = date.toLocaleDateString();
    }
}

function initializeEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            openEditModal(section);
        });
    });

    // Close edit modal
    document.getElementById('closeEditModal').addEventListener('click', () => {
        document.getElementById('editModal').classList.add('hidden');
    });
}

function openEditModal(section) {
    // Redirect to profile completion page for editing
    window.location.href = 'profile_completion.html?edit=true';
}

function showLoading(show) {
    const loadingElement = document.getElementById('loadingIndicator');
    if (show) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}
