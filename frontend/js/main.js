// Helper function to determine correct paths based on current location
function getCorrectPath(targetFile) {
  const currentPath = window.location.pathname;

  // If we're in a pages subdirectory, go up one level
  if (currentPath.includes('/pages/')) {
    return `../${targetFile}`;
  }
  // If we're in the frontend directory
  else if (currentPath.includes('/frontend/')) {
    return targetFile;
  }
  // If we're in the root directory
  else if (currentPath === '/' || currentPath.includes('index.html')) {
    return `frontend/${targetFile}`;
  }
  // Default fallback
  return targetFile;
}

const image = document.getElementById('menu-link');

// Only add event listener if the element exists
if (image) {
  image.addEventListener('click', () => {
    let subMenu = document.getElementById('Sub-menu-wrap');

    if (subMenu) {
      subMenu.classList.toggle('open-menu');
    }
  });
}

async function handleLoginSuccess(data) {
  localStorage.setItem('token', data.token); // Store token
  window.location.href = getCorrectPath('index.html'); // Redirect
}

const logout = async (event) => {
  if (event) {
    event.preventDefault();
  }

  const token = localStorage.getItem('token'); // Get token before removing it

  // Clear localStorage first
  localStorage.removeItem('token'); // Clear token
  localStorage.removeItem('user'); // Clear user data

  try {
    // Call logout endpoint with the token
    if (token) {
      await fetch('http://localhost:5000/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }

  window.location.href = getCorrectPath('login.html');
};

document.querySelector('.logout-btn')?.addEventListener('click', logout);

// Check if user is admin and show admin link
async function checkAdminStatus() {
  const token = localStorage.getItem('token');
  const adminLinks = document.querySelectorAll('.admin-link');

  // Hide admin links by default
  adminLinks.forEach((link) => {
    link.classList.add('hidden');
  });

  if (!token) return;

  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const userData = await response.json();
      const user = userData.data.user;

      // Only show admin links for admin users
      if (user.role === 'admin') {
        adminLinks.forEach((link) => {
          link.classList.remove('hidden');
        });
      }
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    // Hide admin links on error
    adminLinks.forEach((link) => {
      link.classList.add('hidden');
    });
  }
}

// Call checkAdminStatus when page loads
document.addEventListener('DOMContentLoaded', () => {
  checkAdminStatus();
  loadUserInfo();
});

// Load user information and display it
async function loadUserInfo() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Hide admin links and redirect to login if no token
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach((link) => {
      link.classList.add('hidden');
    });

    window.location.href = getCorrectPath('login.html');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const userData = await response.json();
      const user = userData.data.user;

      // Update user info in the menu
      const userInfoName = document.getElementById('user-info-name');
      const userInfoEmail = document.getElementById('user-info-email');

      if (userInfoName) {
        userInfoName.textContent = user.username;
      }
      if (userInfoEmail) {
        userInfoEmail.textContent = user.email;
      }

      // Update welcome message
      const userName = document.querySelector('.user-name');
      if (userName) {
        userName.textContent = user.username;
      }

      // Update user profile box
      const profileBox = document.querySelector('.user-profile-box');
      if (profileBox) {
        profileBox.innerHTML = `
          <h3 class="section-heading">Your Info</h3>
          <p><strong>Full Name:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Contact:</strong> ${
            user.contact_info || 'Not provided'
          }</p>
          <p><strong>Role:</strong> ${user.role}</p>
        `;
      }

      // Handle admin links visibility
      const adminLinks = document.querySelectorAll('.admin-link');
      adminLinks.forEach((link) => {
        if (user.role === 'admin') {
          link.classList.remove('hidden');
        } else {
          link.classList.add('hidden');
        }
      });
    } else {
      // Token is invalid, hide admin links and redirect to login
      const adminLinks = document.querySelectorAll('.admin-link');
      adminLinks.forEach((link) => {
        link.classList.add('hidden');
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = getCorrectPath('login.html');
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    // On error, hide admin links and redirect to login
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach((link) => {
      link.classList.add('hidden');
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = getCorrectPath('login.html');
  }
}

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Fetch and display lost items
async function loadLostItems() {
  try {
    const response = await fetch(`${API_BASE_URL}/items?type=lost&limit=6`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const lostItems = data.data.items || [];

    displayItems(lostItems, 'lost-items-container', 'lost');
  } catch (error) {
    console.error('Error fetching lost items:', error);
    displayErrorMessage('lost-items-container', 'Failed to load lost items');
  }
}

// Fetch and display found items
async function loadFoundItems() {
  try {
    const response = await fetch(`${API_BASE_URL}/items?type=found&limit=6`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const foundItems = data.data.items || [];

    displayItems(foundItems, 'found-items-container', 'found');
  } catch (error) {
    console.error('Error fetching found items:', error);
    displayErrorMessage('found-items-container', 'Failed to load found items');
  }
}

// Display items in the specified container
function displayItems(items, containerId, type) {
  const container = document.getElementById(containerId);

  if (!container) {
    // Container doesn't exist - this is expected on some pages
    return;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="no-items-message">
        <p>No ${type} items found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((item) => createItemHTML(item, type))
    .join('');
}

// Create HTML for a single item
function createItemHTML(item, type) {
  const fallbackImageUrl = `${API_BASE_URL.replace(
    '/api/v1',
    ''
  )}/frontend/img/100x100.png`;
  const imageUrl = item.image_url
    ? `${API_BASE_URL.replace('/api/v1', '')}${item.image_url}`
    : fallbackImageUrl;
  const statusClass = type === 'lost' ? 'lost-btn' : 'found-btn';
  const statusText = type === 'lost' ? 'Lost' : 'Found';
  const dateText = type === 'lost' ? 'Lost on' : 'Found on';
  const categoryClass = getCategoryClass(item.category?.name || 'Other');

  return `
    <div class="grid-inner">
      <img src="${imageUrl}" alt="${
    item.title
  }" onerror="this.src='${fallbackImageUrl}'" />
      <h3>${item.title}</h3>
      <button class="${categoryClass}">${
    item.category?.name || 'Other'
  }</button>
      <p>${item.location}</p>
      <p>${dateText} ${formatDate(item.date_lost_or_found)}</p>
      <button class="${statusClass}">${statusText}</button><br /><br />
      <button class="owner-btn">
        <a href="#" onclick="contactOwner('${item._id}', '${
    item.reporter_id
  }')"> Contact Owner </a>
      </button>
    </div>
  `;
}

// Get CSS class for category button
function getCategoryClass(categoryName) {
  const categoryClasses = {
    Electronics: 'electronics-btn',
    Documents: 'documents-btn',
    Jewelry: 'jewelry-btn',
    Clothing: 'clothing-btn',
    Other: 'other-btn',
  };

  return categoryClasses[categoryName] || 'electronics-btn';
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Date not specified';

  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Display error message
function displayErrorMessage(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Handle contact owner functionality
async function contactOwner(itemId, reporterId) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please login to contact the owner');
    window.location.href = getCorrectPath('login.html');
    return;
  }

  try {
    // Here you can implement the contact functionality
    // For now, let's show an alert with the item information
    alert(`Contact functionality for item ${itemId} will be implemented here`);

    // You could redirect to a contact form or open a modal
    // window.location.href = `./frontend/contact.html?item=${itemId}`;
  } catch (error) {
    console.error('Error contacting owner:', error);
    alert('Failed to contact owner. Please try again.');
  }
}

// Load both lost and found items when page loads
async function loadAllItems() {
  // Only load items if the containers exist (i.e., on the main page)
  const lostContainer = document.getElementById('lost-items-container');
  const foundContainer = document.getElementById('found-items-container');

  if (lostContainer && foundContainer) {
    await Promise.all([loadLostItems(), loadFoundItems()]);
  }
}

// Search functionality
async function performSearch() {
  const keyword = document.getElementById('search-keyword').value.trim();
  const category = document.getElementById('search-categories').value;
  const location = document.getElementById('search-location').value.trim();
  const type = document.getElementById('search-type').value;

  // Build search query parameters
  const searchParams = new URLSearchParams();

  if (keyword) searchParams.append('keyword', keyword);
  if (category) searchParams.append('category', category);
  if (location) searchParams.append('location', location);
  if (type) searchParams.append('type', type);

  // Add limit for search results
  searchParams.append('limit', '12');

  try {
    const response = await fetch(
      `${API_BASE_URL}/items?${searchParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const searchResults = data.data.items || [];

    displaySearchResults(searchResults);
  } catch (error) {
    console.error('Error performing search:', error);
    displaySearchError(`Search failed: ${error.message}`);
  }
}

// Display search results
function displaySearchResults(items) {
  // Hide the regular sections
  const lostSection = document.querySelector('.recently-lost-items');
  const foundSection = document.querySelector(
    '.recently-lost-items:last-of-type'
  );

  if (lostSection) lostSection.style.display = 'none';
  if (foundSection) foundSection.style.display = 'none';

  // Create or update search results section
  let searchResultsSection = document.getElementById('search-results-section');

  if (!searchResultsSection) {
    searchResultsSection = document.createElement('section');
    searchResultsSection.id = 'search-results-section';
    searchResultsSection.className = 'recently-lost-items';

    // Insert after the search section
    const searchSection = document.querySelector('.search');
    searchSection.insertAdjacentElement('afterend', searchResultsSection);
  }

  const resultsHTML = `
    <h2>Search Results (${items.length} items found)</h2>
    <hr class="sea" />
    <br /><br />
    <div class="grid" id="search-results-container">
      ${
        items.length === 0
          ? '<div class="no-items-message"><p>No items found matching your search criteria.</p></div>'
          : items.map((item) => createItemHTML(item, item.type)).join('')
      }
    </div>
    <br />
    <button class="search-btn" onclick="clearSearch()">
      Clear Search
    </button>
  `;

  searchResultsSection.innerHTML = resultsHTML;
}

// Clear search and show original content
function clearSearch() {
  // Remove search results section
  const searchResultsSection = document.getElementById(
    'search-results-section'
  );
  if (searchResultsSection) {
    searchResultsSection.remove();
  }

  // Show original sections
  const lostSection = document.querySelector('.recently-lost-items');
  const foundSection = document.querySelector(
    '.recently-lost-items:last-of-type'
  );

  if (lostSection) lostSection.style.display = 'block';
  if (foundSection) foundSection.style.display = 'block';

  // Clear search form
  document.getElementById('search-keyword').value = '';
  document.getElementById('search-categories').value = '';
  document.getElementById('search-location').value = '';
  document.getElementById('search-type').value = '';
}

// Display search error
function displaySearchError(message) {
  alert(message);
}

// Load categories from backend
async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const categories = data.data.categories || [];

    // Update the search categories dropdown
    const searchCategoriesSelect = document.getElementById('search-categories');
    if (searchCategoriesSelect) {
      // Keep the "All Categories" option
      const allCategoriesOption =
        searchCategoriesSelect.querySelector('option[value=""]');
      searchCategoriesSelect.innerHTML = '';
      if (allCategoriesOption) {
        searchCategoriesSelect.appendChild(allCategoriesOption);
      }

      // Add categories from backend
      categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category._id; // Use category ID for backend compatibility
        option.textContent = category.name; // Display name for user
        searchCategoriesSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    // Keep default categories if API fails
  }
}

// Update the DOMContentLoaded event listener to include categories loading
document.addEventListener('DOMContentLoaded', () => {
  checkAdminStatus();
  loadUserInfo();
  loadAllItems();
  loadCategories();

  // Add event listeners for Enter key on search inputs
  const searchInputs = ['search-keyword', 'search-location'];
  searchInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }
  });
});
