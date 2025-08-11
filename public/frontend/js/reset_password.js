// Reset Password functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Invalid or missing reset token. Please request a new password reset.');
        document.getElementById('resetPasswordForm').style.display = 'none';
        return;
    }
    
    // Set token in hidden field
    document.getElementById('resetToken').value = token;
    
    // Initialize event listeners
    initializeEventListeners();
    
    function initializeEventListeners() {
        const resetPasswordForm = document.getElementById('resetPasswordForm');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
        const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
        
        // Toggle password visibility
        toggleNewPasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility('newPassword', this);
        });
        
        toggleConfirmPasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility('confirmPassword', this);
        });
        
        // Password confirmation validation
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch();
        });
        
        newPasswordInput.addEventListener('input', function() {
            if (confirmPasswordInput.value) {
                validatePasswordMatch();
            }
        });
        
        // Form submission
        resetPasswordForm.addEventListener('submit', handlePasswordReset);
    }
    
    function togglePasswordVisibility(inputId, button) {
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    
    function validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const indicator = document.getElementById('passwordMatchIndicator');
        const icon = document.getElementById('matchIcon');
        const text = document.getElementById('matchText');
        
        if (confirmPassword.length === 0) {
            indicator.classList.add('hidden');
            return false;
        }
        
        if (newPassword === confirmPassword) {
            indicator.classList.remove('hidden');
            icon.classList.remove('fa-times', 'text-red-500');
            icon.classList.add('fa-check', 'text-green-500');
            text.textContent = 'Passwords match';
            text.classList.remove('text-red-600');
            text.classList.add('text-green-600');
            return true;
        } else {
            indicator.classList.remove('hidden');
            icon.classList.remove('fa-check', 'text-green-500');
            icon.classList.add('fa-times', 'text-red-500');
            text.textContent = 'Passwords do not match';
            text.classList.remove('text-green-600');
            text.classList.add('text-red-600');
            return false;
        }
    }
    
    async function handlePasswordReset(e) {
        e.preventDefault();
        
        const token = document.getElementById('resetToken').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate inputs
        if (!newPassword || newPassword.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        hideError();
        hideSuccess();
        
        try {
            const response = await fetch('../backend/reset_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccess(data.message || 'Password reset successfully!');
                
                // Redirect to login after success
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                showError(data.error || 'Failed to reset password. Please try again.');
            }
            
        } catch (error) {
            console.error('Password reset error:', error);
            showError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    }
    
    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    function hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }
    
    function showSuccess(message) {
        const successElement = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        successText.textContent = message;
        successElement.classList.remove('hidden');
    }
    
    function hideSuccess() {
        document.getElementById('successMessage').classList.add('hidden');
    }
    
    function setLoading(loading) {
        const resetBtn = document.getElementById('resetBtn');
        const resetBtnText = document.getElementById('resetBtnText');
        const resetBtnSpinner = document.getElementById('resetBtnSpinner');
        
        if (loading) {
            resetBtn.disabled = true;
            resetBtnText.textContent = 'Resetting...';
            resetBtnSpinner.classList.remove('hidden');
        } else {
            resetBtn.disabled = false;
            resetBtnText.textContent = 'Reset Password';
            resetBtnSpinner.classList.add('hidden');
        }
    }
});
