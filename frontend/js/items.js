// Items page functionality
document.addEventListener('DOMContentLoaded', () => {
  initializeItemsPage();
});

// Global variables
let currentPage = 1;
let currentFilters = {
  search: '',
  type: '',
  category: '',
  location: '',
  dateFrom: '',
  dateTo: '',
  sort: '-createdAt',
};
let totalPages = 1;
let isLoading = false;

// Initialize the items page
function initializeItemsPage() {
  setupEventListeners();
  loadItems();
  loadCategories();
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  // Filter toggle
  const filterToggle = document.getElementById('filter-toggle');
  const filterPanel = document.getElementById('filter-panel');

  filterToggle.addEventListener('click', () => {
    const isActive = filterPanel.classList.contains('active');
    filterPanel.classList.toggle('active');
    filterToggle.classList.toggle('active');
    filterToggle.setAttribute('aria-expanded', !isActive);
  });

  // Close filter panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterToggle.contains(e.target) && !filterPanel.contains(e.target)) {
      filterPanel.classList.remove('active');
      filterToggle.classList.remove('active');
      filterToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Filter controls
  document
    .getElementById('apply-filters')
    .addEventListener('click', applyFilters);
  document
    .getElementById('clear-filters')
    .addEventListener('click', clearFilters);

  // Sort functionality
  document.getElementById('sort-select').addEventListener('change', handleSort);

  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadItems();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadItems();
    }
  });

  // Modal functionality
  const modal = document.getElementById('item-modal');
  const modalClose = document.getElementById('modal-close');

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Handle search
function handleSearch() {
  const searchInput = document.getElementById('search-input');
  currentFilters.search = searchInput.value.trim();
  currentPage = 1;
  loadItems();
}

// Apply filters
function applyFilters() {
  currentFilters.type = document.getElementById('type-filter').value;
  currentFilters.category = document.getElementById('category-filter').value;
  currentFilters.location = document.getElementById('location-filter').value;
  currentFilters.dateFrom = document.getElementById('date-from').value;
  currentFilters.dateTo = document.getElementById('date-to').value;

  currentPage = 1;
  loadItems();

  // Close filter panel
  document.getElementById('filter-panel').classList.remove('active');
  document.getElementById('filter-toggle').classList.remove('active');
}

// Clear filters
function clearFilters() {
  // Reset filter inputs
  document.getElementById('type-filter').value = '';
  document.getElementById('category-filter').value = '';
  document.getElementById('location-filter').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';

  // Reset current filters
  currentFilters = {
    search: currentFilters.search, // Keep search term
    type: '',
    category: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    sort: currentFilters.sort, // Keep sort option
  };

  currentPage = 1;
  loadItems();
}

// Handle sort
function handleSort() {
  const sortSelect = document.getElementById('sort-select');
  currentFilters.sort = sortSelect.value;
  currentPage = 1;
  loadItems();
}

// Load items from API
async function loadItems() {
  if (isLoading) return;

  isLoading = true;
  const itemsGrid = document.getElementById('items-grid');

  // Show loading state
  showLoading();

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: 12,
      sort: currentFilters.sort,
    });

    // Add filters to params
    if (currentFilters.search) params.append('keyword', currentFilters.search);
    if (currentFilters.type) params.append('type', currentFilters.type);
    if (currentFilters.category)
      params.append('category', currentFilters.category);
    if (currentFilters.location)
      params.append('location', currentFilters.location);
    if (currentFilters.dateFrom)
      params.append('date_lost_or_found_gte', currentFilters.dateFrom);
    if (currentFilters.dateTo)
      params.append('date_lost_or_found_lte', currentFilters.dateTo);

    const response = await fetch(
      `http://localhost:5000/api/v1/items?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to load items');
    }

    const data = await response.json();

    if (data.status === 'success') {
      displayItems(data.data.items);
      updatePagination(data.page, data.totalPages, data.totalItems);
      updateResultsCount(data.totalItems);
    } else {
      showError('Failed to load items');
    }
  } catch (error) {
    console.error('Error loading items:', error);
    showError('Error loading items. Please try again.');
  } finally {
    isLoading = false;
  }
}

// Display items in the grid
function displayItems(items) {
  const itemsGrid = document.getElementById('items-grid');

  if (items.length === 0) {
    itemsGrid.innerHTML = `
            <div class="no-results">
                <h3>No items found</h3>
                <p>Try adjusting your search criteria or filters</p>
            </div>
        `;
    return;
  }

  itemsGrid.innerHTML = items.map((item) => createItemCard(item)).join('');

  // Add click event listeners to item cards
  itemsGrid.querySelectorAll('.item-card').forEach((card) => {
    card.addEventListener('click', () => {
      const itemId = card.dataset.itemId;
      openItemModal(itemId);
    });
  });
}

// Create item card HTML
function createItemCard(item) {
  const fallbackImageUrl = 'http://localhost:5000/frontend/img/100x100.png';
  const imageUrl = item.image_url
    ? `http://localhost:5000${item.image_url}`
    : fallbackImageUrl;
  const typeBadgeClass = item.type === 'lost' ? 'lost' : 'found';
  const dateField = item.type === 'lost' ? 'date_lost' : 'date_found';

  return `
        <article class="item-card" data-item-id="${
          item._id
        }" role="button" tabindex=
        "0">
            <span class="item-type-badge ${typeBadgeClass}">
                ${item.type === 'lost' ? 'Lost' : 'Found'}
            </span>
            
            <div class="item-image">
                <img src="${imageUrl}" alt="${
    item.title
  }" loading="lazy" onerror="this.src='${fallbackImageUrl}'">
            </div>
            
            <div class="item-details">
                <h3>${item.title}</h3>
                <p class="item-description">${
                  item.description || 'No description available'
                }</p>
                
                <div class="item-meta">
                    <div class="item-location">
                        <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                        <span>${
                          item.location || 'Location not specified'
                        }</span>
                    </div>
                    <div class="item-date">
                        <i class="fa-solid fa-calendar" aria-hidden="true"></i>
                        <span>${
                          item.type === 'lost' ? 'Lost' : 'Found'
                        } on ${new Date(
    item[dateField] || item.date_lost_or_found
  ).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="item-footer">
                <span class="category-tag">${
                  item.category?.name || 'Uncategorized'
                }</span>
                <button class="contact-btn" onclick="event.stopPropagation(); contactOwner('${
                  item._id
                }')">
                    Contact Owner
                </button>
            </div>
        </article>
    `;
}

