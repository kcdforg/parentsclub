<?php
session_start();
// Check if user is logged in
if (!isset($_SESSION['user_logged_in']) || $_SESSION['user_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Include reusable components
require_once 'components/header.php';
require_once 'components/footer.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Completion - Registration Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#4f46e5',
                        secondary: '#7c3aed'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <!-- Navigation (hidden on this page) -->
    <?php renderPublicHeader('profile_completion'); ?>

    <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl w-full space-y-8">
            <div class="bg-white rounded-2xl shadow-xl p-8">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-user-edit text-white text-2xl"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900">Complete Your Profile</h2>
                    <p class="text-gray-600 mt-2">Please provide your personal information to continue</p>
                    
                    <!-- 72-hour expiry notice -->
                    <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div class="flex items-center justify-center text-amber-700">
                            <i class="fas fa-clock mr-2"></i>
                            <p class="text-sm">⚠️ <strong>Time-sensitive:</strong> Your invitation expires after 72 hours. Complete your profile within this time to activate your account.</p>
                        </div>
                    </div>
                </div>

                <!-- Progress Indicator -->
                <div class="mb-8">
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>Progress</span>
                        <span>Step 2 of 3</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full" style="width: 66%"></div>
                    </div>
                </div>

                <!-- Profile Form -->
                <form id="profileForm" class="space-y-6">
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
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
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
                                    <!-- States will be populated by JavaScript -->
                                </select>
                                <i class="fas fa-map-marked-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                        <div>
                            <label for="country" class="block text-sm font-medium text-gray-700 mb-2">Country <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <select id="country" name="country" required
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white">
                                    <!-- Countries will be populated by JavaScript -->
                                </select>
                                <i class="fas fa-globe absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>

                        <div class="hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Enrollment Number</label>
                            <div class="relative">
                                <input type="text" id="enrollmentNumber" readonly
                                       class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                                       placeholder="Will be assigned after registration">
                                <i class="fas fa-id-card absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Error Message -->
                    <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        <span id="errorText"></span>
                    </div>

                    <!-- Success Message -->
                    <div id="successMessage" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span id="successText"></span>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button type="submit" id="saveProfileBtn"
                                class="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span id="saveProfileBtnText">Submit</span>
                            <i id="saveProfileBtnSpinner" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                        </button>
                        <button type="button" id="cancelBtn"
                                class="sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors">
                            Skip for Now
                        </button>
                    </div>
                </form>

                <!-- Info Section -->
                <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
                        <div class="text-sm text-blue-800">
                            <p class="font-medium mb-2">What happens next?</p>
                            <ul class="space-y-1 text-blue-700">
                                <li>• Your profile will be sent for admin approval</li>
                                <li>• You'll receive a unique user number once approved</li>
                                <li>• You can then access all membership features</li>
                                <li>• You can update your profile anytime after approval</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Completion Modal -->
    <div id="completionModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <i class="fas fa-check text-green-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Information Added!</h3>
                <div class="mt-2 px-7 py-3">
                    <p class="text-sm text-gray-500 mb-4">
                        Your personal information has been submitted. You'll be notified once your account is approved.
                    </p>
                    <button id="goToDashboard" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full">
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php renderPublicFooter(); ?>
    <script src="js/utils.js" type="module"></script>
    <script src="js/profile_completion.js" type="module"></script>
</body>
</html>
