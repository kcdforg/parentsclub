/**
 * Member Details Component
 * Reusable component for member personal information
 */

export class MemberDetailsComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            title: 'Member Details',
            description: 'Your personal information',
            sectionId: 'member-details',
            required: true,
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
                    <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" id="firstName" name="first_name" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter your first name">
                        <i class="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div>
                    <label for="secondName" class="block text-sm font-medium text-gray-700 mb-2">
                        Second Name
                    </label>
                    <div class="relative">
                        <input type="text" id="secondName" name="second_name"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter your second name (optional)">
                        <i class="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="gender" class="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <select id="gender" name="gender" required
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="" disabled selected>Select your gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="others">Others</option>
                        </select>
                        <i class="fas fa-venus-mars absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="dateOfBirth" class="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="date" id="dateOfBirth" name="date_of_birth" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
                        <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">You must be at least 18 years old</p>
                    <p id="dobHelp" class="text-sm text-blue-600 mt-1">📅 Please enter your actual date of birth</p>
                </div>

                <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span class="text-red-500">*</span>
                    </label>
                    <div class="flex">
                        <select id="countryCode" name="country_code" 
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
                        <input type="tel" id="phone" name="phone" required
                               class="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-primary"
                               placeholder="9876543210" maxlength="10">
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        <span id="phoneHelp">🇮🇳 Enter 10 digits starting with 6, 7, 8, or 9</span>
                    </p>
                </div>

                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                        Email Address (Optional)
                    </label>
                    <div class="relative">
                        <input type="email" id="email" name="email"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Enter your email address (optional)">
                        <i class="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div class="md:col-span-2">
                    <label for="addressLine1" class="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1 <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" id="addressLine1" name="address_line1" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Address Line 1">
                        <i class="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div class="md:col-span-2">
                    <label for="addressLine2" class="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2
                    </label>
                    <div class="relative">
                        <input type="text" id="addressLine2" name="address_line2"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="Address Line 2 (Optional)">
                        <i class="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="city" class="block text-sm font-medium text-gray-700 mb-2">City <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <input type="text" id="city" name="city" required
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="City">
                        <i class="fas fa-city absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="pinCode" class="block text-sm font-medium text-gray-700 mb-2">
                        PIN Code <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" id="pinCode" name="pin_code" required maxlength="6"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="123456">
                        <i class="fas fa-location-dot absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">6-digit postal code</p>
                </div>

                <div>
                    <label for="state" class="block text-sm font-medium text-gray-700 mb-2">State <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <select id="state" name="state" required
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select State</option>
                        </select>
                        <i class="fas fa-map-marked-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-2">Country <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <select id="country" name="country" required
                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                            <option value="">Select Country</option>
                        </select>
                        <i class="fas fa-globe absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add any specific event listeners for member details
        const dobInput = document.getElementById('dateOfBirth');
        if (dobInput) {
            dobInput.addEventListener('change', (e) => {
                this.validateAge(e.target.value);
            });
        }

        const genderInput = document.getElementById('gender');
        if (genderInput) {
            genderInput.addEventListener('change', () => {
                // Trigger spouse gender auto-population if available
                if (window.debouncedAutoPopulateSpouseGender) {
                    window.debouncedAutoPopulateSpouseGender();
                } else if (window.autoPopulateSpouseGender) {
                    // Fallback to original function if debounced version not available
                    window.autoPopulateSpouseGender();
                }
            });
        }
    }

    validateAge(dateOfBirth) {
        if (!dateOfBirth) return false;
        
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
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

    populate(data) {
        this.data = data;
        
        // Populate form fields
        const fields = {
            'firstName': data.first_name,
            'secondName': data.second_name,
            'gender': data.gender,
            'dateOfBirth': data.date_of_birth,
            'email': data.email,
            'addressLine1': data.address_line1,
            'addressLine2': data.address_line2,
            'city': data.city,
            'pinCode': data.pin_code,
            'state': data.state,
            'country': data.country
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
            const countryCodeSelect = document.getElementById('countryCode');
            const phoneInput = document.getElementById('phone');
            
            if (countryCodeSelect) countryCodeSelect.value = countryCode || '+91';
            if (phoneInput) phoneInput.value = phoneNumber;
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
        const requiredFields = ['first_name', 'gender', 'date_of_birth', 'phone', 'address_line1', 'city', 'pin_code', 'state', 'country'];
        
        for (let field of requiredFields) {
            if (!data[field] || !data[field].trim()) {
                return { valid: false, message: `${field.replace('_', ' ')} is required` };
            }
        }

        // Validate phone number
        if (!/^\d{10}$/.test(data.phone)) {
            return { valid: false, message: 'Please enter a valid 10-digit phone number' };
        }

        // Validate age
        if (data.date_of_birth && !this.validateAge(data.date_of_birth)) {
            return { valid: false, message: 'You must be at least 18 years old' };
        }

        return { valid: true };
    }
}
