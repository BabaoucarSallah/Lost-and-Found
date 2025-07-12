// My Listings page functionality
document.addEventListener('DOMContentLoaded', () => {
  loadMyListings();
  setupTabs();
});

// Tab switching functionality
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Remove active class and update ARIA attributes for all tabs
      tabButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach((content) => content.classList.remove('active'));

      // Add active class and update ARIA attributes for clicked tab
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Load user's listings
async function loadMyListings() {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '../login.html';
    return;
  }

  try {
    // Fetch user's lost items
    const lostResponse = await fetch(
      'http://localhost:5000/api/v1/items?type=lost&my=true',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Fetch user's found items
    const foundResponse = await fetch(
      'http://localhost:5000/api/v1/items?type=found&my=true',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (lostResponse.ok && foundResponse.ok) {
      const lostData = await lostResponse.json();
      const foundData = await foundResponse.json();

      displayLostItems(lostData.data?.items || []);
      displayFoundItems(foundData.data?.items || []);
    } else {
      console.error('Error fetching listings');
      showError('Failed to load your listings');
    }
  } catch (error) {
    console.error('Error loading listings:', error);
    showError('Failed to load your listings');
  }
}

// Display lost items
function displayLostItems(items) {
  const container = document.getElementById('lost-items-grid');

  if (items.length === 0) {
    container.innerHTML =
      '<div class="no-items">You haven\'t posted any lost items yet.</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => createItemCard(item, 'lost'))
    .join('');
}

// Display found items
function displayFoundItems(items) {
  const container = document.getElementById('found-items-grid');

  if (items.length === 0) {
    container.innerHTML =
      '<div class="no-items">You haven\'t posted any found items yet.</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => createItemCard(item, 'found'))
    .join('');
}

// Create item card HTML
function createItemCard(item, type) {
  const fallbackImageUrl = 'http://localhost:5000/frontend/img/100x100.png';
  const imageUrl = item.image_url
    ? `http://localhost:5000/${item.image_url}`
    : fallbackImageUrl;
  const statusClass = type === 'lost' ? 'lost-btn' : 'found-btn';
  const statusText = type === 'lost' ? 'Lost' : 'Found';
  const dateField = type === 'lost' ? 'date_lost' : 'date_found';

  return `
        <article class="item-card" data-item-id="${item._id}" role="article">
            <div class="item-image">
                <img src="${imageUrl}" alt="${
    item.name
  }" onerror="this.src='${fallbackImageUrl}'" loading="lazy">
            </div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="item-description">${
                  item.description || 'No description available'
                }</p>
                <div class="item-meta">
                    <p class="item-location">
                        <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                        <span>${
                          item.location || 'Location not specified'
                        }</span>
                    </p>
                    <p class="item-date">
                        <i class="fa-solid fa-calendar" aria-hidden="true"></i>
                        <span>${statusText} on ${new Date(
    item[dateField] || item.date_lost_or_found
  ).toLocaleDateString()}</span>
                    </p>
                </div>
                <div class="item-category">
                    <span class="category-tag">${
                      item.category?.name || 'Uncategorized'
                    }</span>
                </div>
                <div class="item-status">
                    <span class="${statusClass}">${statusText}</span>
                    <span class="status-badge ${item.status}">${
    item.status
  }</span>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editItem('${
                      item._id
                    }')" aria-label="Edit ${item.name}">
                        <i class="fa-solid fa-edit" aria-hidden="true"></i>
                        <span>Edit</span>
                    </button>
                    <button class="delete-btn" onclick="deleteItem('${
                      item._id
                    }')" aria-label="Delete ${item.name}">
                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                        <span>Delete</span>
                    </button>
                    <button class="view-claims-btn" onclick="viewClaims('${
                      item._id
                    }')" aria-label="View claims for ${item.name}">
                        <i class="fa-solid fa-eye" aria-hidden="true"></i>
                        <span>Claims</span>
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Edit item function
function editItem(itemId) {
  // Redirect to edit page or show edit modal
  console.log('Edit item:', itemId);
  // You can implement edit functionality here
}

// Delete item function
async function deleteItem(itemId) {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/items/${itemId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      // Remove the item from the display
      const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
      if (itemCard) {
        itemCard.remove();
      }
      showSuccess('Item deleted successfully');
    } else {
      showError('Failed to delete item');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    showError('Failed to delete item');
  }
}

// View claims function
function viewClaims(itemId) {
  // Redirect to claims page or show claims modal
  console.log('View claims for item:', itemId);
  // You can implement claims viewing functionality here
}

// Show success message
function showSuccess(message) {
  // You can implement a toast notification system here
  alert(message);
}

// Show error message
function showError(message) {
  // You can implement a toast notification system here
  alert(message);
}
