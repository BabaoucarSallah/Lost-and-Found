/**
 * Utility Functions
 * Common utility functions used across the application
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 10000,
};

// Common API utility functions
const ApiUtils = {
  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  // Handle authentication errors
  handleAuthError(error) {
    if (error.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  },
};

// Loading utilities
const LoadingUtils = {
  show() {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.style.display = 'flex';
    }
  },

  hide() {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.style.display = 'none';
    }
  },

  showButton(buttonElement, text = 'Loading...') {
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }
  },

  hideButton(buttonElement, originalText) {
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.innerHTML = originalText;
    }
  },
};

// Notification utilities
const NotificationUtils = {
  show(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'notification';
      document.body.appendChild(notification);
    }

    // Set notification content and type
    const iconClass = this.getIconClass(type);
    notification.innerHTML = `
      <div class="notification-content notification-${type}">
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
      </div>
    `;

    // Show notification
    notification.style.display = 'block';
    notification.classList.add('show');

    // Auto-hide after duration
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.style.display = 'none';
      }, 300);
    }, duration);
  },

  getIconClass(type) {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      default:
        return 'fa-info-circle';
    }
  },

  showError(message, duration = 5000) {
    this.show(message, 'error', duration);
  },

  showSuccess(message, duration = 3000) {
    this.show(message, 'success', duration);
  },

  showWarning(message, duration = 4000) {
    this.show(message, 'warning', duration);
  },

  showInfo(message, duration = 3000) {
    this.show(message, 'info', duration);
  },
};

// Form validation utilities
const ValidationUtils = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
    return password.length >= 8 && passwordRegex.test(password);
  },

  validateRequired(value) {
    return value && value.trim().length > 0;
  },

  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  },

  clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  },

  clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach((element) => {
      element.textContent = '';
      element.style.display = 'none';
    });
  },
};

// Date utilities
const DateUtils = {
  formatDate(date) {
    return new Date(date).toLocaleDateString();
  },

  formatDateTime(date) {
    return new Date(date).toLocaleString();
  },

  formatForInput(date) {
    return new Date(date).toISOString().split('T')[0];
  },
};

// Storage utilities
const StorageUtils = {
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

// DOM utilities
const DOMUtils = {
  createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);

    if (classes.length > 0) {
      element.classList.add(...classes);
    }

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  },

  show(element) {
    if (element) {
      element.style.display = 'block';
    }
  },

  hide(element) {
    if (element) {
      element.style.display = 'none';
    }
  },

  toggle(element) {
    if (element) {
      element.style.display =
        element.style.display === 'none' ? 'block' : 'none';
    }
  },

  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  },

  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  },

  toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  },
};

// Export utilities for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_CONFIG,
    ApiUtils,
    LoadingUtils,
    NotificationUtils,
    ValidationUtils,
    DateUtils,
    StorageUtils,
    DOMUtils,
  };
}
