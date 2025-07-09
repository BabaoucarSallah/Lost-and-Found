document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Error elements
  const emailError = emailInput.nextElementSibling;
  const passwordError = document.getElementById('password-error');
  const passwordStrength = document.getElementById('password-strength');
  const strengthBar = passwordStrength.querySelector('.strength-bar');
  const strengthText = passwordStrength.querySelector('.strength-text');
  const requirements = passwordStrength.querySelectorAll('.requirements li');

  // Create strength bar fill element
  const strengthBarFill = document.createElement('div');
  strengthBarFill.className = 'strength-bar-fill';
  strengthBar.appendChild(strengthBarFill);

  // Validation patterns
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasUpperCase = /[A-Z]/;
  const hasNumber = /\d/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

  // Validate on form submission & redirect
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const emailValid = validateEmail();
    const passwordValid = validatePassword();

    if (!emailValid || !passwordValid) {
      isValid = false;
    }

    if (isValid) {
      try {
        const formData = new FormData(loginForm);
        const response = await fetch(
          'http://127.0.0.1:5000/api/v1/auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData)),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          showServerError(data.message || 'Login failed. Please try again.');
        } else {
          // Store the token in localStorage
          localStorage.setItem('jwt', data.token);

          // Redirect to index.html
          window.location.href = data.redirectUrl || 'index.html';
        }
      } catch (error) {
        showServerError('Network error. Please try again.');
      }
    }
  });

  // Real-time validation
  emailInput.addEventListener('input', validateEmail);
  passwordInput.addEventListener('input', validatePassword);

  function validateEmail() {
    const email = emailInput.value.trim();
    if (!email) {
      showError(emailInput, emailError, 'Email is required');
      return false;
    } else if (!emailPattern.test(email)) {
      showError(emailInput, emailError, 'Please enter a valid email');
      return false;
    } else {
      clearError(emailInput, emailError);
      return true;
    }
  }

  function validatePassword() {
    const password = passwordInput.value;
    let isValid = true;
    let strength = 0;

    // Check requirements
    const hasUpper = hasUpperCase.test(password);
    const hasNum = hasNumber.test(password);
    const hasSpecial = hasSpecialChar.test(password);
    const hasMinLength = password.length >= 8;

    // Update requirement indicators
    requirements[0].classList.toggle('valid', hasUpper);
    requirements[1].classList.toggle('valid', hasNum);
    requirements[2].classList.toggle('valid', hasSpecial);
    requirements[3].classList.toggle('valid', hasMinLength);

    // Calculate strength
    if (hasUpper) strength += 25;
    if (hasNum) strength += 25;
    if (hasSpecial) strength += 25;
    if (hasMinLength) strength += 25;

    // Update strength meter
    strengthBarFill.style.width = `${strength}%`;

    if (strength < 50) {
      strengthBarFill.style.backgroundColor = '#ff5252';
      strengthText.textContent = 'Weak Password';
    } else if (strength < 75) {
      strengthBarFill.style.backgroundColor = '#ffb74d';
      strengthText.textContent = 'Moderate Password';
    } else {
      strengthBarFill.style.backgroundColor = '#4CAF50';
      strengthText.textContent = 'Strong Password';
    }

    // Validate
    if (!password) {
      showError(passwordInput, passwordError, 'Password is required');
      isValid = false;
    } else if (!hasMinLength) {
      showError(
        passwordInput,
        passwordError,
        'Password must be at least 8 characters'
      );
      isValid = false;
    } else if (!hasUpper || !hasNum || !hasSpecial) {
      showError(
        passwordInput,
        passwordError,
        'Password must include uppercase, number, and special character'
      );
      isValid = false;
    } else {
      clearError(passwordInput, passwordError);
    }

    return isValid;
  }

  function showError(input, errorElement, message) {
    input.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }

  function clearError(input, errorElement) {
    input.classList.remove('invalid');
    input.setAttribute('aria-invalid', 'false');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }

  function showServerError(message) {
    // Remove existing messages
    const existing = document.querySelector('.server-error');
    if (existing) existing.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'server-error';
    errorDiv.textContent = message;
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
  }

  function showServerSuccess(message) {
    // Remove existing messages
    const existing = document.querySelector('.server-success');
    if (existing) existing.remove();

    const successDiv = document.createElement('div');
    successDiv.className = 'server-success';
    successDiv.textContent = message;
    loginForm.insertBefore(successDiv, loginForm.firstChild);
  }
});
