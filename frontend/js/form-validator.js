document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const registrationForm = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const telephoneInput = document.getElementById('telephone');
  const termsCheckbox = document.getElementById('terms');
  const submitButton = document.querySelector('.submit-button');
  const successMessage = document.getElementById('successMessage');
  const summaryDetails = successMessage.querySelector('.summary-details');
  const closeSuccessButton = document.getElementById('closeSuccess');

  // Password strength elements
  const strengthBar = document.querySelector('.strength-bar-fill');
  const strengthText = document.querySelector('.strength-text');
  const requirements = document.querySelectorAll('.requirements li');

  // Form state
  const formState = {
    fullName: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
    telephone: { isValid: false, message: '' },
    terms: { isValid: false, message: '' },
  };

  // Utility Functions
  const showError = (inputElement, message) => {
    const formGroup = inputElement.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');

    inputElement.classList.add('invalid');
    errorElement.textContent = message;
    errorElement.classList.add('show');
  };

  const hideError = (inputElement) => {
    const formGroup = inputElement.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');

    inputElement.classList.remove('invalid');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  };

  const updateSubmitButton = () => {
    const isFormValid = Object.values(formState).every(
      (field) => field.isValid
    );
    submitButton.disabled = !isFormValid;
  };

  const showServerError = (message) => {
    const existingError = document.querySelector('.server-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'server-error';
    errorDiv.innerHTML = `
    <div class="error-content">
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    </div>
  `;

    registrationForm.prepend(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  };

  // Validation Functions
  const validateFullName = () => {
    const value = fullNameInput.value.trim();
    const isValid = value.length >= 2 && value.length <= 50;

    formState.fullName.isValid = isValid;

    if (!isValid) {
      if (value.length === 0) {
        formState.fullName.message = 'Full name is required';
      } else if (value.length < 2) {
        formState.fullName.message =
          'Full name must be at least 2 characters long';
      } else if (value.length > 50) {
        formState.fullName.message = 'Full name cannot exceed 50 characters';
      }
      showError(fullNameInput, formState.fullName.message);
    } else {
      formState.fullName.message = '';
      hideError(fullNameInput);
    }
    return formState.fullName.isValid;
  };

  const validateEmail = () => {
    const value = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    formState.email.isValid = emailRegex.test(value);
    formState.email.message = formState.email.isValid
      ? ''
      : value.length === 0
      ? 'Email is required'
      : 'Please enter a valid email';

    if (!formState.email.isValid) {
      showError(emailInput, formState.email.message);
    } else {
      hideError(emailInput);
    }
    return formState.email.isValid;
  };

  const validatePassword = () => {
    const value = passwordInput.value;
    const hasMinLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*]/.test(value);

    // Update password strength meter
    updatePasswordStrength(
      value,
      hasMinLength,
      hasUpper,
      hasNumber,
      hasSpecial
    );

    formState.password.isValid =
      hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

    if (!formState.password.isValid) {
      const missing = [];
      if (!hasMinLength) missing.push('8 characters minimum');
      if (!hasUpper) missing.push('one uppercase letter');
      if (!hasLower) missing.push('one lowercase letter');
      if (!hasNumber) missing.push('one number');
      if (!hasSpecial) missing.push('one special character');

      formState.password.message =
        value.length === 0
          ? 'Password is required'
          : `Password must contain: ${missing.join(', ')}`;

      showError(passwordInput, formState.password.message);
    } else {
      hideError(passwordInput);
      formState.password.message = '';
    }
    return formState.password.isValid;
  };

  // Password strength meter function
  const updatePasswordStrength = (
    password,
    hasMinLength,
    hasUpper,
    hasNumber,
    hasSpecial
  ) => {
    // Clear previous strength styling
    strengthBar.className = 'strength-bar-fill';

    if (password.length === 0) {
      strengthBar.style.width = '0%';
      strengthText.textContent = '';
      requirements.forEach((req) => req.classList.remove('valid'));
      return;
    }

    // Calculate strength score
    let strength = 0;
    let strengthLabel = '';
    let strengthClass = '';

    // Check requirements and update UI
    const checks = [
      { condition: hasUpper, element: requirements[0] },
      { condition: hasNumber, element: requirements[1] },
      { condition: hasSpecial, element: requirements[2] },
      { condition: hasMinLength, element: requirements[3] },
    ];

    checks.forEach((check) => {
      if (check.condition) {
        strength++;
        check.element.classList.add('valid');
      } else {
        check.element.classList.remove('valid');
      }
    });

    // Update strength indicator based on score
    switch (strength) {
      case 0:
      case 1:
        strengthLabel = 'Weak';
        strengthClass = 'weak';
        break;
      case 2:
        strengthLabel = 'Fair';
        strengthClass = 'fair';
        break;
      case 3:
        strengthLabel = 'Good';
        strengthClass = 'good';
        break;
      case 4:
        strengthLabel = 'Strong';
        strengthClass = 'strong';
        break;
    }

    // Update strength bar
    const widthPercentage = (strength / 4) * 100;
    strengthBar.style.width = `${widthPercentage}%`;
    strengthBar.classList.add(strengthClass);
    strengthText.textContent = strengthLabel;
  };

  const validateConfirmPassword = () => {
    const value = confirmPasswordInput.value;
    const passwordValue = passwordInput.value;

    formState.confirmPassword.isValid = value === passwordValue;
    formState.confirmPassword.message = formState.confirmPassword.isValid
      ? ''
      : value.length === 0
      ? 'Please confirm your password'
      : 'Passwords do not match';

    if (!formState.confirmPassword.isValid) {
      showError(confirmPasswordInput, formState.confirmPassword.message);
    } else {
      hideError(confirmPasswordInput);
    }
    return formState.confirmPassword.isValid;
  };

  const validateTelephone = () => {
    const value = telephoneInput.value.trim();

    // Allow empty phone (not required)
    if (value.length === 0) {
      formState.telephone.isValid = true;
      formState.telephone.message = '';
      hideError(telephoneInput);
      return true;
    }

    // Phone validation: numbers, spaces, dashes, parentheses, plus signs
    const telRegex = /^[\d\s\-()+]+$/;
    formState.telephone.isValid = telRegex.test(value) && value.length >= 7;

    if (!formState.telephone.isValid) {
      formState.telephone.message =
        'Please enter a valid phone number (minimum 7 digits)';
      showError(telephoneInput, formState.telephone.message);
    } else {
      formState.telephone.message = '';
      hideError(telephoneInput);
    }
    return formState.telephone.isValid;
  };

  const validateTerms = () => {
    formState.terms.isValid = termsCheckbox.checked;
    formState.terms.message = formState.terms.isValid
      ? ''
      : 'You must accept the terms';

    if (!formState.terms.isValid) {
      showError(termsCheckbox, formState.terms.message);
    } else {
      hideError(termsCheckbox);
    }
    return formState.terms.isValid;
  };

  // Event Listeners
  const setupEventListeners = () => {
    fullNameInput.addEventListener('input', () => {
      validateFullName();
      updateSubmitButton();
    });

    emailInput.addEventListener('input', () => {
      validateEmail();
      updateSubmitButton();
    });

    passwordInput.addEventListener('input', () => {
      validatePassword();
      validateConfirmPassword(); // Revalidate confirm when password changes
      updateSubmitButton();
    });

    confirmPasswordInput.addEventListener('input', () => {
      validateConfirmPassword();
      updateSubmitButton();
    });

    telephoneInput.addEventListener('input', () => {
      validateTelephone();
      updateSubmitButton();
    });

    termsCheckbox.addEventListener('change', () => {
      validateTerms();
      updateSubmitButton();
    });

    registrationForm.addEventListener('submit', handleFormSubmit);
    closeSuccessButton.addEventListener('click', () => {
      successMessage.classList.add('hidden');
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500); // 0.5 second delay for smooth transition
    });
  };

  // Initialize password strength meter
  const initializePasswordStrength = () => {
    if (strengthBar && strengthText && requirements.length > 0) {
      strengthBar.style.width = '0%';
      strengthText.textContent = '';
      requirements.forEach((req) => req.classList.remove('valid'));
    }
  };

  // Initialize the form
  initializePasswordStrength();

  // Form Submission Handler
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    // Validate all fields
    const isFormValid =
      validateFullName() &&
      validateEmail() &&
      validatePassword() &&
      validateConfirmPassword() &&
      validateTelephone() &&
      validateTerms();

    if (!isFormValid) {
      showServerError('Please fix all errors before submitting');
      return;
    }

    try {
      const formData = {
        username: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        contact_info: telephoneInput.value.trim(),
      };

      console.log('Submitting:', formData); // Before fetch
      const response = await fetch(
        'http://localhost:5000/api/v1/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      console.log('Response status:', response.status); // After fetch
      const data = await response.json();
      console.log('Response data:', data); // After parsing

      if (!response.ok) {
        // Handle known error formats
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.message) {
          throw new Error(data.message);
        }
        throw new Error('Registration failed');
      }

      // Updated success message handling
      if (data.data && data.data.user) {
        const user = data.data.user;
        summaryDetails.innerHTML = `
            <p><strong>Full Name:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Telephone:</strong> ${user.contact_info.telephone}</p>
        `;
        registrationForm.classList.add('hidden');
        successMessage.classList.remove('hidden');
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showServerError(error.message);
    }
  };

  // Reset Form
  const resetForm = () => {
    successMessage.classList.add('hidden');
    registrationForm.classList.remove('hidden');
    registrationForm.reset();

    // Reset form state
    Object.keys(formState).forEach((key) => {
      formState[key].isValid = false;
      formState[key].message = '';
    });

    updateSubmitButton();
  };

  // Initialize
  const init = () => {
    setupEventListeners();
    updateSubmitButton(); // Disable button initially
  };

  init();
});