// Load categories from API
async function loadCategories() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/categories');
    if (response.ok) {
      const data = await response.json();
      const categorySelect = document.getElementById('category-filter');

      // Clear existing options except the first one
      categorySelect.innerHTML = '<option value="">All Categories</option>';

      // Add categories
      data.data.categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Show loading state
function showLoading() {
  const itemsGrid = document.getElementById('items-grid');
  itemsGrid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading items...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
  const itemsGrid = document.getElementById('items-grid');
  itemsGrid.innerHTML = `
        <div class="no-results">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Update pagination
function updatePagination(page, totalPagesCount, totalItems) {
  currentPage = page;
  totalPages = totalPagesCount;

  const paginationDiv = document.getElementById('pagination');
  const paginationInfo = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  if (totalPages <= 1) {
    paginationDiv.classList.add('hidden');
    return;
  }

  paginationDiv.classList.remove('hidden');
  paginationInfo.textContent = `Page ${page} of ${totalPages}`;

  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
}

// Update results count
function updateResultsCount(totalItems) {
  const resultsCount = document.getElementById('results-count');
  resultsCount.textContent = `${totalItems} items found`;
}

// Open item modal
async function openItemModal(itemId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/items/${itemId}`
    );
    if (response.ok) {
      const data = await response.json();
      const item = data.data.item;

      displayItemModal(item);
      document.getElementById('item-modal').classList.add('active');
      document.body.classList.add('modal-open');
      document.body.classList.remove('modal-closed');
    }
  } catch (error) {
    console.error('Error loading item details:', error);
  }
}

// Display item in modal
function displayItemModal(item) {
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  modalTitle.textContent = item.title;

  const fallbackImageUrl = 'http://localhost:5000/frontend/img/100x100.png';
  const imageUrl = item.image_url
    ? `http://localhost:5000${item.image_url}`
    : fallbackImageUrl;
  const typeBadgeClass = item.type === 'lost' ? 'lost' : 'found';
  const dateField = item.type === 'lost' ? 'date_lost' : 'date_found';

  modalBody.innerHTML = `
        <div class="modal-item-header">
            <span class="item-type-badge ${typeBadgeClass}">
                ${item.type === 'lost' ? 'Lost Item' : 'Found Item'}
            </span>
            <span class="category-tag">${
              item.category?.name || 'Uncategorized'
            }</span>
        </div>
        
        <div class="modal-item-image">
            <img src="${imageUrl}" alt="${
    item.title
  }" onerror="this.src='${fallbackImageUrl}'">
        </div>
        
        <div class="modal-item-details">
            <h3>${item.title}</h3>
            <p class="item-description">${
              item.description || 'No description available'
            }</p>
            
            <div class="item-meta">
                <div class="item-location">
                    <i class="fa-solid fa-location-dot"></i>
                    <span><strong>Location:</strong> ${
                      item.location || 'Not specified'
                    }</span>
                </div>
                <div class="item-date">
                    <i class="fa-solid fa-calendar"></i>
                    <span><strong>Date:</strong> ${new Date(
                      item[dateField] || item.date_lost_or_found
                    ).toLocaleDateString()}</span>
                </div>
                <div class="item-reporter">
                    <i class="fa-solid fa-user"></i>
                    <span><strong>Reported by:</strong> ${
                      item.user?.username || 'Anonymous'
                    }</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="contact-btn" onclick="contactOwner('${
                  item._id
                }')">
                    <i class="fa-solid fa-envelope"></i>
                    Contact Owner
                </button>
            </div>
        </div>
    `;
}

// Close modal
function closeModal() {
  document.getElementById('item-modal').classList.remove('active');
  document.body.classList.remove('modal-open');
  document.body.classList.add('modal-closed');
}

// Contact owner functionality
function contactOwner(itemId) {
  // This would typically open a contact form or messaging system
  console.log('Contact owner for item:', itemId);
  alert('Contact functionality would be implemented here');
}

// Add keyboard navigation for item cards
document.addEventListener('keydown', (e) => {
  if (e.target.classList.contains('item-card') && e.key === 'Enter') {
    e.target.click();
  }
});

// Add CSS for modal item display
const modalStyles = `
.modal-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.modal-item-image {
    width: 100%;
    height: 250px;
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 1rem;
    background: #f8f9fa;
}

.modal-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.modal-item-details h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.3rem;
}

.modal-item-details .item-description {
    color: #666;
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.modal-item-details .item-meta {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.modal-item-details .item-meta > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.modal-item-details .item-meta i {
    color: var(--primary-color);
    width: 16px;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
}

.modal-actions .contact-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
}
`;

// Add modal styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);
