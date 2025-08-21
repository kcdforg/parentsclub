/**
 * Spouse Details Component
 * Reusable component for spouse personal information
 */

export class SpouseDetailsComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            title: 'Spouse Details',
            description: 'Your spouse\'s information',
            sectionId: 'spouse-details',
            required: false,
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
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="spouseFirstName" class="block text-sm font-medium text-gray-700 mb-2">
                        Spouse's First Name <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" id="spouseFirstName" name="spouse_first_name" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter spouse's first name">
                        <i class="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div>
                    <label for="spouseSecondName" class="block text-sm font-medium text-gray-700 mb-2">
                        Spouse's Second Name
                    </label>
                    <div class="relative">
                        <input type="text" id="spouseSecondName" name="spouse_second_name"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter spouse's second name (optional)">
                        <i class="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="spouseGender" class="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <select id="spouseGender" name="spouse_gender" required
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="others">Others</option>
                        </select>
                        <i class="fas fa-venus-mars absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="spouseDateOfBirth" class="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="date" id="spouseDateOfBirth" name="spouse_date_of_birth" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
                        <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Enter spouse's date of birth</p>
                    <p id="spouseDobHelp" class="text-sm text-blue-600 mt-1">📅 Please enter the actual date of birth</p>
                </div>

                <div>
                    <label for="spousePhone" class="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (Optional)
                    </label>
                    <div class="flex">
                        <select id="spouseCountryCode" name="spouse_country_code" 
                                class="px-3 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                            <option value="+91" selected>🇮🇳 +91</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+61">🇦🇺 +61</option>
                            <option value="+81">🇯🇵 +81</option>
                            <option value="+49">🇩🇪 +49</option>
                            <option value="+33">🇫🇷 +33</option>
                            <option value="+39">🇮🇹 +39</option>
                            <option value="+34">🇪🇸 +34</option>
                            <option value="+86">🇨🇳 +86</option>
                        </select>
                        <input type="tel" id="spousePhone" name="spouse_phone"
                               class="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-primary"
                               placeholder="9876543210" maxlength="10">
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        <span id="spousePhoneHelp">🇮🇳 Enter 10 digits starting with 6, 7, 8, or 9</span>
                    </p>
                </div>

                <div>
                    <label for="spouseEmail" class="block text-sm font-medium text-gray-700 mb-2">
                        Email Address (Optional)
                    </label>
                    <div class="relative">
                        <input type="email" id="spouseEmail" name="spouse_email"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter spouse's email address (optional)">
                        <i class="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add age validation for spouse DOB
        const spouseDobInput = document.getElementById('spouseDateOfBirth');
        if (spouseDobInput) {
            spouseDobInput.addEventListener('change', (e) => {
                this.validateAge(e.target.value);
            });
        }
    }

    validateAge(dateOfBirth) {
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

    populate(data) {
        this.data = data;
        
        const fields = {
            'spouseFirstName': data.first_name,
            'spouseSecondName': data.second_name,
            'spouseGender': data.gender,
            'spouseDateOfBirth': data.date_of_birth,
            'spouseEmail': data.email
        };
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
        
        // Handle phone number
        if (data.phone) {
            const { countryCode, phoneNumber } = this.parsePhoneNumber(data.phone);
            const spouseCountryCodeSelect = document.getElementById('spouseCountryCode');
            const spousePhoneInput = document.getElementById('spousePhone');
            
            if (spouseCountryCodeSelect) spouseCountryCodeSelect.value = countryCode || '+91';
            if (spousePhoneInput) spousePhoneInput.value = phoneNumber;
        }

        // Validate age if DOB is set
        if (data.date_of_birth) {
            this.validateAge(data.date_of_birth);
        }
    }

    parsePhoneNumber(phone) {
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

    getData() {
        const formData = {};
        const form = document.getElementById(this.containerId).closest('form') || 
                     document.getElementById(this.containerId);
        
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            }
        });
        
        return formData;
    }

    validate() {
        const data = this.getData();
        const requiredFields = ['spouse_first_name', 'spouse_gender', 'spouse_date_of_birth'];
        
        for (let field of requiredFields) {
            if (!data[field] || !data[field].trim()) {
                return { valid: false, message: `${field.replace('_', ' ')} is required` };
            }
        }

        // Validate phone number if provided
        if (data.spouse_phone && !/^\d{10}$/.test(data.spouse_phone)) {
            return { valid: false, message: 'Please enter a valid 10-digit phone number for spouse' };
        }

        return { valid: true };
    }

    autoPopulateGender(memberGender) {
        const spouseGenderSelect = document.getElementById('spouseGender');
        if (!spouseGenderSelect || !memberGender) return;
        
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
}
