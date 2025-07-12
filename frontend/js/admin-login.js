/**
 * Admin Login Handler
 * Handles authentication and form validation for admin login
 */

class AdminLogin {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    this.init();
  }

  init() {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      this.checkTokenAndRedirect(token);
    }

    // Setup form submission
    document
      .getElementById('admin-login-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
  }

  async checkTokenAndRedirect(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.data.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        }
      }
    } catch (error) {
      console.error('Token check failed:', error);
      localStorage.removeItem('token');
    }
  }

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Clear previous errors
    this.clearErrors();

    // Basic validation
    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showFieldError('email', 'Please enter a valid email address');
      return;
    }

    try {
      this.showLoading();

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user is admin
        if (data.data.user.role !== 'admin') {
          this.showError('Access denied. Admin privileges required.');
          return;
        }

        // Store token and redirect
        localStorage.setItem('token', data.token);
        this.showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 1500);
      } else {
        this.showError(
          data.message || 'Login failed. Please check your credentials.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError(
        'Network error. Please check your connection and try again.'
      );
    } finally {
      this.hideLoading();
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.querySelector('.submit-button').disabled = true;
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.querySelector('.submit-button').disabled = false;
  }

  clearErrors() {
    const errorContainer = document.getElementById(
      'admin-login-error-container'
    );
    const fieldErrors = document.querySelectorAll('.error-message');

    errorContainer.innerHTML = '';
    errorContainer.classList.add('hidden');

    fieldErrors.forEach((error) => {
      error.textContent = '';
    });
  }

  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  showError(message) {
    const errorContainer = document.getElementById(
      'admin-login-error-container'
    );
    errorContainer.innerHTML = `
      <div class="error-alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
      </div>
    `;
    errorContainer.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorContainer.classList.add('hidden');
    }, 5000);
  }

  showSuccess(message) {
    const errorContainer = document.getElementById(
      'admin-login-error-container'
    );
    errorContainer.innerHTML = `
      <div class="success-alert">
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;
    errorContainer.classList.remove('hidden');
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new AdminLogin();
});
