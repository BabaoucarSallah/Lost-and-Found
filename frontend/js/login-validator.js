document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Error elements
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const errorContainer = document.getElementById('login-error-container');
  const loadingOverlay = document.getElementById('loading');
  const submitButton = document.querySelector('.submit-button');

  // Validation patterns
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Initialize page - ensure all error containers are hidden
  function initializePage() {
    // Clear all error containers
    clearAllErrors();

    // Ensure error container is hidden with proper class
    errorContainer.classList.add('hidden');
    errorContainer.innerHTML = '';

    // Clear all field errors
    if (emailError) {
      emailError.textContent = '';
      emailError.style.display = 'none';
    }
    if (passwordError) {
      passwordError.textContent = '';
      passwordError.style.display = 'none';
    }
  }

  // Initialize page on load
  initializePage();

  // Form submission handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });

  // Real-time validation
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);

  function validateEmail() {
    const email = emailInput.value.trim();
    let isValid = true;

    clearFieldError('email');

    if (!email) {
      showFieldError('email', 'Email is required');
      isValid = false;
    } else if (!emailPattern.test(email)) {
      showFieldError('email', 'Please enter a valid email address');
      isValid = false;
    }

    return isValid;
  }

  function validatePassword() {
    const password = passwordInput.value;
    let isValid = true;

    clearFieldError('password');

    if (!password) {
      showFieldError('password', 'Password is required');
      isValid = false;
    } else if (password.length < 8) {
      showFieldError('password', 'Password must be at least 8 characters long');
      isValid = false;
    }

    return isValid;
  }

  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    clearAllErrors();

    // Validate form
    const emailValid = validateEmail();
    const passwordValid = validatePassword();

    if (!emailValid || !passwordValid) {
      return;
    }

    try {
      showLoading();

      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Show success message
        showSuccess('Login successful! Redirecting...');

        // Redirect based on role
        setTimeout(() => {
          if (data.data.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 1500);
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          showError('Invalid email or password. Please try again.');
        } else if (response.status === 429) {
          showError('Too many login attempts. Please try again later.');
        } else {
          showError(data.message || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Network error. Please check your connection and try again.');
    } finally {
      hideLoading();
    }
  }

  function showLoading() {
    loadingOverlay.style.display = 'flex';
    submitButton.disabled = true;
  }

  function hideLoading() {
    loadingOverlay.style.display = 'none';
    submitButton.disabled = false;
  }

  function clearAllErrors() {
    clearFieldError('email');
    clearFieldError('password');
    errorContainer.innerHTML = '';
    errorContainer.classList.add('hidden');

    // Clear any pending timeout
    if (window.errorTimeout) {
      clearTimeout(window.errorTimeout);
    }
  }

  function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  function showError(message) {
    console.log('showError called with:', message); // Debug log
    errorContainer.innerHTML = `
      <div class="error-alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
      </div>
    `;
    errorContainer.classList.remove('hidden');

    // Clear any existing timeout
    if (window.errorTimeout) {
      clearTimeout(window.errorTimeout);
    }

    // Auto-hide after 5 seconds
    window.errorTimeout = setTimeout(() => {
      console.log('Auto-hiding error container'); // Debug log
      errorContainer.classList.add('hidden');
    }, 5000);
  }

  function showSuccess(message) {
    errorContainer.innerHTML = `
      <div class="success-alert">
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;
    errorContainer.classList.remove('hidden');

    // Clear any existing timeout
    if (window.errorTimeout) {
      clearTimeout(window.errorTimeout);
    }

    // Note: Success messages don't auto-hide since they're usually followed by redirect
  }

  // Check if user is already logged in
  const token = localStorage.getItem('token');
  if (token) {
    // Optionally verify token and redirect
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'index.html';
    }
  }
});
