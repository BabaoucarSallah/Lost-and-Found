// Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    this.token = localStorage.getItem('token');
    this.currentUser = null;
    this.currentEditingCategoryId = null;
    this.stats = {
      totalUsers: 0,
      totalItems: 0,
      lostItems: 0,
      foundItems: 0,
    };

    this.init();
  }

  init() {
    try {
      this.checkAuth();
      this.setupEventListeners();
      this.loadDashboard();
      console.log('Admin dashboard initialized successfully');
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
    }
  }

  checkAuth() {
    if (!this.token) {
      window.location.href = 'admin-login.html';
      return;
    }

    // Verify token and user role
    this.getCurrentUser();
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        this.currentUser = await response.json();
        if (this.currentUser.data.user.role !== 'admin') {
          this.showAlert(
            'Access Denied',
            'Admin privileges required. You will be redirected to login.'
          );
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
          return;
        }
        document.getElementById('admin-name').textContent =
          this.currentUser.data.user.username;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      window.location.href = 'admin-login.html';
    }
  }

  setupEventListeners() {
    try {
      // Navigation links
      const navLinks = document.querySelectorAll('.nav-link');
      console.log(`Found ${navLinks.length} navigation links`);

      navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          // Check if it's the main site link first, before preventing default
          if (e.currentTarget.classList.contains('main-site-link')) {
            // The onclick handler will handle main site navigation
            console.log('Main site link clicked - handled by onclick');
            return;
          }

          // Only prevent default for admin dashboard navigation
          e.preventDefault();

          // Get section from current target or target
          let section = e.currentTarget.getAttribute('data-section');
          if (!section) {
            section = e.target.getAttribute('data-section');
          }

          if (section) {
            console.log(`Navigating to section: ${section}`);
            this.showSection(section);
          } else {
            console.error(
              'Navigation link missing data-section attribute',
              e.currentTarget
            );
          }
        });
      });

      // Category form
      const categoryForm = document.getElementById('category-form');
      if (categoryForm) {
        categoryForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleCategorySubmit();
        });
      } else {
        console.warn('Category form not found');
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }

    // Add Item form
    document.getElementById('add-item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddItemSubmit(e);
    });

    // Password reset form
    document
      .getElementById('password-reset-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePasswordReset(e);
      });

    // Role change form
    document
      .getElementById('role-change-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRoleChange(e);
      });

    // Modal close handlers
    document.getElementById('category-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeCategoryModal();
      }
    });

    document
      .getElementById('password-reset-modal')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          this.closePasswordResetModal();
        }
      });

    document
      .getElementById('role-change-modal')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          this.closeRoleChangeModal();
        }
      });

    document.getElementById('item-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeItemModal();
      }
    });

    document.getElementById('add-item-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeAddItemModal();
      }
    });

    // Edit User form
    document
      .getElementById('edit-user-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditUserSubmit(e);
      });

    // Edit Item form
    document
      .getElementById('edit-item-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditItemSubmit(e);
      });

    // Edit Claim form
    document
      .getElementById('edit-claim-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditClaimSubmit(e);
      });

    // Edit modal close handlers
    document
      .getElementById('edit-user-modal')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          this.closeEditUserModal();
        }
      });

    document
      .getElementById('edit-item-modal')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          this.closeEditItemModal();
        }
      });

    document
      .getElementById('edit-claim-modal')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          this.closeEditClaimModal();
        }
      });
  }

  showSection(sectionName) {
    // Validate sectionName
    if (!sectionName) {
      console.error('showSection: sectionName is required');
      return;
    }

    // Hide all sections
    document.querySelectorAll('.content-section').forEach((section) => {
      section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add('active');
    } else {
      console.error(
        `showSection: Section element with id "${sectionName}" not found`
      );
      return;
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });

    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (navLink) {
      navLink.classList.add('active');
    } else {
      console.warn(
        `showSection: Navigation link for section "${sectionName}" not found`
      );
    }

    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users Management',
      items: 'Items Management',
      categories: 'Categories Management',
      claims: 'Claims Management',
      messages: 'Messages Management',
    };

    const pageTitle = document.getElementById('page-title');
    if (pageTitle && titles[sectionName]) {
      pageTitle.textContent = titles[sectionName];
    }

    // Load section data
    this.loadSectionData(sectionName);
  }

  // Method to navigate to a section (used by onclick handlers)
  navigateToSection(sectionName, filter = null) {
    this.showSection(sectionName);

    // Apply filter if provided
    if (filter && sectionName === 'items') {
      const filterSelect = document.getElementById('item-type-filter');
      if (filterSelect) {
        filterSelect.value = filter;
        // Trigger the filter function if it exists
        if (typeof filterItems === 'function') {
          filterItems();
        }
      }
    }
  }

  async loadSectionData(section) {
    switch (section) {
      case 'dashboard':
        await this.loadDashboard();
        break;
      case 'users':
        await this.loadUsers();
        break;
      case 'items':
        await this.loadItems();
        break;
      case 'categories':
        await this.loadCategories();
        break;
      case 'claims':
        await this.loadClaims();
        break;
      case 'messages':
        await this.loadMessages();
        break;
    }
  }

  async loadDashboard() {
    try {
      this.showLoading();

      // Load statistics
      await this.loadStats();

      this.hideLoading();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.hideLoading();
    }
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.baseURL}/users/dashboard/stats`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data.stats;

        this.stats.totalUsers = stats.totalUsers || 0;
        this.stats.totalItems = stats.totalItems || 0;
        this.stats.lostItems = stats.lostItems || 0;
        this.stats.foundItems = stats.foundItems || 0;

        // Update stat elements with error handling
        const totalUsersEl = document.getElementById('total-users');
        const totalItemsEl = document.getElementById('total-items');
        const lostItemsEl = document.getElementById('lost-items');
        const foundItemsEl = document.getElementById('found-items');

        if (totalUsersEl) totalUsersEl.textContent = this.stats.totalUsers;
        if (totalItemsEl) totalItemsEl.textContent = this.stats.totalItems;
        if (lostItemsEl) lostItemsEl.textContent = this.stats.lostItems;
        if (foundItemsEl) foundItemsEl.textContent = this.stats.foundItems;

        // Display recent activity
        if (data.data.recentActivity) {
          this.displayRecentActivity(data.data.recentActivity);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  displayRecentActivity(items) {
    const container = document.getElementById('recent-activity-list');

    if (!container) {
      console.error('Recent activity container not found');
      return;
    }

    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML =
        '<p class="text-center" style="color: #ccc;">No recent activity</p>';
      return;
    }

    items.forEach((item) => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${
                      item.type === 'lost' ? 'fa-search' : 'fa-check-circle'
                    }"></i>
                </div>
                <div class="activity-info">
                    <p><strong>${item.title}</strong> was reported as ${
        item.type
      }</p>
                    <div class="activity-time">${new Date(
                      item.createdAt
                    ).toLocaleString()}</div>
                </div>
            `;
      container.appendChild(activityItem);
    });
  }

  async loadUsers() {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/users`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.displayUsers(data.data.users);
      } else {
        throw new Error('Failed to load users');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading users:', error);
      this.hideLoading();
    }
  }

  displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    if (!users || users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center">No users found</td></tr>';
      return;
    }

    users.forEach((user) => {
      const userRole = user.role || 'user'; // Default to 'user' if role is null/undefined

      const row = document.createElement('tr');
      row.innerHTML = `
                <td data-label="Username">${user.username}</td>
                <td data-label="Email">${user.email}</td>
                <td data-label="Role"><span class="status-badge ${
                  userRole === 'admin' ? 'status-active' : 'status-pending'
                }">${userRole}</span></td>
                <td data-label="Actions" class="actions">
                    <button class="btn btn-warning btn-sm" onclick="adminDashboard.editUser('${
                      user._id
                    }')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="adminDashboard.manageUser('${
                      user._id
                    }')">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  }

  async loadItems() {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/items?limit=1000`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.displayItems(data.data.items);
      } else {
        throw new Error('Failed to load items');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading items:', error);
      this.hideLoading();
    }
  }

  displayItems(items) {
    const tbody = document.getElementById('items-table-body');
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center">No items found</td></tr>';
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td data-label="Image">
                    <img src="${this.baseURL.replace('/api/v1', '')}${
        item.image_url
      }" 
                         alt="${item.title}" 
                         class="item-image"
                         onerror="this.src='${this.baseURL.replace(
                           '/api/v1',
                           ''
                         )}/frontend/img/100x100.png'">
                </td>
                <td data-label="Title">${item.title}</td>
                <td data-label="Type"><span class="status-badge status-${
                  item.type
                }">${item.type}</span></td>
                <td data-label="Actions" class="actions">
                    <button class="btn btn-warning btn-sm" onclick="adminDashboard.editItem('${
                      item._id
                    }')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.viewItemDetails('${
                      item._id
                    }')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteItem('${
                      item._id
                    }')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  }

  async loadCategories() {
    try {
      this.showLoading();

      // Load categories and items to calculate counts
      const [categoriesResponse, itemsResponse] = await Promise.all([
        fetch(`${this.baseURL}/categories`, {
          headers: { Authorization: `Bearer ${this.token}` },
        }),
        fetch(`${this.baseURL}/items?limit=1000`, {
          headers: { Authorization: `Bearer ${this.token}` },
        }),
      ]);

      if (categoriesResponse.ok && itemsResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        const itemsData = await itemsResponse.json();

        // Calculate item counts for each category
        const categories = categoriesData.data.categories;
        const items = itemsData.data.items;

        // Count items per category
        const itemCounts = {};
        items.forEach((item) => {
          const categoryId = item.category?._id || item.category;
          if (categoryId) {
            itemCounts[categoryId] = (itemCounts[categoryId] || 0) + 1;
          }
        });

        // Add item counts to categories
        categories.forEach((category) => {
          category.itemCount = itemCounts[category._id] || 0;
        });

        this.displayCategories(categories);
      } else {
        throw new Error('Failed to load categories or items');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.hideLoading();
    }
  }

  displayCategories(categories) {
    const tbody = document.getElementById('categories-table-body');
    tbody.innerHTML = '';

    if (!categories || categories.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="text-center">No categories found</td></tr>';
      return;
    }

    categories.forEach((category) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td data-label="Name">${category.name}</td>
                <td data-label="Items Count">${category.itemCount || 0}</td>
                <td data-label="Actions" class="actions">
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.viewCategoryDetails('${
                      category._id
                    }')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="adminDashboard.editCategory('${
                      category._id
                    }')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteCategory('${
                      category._id
                    }')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  }

  async loadClaims() {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/claims`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.displayClaims(data.data.claims);
      } else {
        throw new Error('Failed to load claims');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading claims:', error);
      this.hideLoading();
    }
  }

  displayClaims(claims) {
    const tbody = document.getElementById('claims-table-body');
    tbody.innerHTML = '';

    if (!claims || claims.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center">No claims found</td></tr>';
      return;
    }

    claims.forEach((claim) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td data-label="Item">${claim.item?.title || 'N/A'}</td>
                <td data-label="Claimant">${
                  claim.claimer_user?.username || 'N/A'
                }</td>
                <td data-label="Status"><span class="status-badge status-${
                  claim.status
                }">${claim.status}</span></td>
                <td data-label="Actions" class="actions">
                    <button class="btn btn-warning btn-sm" onclick="adminDashboard.editClaim('${
                      claim._id
                    }')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.viewClaimDetails('${
                      claim._id
                    }')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-success btn-sm" onclick="adminDashboard.approveClaim('${
                      claim._id
                    }')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.rejectClaim('${
                      claim._id
                    }')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  }

  async loadMessages() {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/messages`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.displayMessages(data.data.messages);
      } else {
        throw new Error('Failed to load messages');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading messages:', error);
      this.hideLoading();
    }
  }

  displayMessages(messages) {
    const tbody = document.getElementById('messages-table-body');
    tbody.innerHTML = '';

    if (!messages || messages.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
      return;
    }

    messages.forEach((message) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td data-label="ID">${message._id}</td>
                <td data-label="From">${message.sender?.username || 'N/A'}</td>
                <td data-label="To">${message.recipient?.username || 'N/A'}</td>
                <td data-label="Subject">${message.subject || 'N/A'}</td>
                <td data-label="Date">${new Date(
                  message.createdAt
                ).toLocaleDateString()}</td>
                <td data-label="Actions" class="actions">
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.viewMessage('${
                      message._id
                    }')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="adminDashboard.replyMessage('${
                      message._id
                    }')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteMessage('${
                      message._id
                    }')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  }

  // Category Management
  showAddCategoryModal() {
    document.getElementById('category-modal-title').textContent =
      'Add Category';
    document.getElementById('category-form').reset();
    document.getElementById('category-modal').style.display = 'block';
    this.currentEditingCategoryId = null;
  }

  closeCategoryModal() {
    document.getElementById('category-modal').style.display = 'none';
    this.currentEditingCategoryId = null;
  }

  async handleCategorySubmit() {
    try {
      const formData = new FormData(document.getElementById('category-form'));
      const categoryData = {
        name: formData.get('category-name'),
        description: formData.get('category-description'),
      };

      let response;
      if (this.currentEditingCategoryId) {
        // Edit existing category
        response = await fetch(
          `${this.baseURL}/categories/${this.currentEditingCategoryId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify(categoryData),
          }
        );
      } else {
        // Add new category
        response = await fetch(`${this.baseURL}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(categoryData),
        });
      }

      if (response.ok) {
        this.closeCategoryModal();
        this.loadCategories();
        const message = this.currentEditingCategoryId
          ? 'Category updated successfully'
          : 'Category added successfully';
        this.showNotification(message, 'success');
      } else {
        throw new Error('Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      this.showNotification('Failed to save category', 'error');
    }
  }

  // Item Management
  async viewItem(itemId) {
    try {
      const response = await fetch(`${this.baseURL}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.showItemDetails(data.data.item);
      } else {
        throw new Error('Failed to fetch item details');
      }
    } catch (error) {
      console.error('Error viewing item:', error);
    }
  }

  showItemDetails(item) {
    const detailsContainer = document.getElementById('item-details');
    detailsContainer.innerHTML = `
            <div class="p-3">
                <div class="row">
                    <div class="col-md-6">
                        <img src="${this.baseURL.replace('/api/v1', '')}${
      item.image_url
    }" 
                             alt="${item.title}" 
                             style="width: 100%; max-width: 300px; border-radius: 8px;"
                             onerror="this.src='${this.baseURL.replace(
                               '/api/v1',
                               ''
                             )}/frontend/img/100x100.png'">
                    </div>
                    <div class="col-md-6">
                        <h4>${item.title}</h4>
                        <p><strong>Type:</strong> <span class="status-badge status-${
                          item.type
                        }">${item.type}</span></p>
                        <p><strong>Category:</strong> ${
                          item.category?.name || 'N/A'
                        }</p>
                        <p><strong>Location:</strong> ${item.location}</p>
                        <p><strong>Date:</strong> ${new Date(
                          item.date_lost_or_found
                        ).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> <span class="status-badge status-${
                          item.status
                        }">${item.status}</span></p>
                        <p><strong>Reporter:</strong> ${
                          item.user?.username || 'Unknown'
                        }</p>
                        <p><strong>Description:</strong></p>
                        <p>${item.description}</p>
                    </div>
                </div>
            </div>
        `;
    document.getElementById('item-modal').classList.add('active');
  }

  closeItemModal() {
    document.getElementById('item-modal').classList.remove('active');
  }

  // Add Item Modal Functions
  async showAddItemModal() {
    // Load categories first
    await this.loadCategoriesForSelect();

    // Reset form
    document.getElementById('add-item-form').reset();

    // Set default date to today
    document.getElementById('item-date').valueAsDate = new Date();

    // Show modal
    document.getElementById('add-item-modal').classList.add('active');
  }

  closeAddItemModal() {
    document.getElementById('add-item-modal').classList.remove('active');
  }

  async loadCategoriesForSelect() {
    try {
      const response = await fetch(`${this.baseURL}/categories`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const categorySelect = document.getElementById('item-category');

        // Clear existing options except the first one
        categorySelect.innerHTML = '<option value="">Select Category</option>';

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

  async handleAddItemSubmit(event) {
    event.preventDefault();

    try {
      const formData = new FormData();

      // Get form values
      const type = document.getElementById('item-type').value;
      const title = document.getElementById('item-title').value;
      const description = document.getElementById('item-description').value;
      const category = document.getElementById('item-category').value;
      const location = document.getElementById('item-location').value;
      const date = document.getElementById('item-date').value;
      const image = document.getElementById('item-image').files[0];
      const reporterEmail = document.getElementById('item-reporter').value;

      // Validate required fields
      if (
        !type ||
        !title ||
        !description ||
        !category ||
        !location ||
        !date ||
        !image
      ) {
        this.showNotification('Please fill in all required fields', 'error');
        return;
      }

      // Show loading spinner
      document.getElementById('loading').classList.add('active');

      // Append data to FormData
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('date_lost_or_found', date);
      formData.append('image', image);

      // Create item (will be created under the admin's account)
      const response = await fetch(`${this.baseURL}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      // Hide loading spinner
      document.getElementById('loading').classList.remove('active');

      if (response.ok) {
        this.closeAddItemModal();
        this.loadItems();
        this.loadDashboardStats();
        this.showNotification('Item added successfully', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      document.getElementById('loading').classList.remove('active');
      this.showNotification(error.message || 'Failed to add item', 'error');
    }
  }

  // User Management
  async deleteUser(userId) {
    try {
      // Get user details first
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data.user;
        this.showDeleteUserModal(user);
      } else {
        throw new Error('Failed to load user details');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      this.showNotification('Error loading user details', 'error');
    }
  }

  showDeleteUserModal(user) {
    // Store user ID for deletion
    this.userToDelete = user;

    // Populate user info
    const userInfoContainer = document.getElementById('delete-user-info');
    userInfoContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div>
          <strong>Username:</strong> ${user.username}<br>
          <strong>Email:</strong> ${user.email}<br>
          <strong>Role:</strong> <span class="status-badge ${
            user.role === 'admin' ? 'status-active' : 'status-pending'
          }">${user.role}</span>
        </div>
      </div>
    `;

    // Show modal
    document.getElementById('delete-user-modal').style.display = 'block';

    // Add backdrop click handler
    const modal = document.getElementById('delete-user-modal');
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeDeleteUserModal();
      }
    };
  }

  closeDeleteUserModal() {
    document.getElementById('delete-user-modal').style.display = 'none';
    this.userToDelete = null;
  }

  async confirmDeleteUser() {
    if (!this.userToDelete) return;

    try {
      this.showLoading();
      const response = await fetch(
        `${this.baseURL}/users/${this.userToDelete._id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );

      if (response.ok) {
        this.closeDeleteUserModal();
        this.closeUserManagementModal(); // Close the user management modal too
        this.loadUsers();
        this.showNotification('User deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete user');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showNotification('Failed to delete user', 'error');
      this.hideLoading();
    }
  }

  // Manage User - comprehensive modal with details and actions
  async manageUser(userId) {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data.user;

        // Store current user for actions
        this.currentManagedUser = user;

        // Display user details and setup actions
        this.showUserManagementModal(user);
      } else {
        throw new Error('Failed to fetch user details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading user:', error);
      this.showNotification('Error loading user details', 'error');
      this.hideLoading();
    }
  }

  // Show User Management Modal with details and actions
  showUserManagementModal(user) {
    const modal = document.getElementById('user-details-modal');

    // Populate user details
    const userDetailsContent = document.getElementById('user-details-content');
    userDetailsContent.innerHTML = `
      <div class="user-info-item">
        <strong>Name:</strong> ${user.username}
      </div>
      <div class="user-info-item">
        <strong>Email:</strong> ${user.email}
      </div>
      <div class="user-info-item">
        <strong>Role:</strong> ${user.role}
      </div>
      <div class="user-info-item">
        <strong>Contact:</strong> ${user.contact_info || 'N/A'}
      </div>
      <div class="user-info-item">
        <strong>Created:</strong> ${new Date(
          user.createdAt
        ).toLocaleDateString()}
      </div>
    `;

    // Setup action buttons
    this.setupManagementModalActions(user);

    // Show modal
    modal.style.display = 'block';

    // Add click handler for modal backdrop
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeUserManagementModal();
      }
    };
  }

  // Setup action buttons in management modal
  setupManagementModalActions(user) {
    // Change Role button
    const changeRoleBtn = document.getElementById('change-role-btn');
    changeRoleBtn.onclick = () => this.changeUserRole(user._id);

    // Reset Password button
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    resetPasswordBtn.onclick = () => this.resetUserPassword(user._id);

    // Delete User button
    const deleteUserBtn = document.getElementById('delete-user-btn');
    deleteUserBtn.onclick = () => this.deleteUser(user._id);
  }

  // Close User Management Modal
  closeUserManagementModal() {
    document.getElementById('user-details-modal').style.display = 'none';
    this.currentManagedUser = null;
  }

  // Category Details Modal Functions
  async viewCategoryDetails(categoryId) {
    try {
      this.showLoading();

      // Load category details and count items
      const [categoryResponse, itemsResponse] = await Promise.all([
        fetch(`${this.baseURL}/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        }),
        fetch(`${this.baseURL}/items?limit=1000`, {
          headers: { Authorization: `Bearer ${this.token}` },
        }),
      ]);

      if (categoryResponse.ok && itemsResponse.ok) {
        const categoryData = await categoryResponse.json();
        const itemsData = await itemsResponse.json();

        const category = categoryData.data.category;
        const items = itemsData.data.items;

        // Count items in this category
        const itemCount = items.filter((item) => {
          const itemCategoryId = item.category?._id || item.category;
          return itemCategoryId === categoryId;
        }).length;

        // Add item count to category
        category.itemCount = itemCount;

        this.showCategoryDetailsModal(category);
      } else {
        throw new Error('Failed to fetch category details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading category:', error);
      this.showNotification('Error loading category details', 'error');
      this.hideLoading();
    }
  }

  // Show Category Details Modal with details and actions
  showCategoryDetailsModal(category) {
    const modal = document.getElementById('category-details-modal');

    // Populate category details
    const categoryDetailsContent = document.getElementById(
      'category-details-content'
    );
    categoryDetailsContent.innerHTML = `
      <div class="user-info-item">
        <strong>ID:</strong> ${category._id}
      </div>
      <div class="user-info-item">
        <strong>Name:</strong> ${category.name}
      </div>
      <div class="user-info-item">
        <strong>Description:</strong> ${category.description || 'N/A'}
      </div>
      <div class="user-info-item">
        <strong>Items Count:</strong> ${category.itemCount || 0}
      </div>
      <div class="user-info-item">
        <strong>Created:</strong> ${new Date(
          category.createdAt
        ).toLocaleDateString()}
      </div>
    `;

    // Setup action buttons
    this.setupCategoryModalActions(category);

    // Show modal
    modal.style.display = 'block';

    // Add click handler for modal backdrop
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeCategoryDetailsModal();
      }
    };
  }

  // Setup action buttons in category modal
  setupCategoryModalActions(category) {
    // Edit Category button
    const editCategoryBtn = document.getElementById('edit-category-btn');
    editCategoryBtn.onclick = () => {
      this.closeCategoryDetailsModal();
      this.editCategory(category._id);
    };

    // Delete Category button
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    deleteCategoryBtn.onclick = () => {
      this.closeCategoryDetailsModal();
      this.deleteCategory(category._id);
    };
  }

  // Close Category Details Modal
  closeCategoryDetailsModal() {
    document.getElementById('category-details-modal').style.display = 'none';
  }

  // Edit Category Function
  async editCategory(categoryId) {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const category = data.data.category;

        // Populate form with category data
        document.getElementById('category-modal-title').textContent =
          'Edit Category';
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value =
          category.description || '';

        // Set current editing ID
        this.currentEditingCategoryId = categoryId;

        // Show modal
        document.getElementById('category-modal').style.display = 'block';
      } else {
        throw new Error('Failed to load category details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading category for edit:', error);
      this.showNotification('Error loading category details', 'error');
      this.hideLoading();
    }
  }

  // Delete Category Function
  async deleteCategory(categoryId) {
    if (
      !confirm(
        'Are you sure you want to delete this category? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.loadCategories();
        this.showNotification('Category deleted successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to delete category',
          'error'
        );
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error deleting category:', error);
      this.showNotification('Error deleting category', 'error');
      this.hideLoading();
    }
  }

  // Claims Details Modal Functions
  async viewClaimDetails(claimId) {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/claims/${claimId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.showClaimDetailsModal(data.data.claim);
      } else {
        throw new Error('Failed to fetch claim details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading claim:', error);
      this.showNotification('Error loading claim details', 'error');
      this.hideLoading();
    }
  }

  // Show Claim Details Modal with details and actions
  showClaimDetailsModal(claim) {
    const modal = document.getElementById('claims-details-modal');

    // Populate claim details
    const claimDetailsContent = document.getElementById(
      'claim-details-content'
    );
    claimDetailsContent.innerHTML = `
      <div class="user-info-item">
        <strong>Claim ID:</strong> ${claim._id}
      </div>
      <div class="user-info-item">
        <strong>Item:</strong> ${claim.item?.title || 'N/A'}
      </div>
      <div class="user-info-item">
        <strong>Claimant:</strong> ${claim.claimer_user?.username || 'N/A'}
      </div>
      <div class="user-info-item">
        <strong>Claimant Email:</strong> ${claim.claimer_user?.email || 'N/A'}
      </div>
      <div class="user-info-item">
        <strong>Status:</strong> <span class="status-badge status-${
          claim.status
        }">${claim.status}</span>
      </div>
      <div class="user-info-item">
        <strong>Evidence:</strong> ${claim.evidence || 'No evidence provided'}
      </div>
      <div class="user-info-item">
        <strong>Contact Info:</strong> ${claim.contact_info || 'N/A'}
      </div>
      <div class="user-info-item">
        <strong>Date Created:</strong> ${new Date(
          claim.createdAt
        ).toLocaleDateString()}
      </div>
      <div class="user-info-item">
        <strong>Last Updated:</strong> ${new Date(
          claim.updatedAt
        ).toLocaleDateString()}
      </div>
    `;

    // Setup action buttons
    this.setupClaimModalActions(claim);

    // Show modal
    modal.style.display = 'block';

    // Add click handler for modal backdrop
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeClaimDetailsModal();
      }
    };
  }

  // Setup action buttons in claim modal
  setupClaimModalActions(claim) {
    // Approve Claim button
    const approveClaimBtn = document.getElementById('approve-claim-btn');
    approveClaimBtn.onclick = () => {
      this.closeClaimDetailsModal();
      this.approveClaim(claim._id);
    };

    // Reject Claim button
    const rejectClaimBtn = document.getElementById('reject-claim-btn');
    rejectClaimBtn.onclick = () => {
      this.closeClaimDetailsModal();
      this.rejectClaim(claim._id);
    };

    // View Item button
    const viewItemBtn = document.getElementById('view-item-btn');
    viewItemBtn.onclick = () => {
      if (claim.item?._id) {
        this.closeClaimDetailsModal();
        this.viewItemDetails(claim.item._id);
      } else {
        this.showNotification('Item details not available', 'warning');
      }
    };

    // Disable buttons based on claim status
    if (claim.status === 'approved') {
      approveClaimBtn.disabled = true;
      approveClaimBtn.style.opacity = '0.5';
    } else if (claim.status === 'rejected') {
      rejectClaimBtn.disabled = true;
      rejectClaimBtn.style.opacity = '0.5';
    }
  }

  // Close Claim Details Modal
  closeClaimDetailsModal() {
    document.getElementById('claims-details-modal').style.display = 'none';
  }

  // Approve Claim Function
  async approveClaim(claimId) {
    if (!confirm('Are you sure you want to approve this claim?')) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(
        `${this.baseURL}/claims/${claimId}/approve`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );

      if (response.ok) {
        this.loadClaims();
        this.showNotification('Claim approved successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to approve claim',
          'error'
        );
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error approving claim:', error);
      this.showNotification('Error approving claim', 'error');
      this.hideLoading();
    }
  }

  // Reject Claim Function
  async rejectClaim(claimId) {
    if (!confirm('Are you sure you want to reject this claim?')) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/claims/${claimId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.loadClaims();
        this.showNotification('Claim rejected successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to reject claim',
          'error'
        );
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      this.showNotification('Error rejecting claim', 'error');
      this.hideLoading();
    }
  }

  // Edit User Functions
  async editUser(userId) {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data.user;
        this.showEditUserModal(user);
      } else {
        throw new Error('Failed to fetch user details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading user for edit:', error);
      this.showNotification('Error loading user details', 'error');
      this.hideLoading();
    }
  }

  showEditUserModal(user) {
    // Store user ID for form submission
    this.currentEditingUserId = user._id;

    // Populate form with user data
    document.getElementById('edit-user-username').value = user.username;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role || 'user';
    document.getElementById('edit-user-contact').value =
      user.contact_info || '';

    // Show modal
    document.getElementById('edit-user-modal').style.display = 'block';

    // Add backdrop click handler
    const modal = document.getElementById('edit-user-modal');
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeEditUserModal();
      }
    };
  }

  closeEditUserModal() {
    document.getElementById('edit-user-modal').style.display = 'none';
    this.currentEditingUserId = null;
  }

  async handleEditUserSubmit(e) {
    e.preventDefault();

    if (!this.currentEditingUserId) return;

    try {
      const formData = new FormData(e.target);
      const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role'),
        contact_info: formData.get('contact_info'),
      };

      const response = await fetch(
        `${this.baseURL}/users/${this.currentEditingUserId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        this.closeEditUserModal();
        this.loadUsers();
        this.showNotification('User updated successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to update user',
          'error'
        );
      }
    } catch (error) {
      console.error('Error updating user:', error);
      this.showNotification('Error updating user', 'error');
    }
  }

  // Edit Item Functions
  async editItem(itemId) {
    try {
      this.showLoading();

      // Load item details and categories
      const [itemResponse, categoriesResponse] = await Promise.all([
        fetch(`${this.baseURL}/items/${itemId}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        }),
        fetch(`${this.baseURL}/categories`, {
          headers: { Authorization: `Bearer ${this.token}` },
        }),
      ]);

      if (itemResponse.ok && categoriesResponse.ok) {
        const itemData = await itemResponse.json();
        const categoriesData = await categoriesResponse.json();

        const item = itemData.data.item;
        const categories = categoriesData.data.categories;

        this.showEditItemModal(item, categories);
      } else {
        throw new Error('Failed to fetch item details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading item for edit:', error);
      this.showNotification('Error loading item details', 'error');
      this.hideLoading();
    }
  }

  showEditItemModal(item, categories) {
    // Store item ID for form submission
    this.currentEditingItemId = item._id;

    // Populate categories dropdown
    const categorySelect = document.getElementById('edit-item-category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category._id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });

    // Populate form with item data
    document.getElementById('edit-item-type').value = item.type;
    document.getElementById('edit-item-title').value = item.title;
    document.getElementById('edit-item-description').value = item.description;
    document.getElementById('edit-item-category').value =
      item.category?._id || item.category;
    document.getElementById('edit-item-location').value = item.location;
    document.getElementById('edit-item-status').value = item.status;

    // Format date for input
    const date = new Date(item.date_lost_or_found);
    document.getElementById('edit-item-date').value = date
      .toISOString()
      .split('T')[0];

    // Show modal
    document.getElementById('edit-item-modal').style.display = 'block';

    // Add backdrop click handler
    const modal = document.getElementById('edit-item-modal');
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeEditItemModal();
      }
    };
  }

  closeEditItemModal() {
    document.getElementById('edit-item-modal').style.display = 'none';
    this.currentEditingItemId = null;
  }

  async handleEditItemSubmit(e) {
    e.preventDefault();

    if (!this.currentEditingItemId) return;

    try {
      this.showLoading();
      const formData = new FormData();

      // Get form values
      const type = document.getElementById('edit-item-type').value;
      const title = document.getElementById('edit-item-title').value;
      const description = document.getElementById(
        'edit-item-description'
      ).value;
      const category = document.getElementById('edit-item-category').value;
      const location = document.getElementById('edit-item-location').value;
      const date = document.getElementById('edit-item-date').value;
      const status = document.getElementById('edit-item-status').value;
      const image = document.getElementById('edit-item-image').files[0];

      // Validate required fields
      if (
        !type ||
        !title ||
        !description ||
        !category ||
        !location ||
        !date ||
        !status
      ) {
        this.showNotification('Please fill in all required fields', 'error');
        this.hideLoading();
        return;
      }

      // Append data to FormData
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('date_lost_or_found', date);
      formData.append('status', status);

      // Only append image if a new one is selected
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(
        `${this.baseURL}/items/${this.currentEditingItemId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        this.closeEditItemModal();
        this.loadItems();
        this.showNotification('Item updated successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to update item',
          'error'
        );
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error updating item:', error);
      this.showNotification('Error updating item', 'error');
      this.hideLoading();
    }
  }

  // Edit Claim Functions
  async editClaim(claimId) {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/claims/${claimId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const claim = data.data.claim;
        this.showEditClaimModal(claim);
      } else {
        throw new Error('Failed to fetch claim details');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading claim for edit:', error);
      this.showNotification('Error loading claim details', 'error');
      this.hideLoading();
    }
  }

  showEditClaimModal(claim) {
    // Store claim ID for form submission
    this.currentEditingClaimId = claim._id;

    // Populate form with claim data
    document.getElementById('edit-claim-item').value =
      claim.item?.title || 'N/A';
    document.getElementById('edit-claim-claimant').value =
      claim.claimer_user?.username || 'N/A';
    document.getElementById('edit-claim-status').value = claim.status;
    document.getElementById('edit-claim-evidence').value = claim.evidence || '';
    document.getElementById('edit-claim-contact').value =
      claim.contact_info || '';

    // Show modal
    document.getElementById('edit-claim-modal').style.display = 'block';

    // Add backdrop click handler
    const modal = document.getElementById('edit-claim-modal');
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeEditClaimModal();
      }
    };
  }

  closeEditClaimModal() {
    document.getElementById('edit-claim-modal').style.display = 'none';
    this.currentEditingClaimId = null;
  }

  async handleEditClaimSubmit(e) {
    e.preventDefault();

    if (!this.currentEditingClaimId) return;

    try {
      const formData = new FormData(e.target);
      const claimData = {
        status: formData.get('status'),
        evidence: formData.get('evidence'),
        contact_info: formData.get('contact_info'),
      };

      const response = await fetch(
        `${this.baseURL}/claims/${this.currentEditingClaimId}/admin-update`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(claimData),
        }
      );

      if (response.ok) {
        this.closeEditClaimModal();
        this.loadClaims();
        this.showNotification('Claim updated successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to update claim',
          'error'
        );
      }
    } catch (error) {
      console.error('Error updating claim:', error);
      this.showNotification('Error updating claim', 'error');
    }
  }

  // Utility Functions
  showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'notification';
      document.body.appendChild(notification);
    }

    // Set notification content and type
    notification.innerHTML = `
      <div class="notification-content notification-${type}">
        <i class="fas ${
          type === 'success'
            ? 'fa-check-circle'
            : type === 'error'
            ? 'fa-exclamation-circle'
            : 'fa-info-circle'
        }"></i>
        <span>${message}</span>
      </div>
    `;

    // Show notification
    notification.style.display = 'block';
    notification.classList.add('show');

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.style.display = 'none';
      }, 300);
    }, 3000);
  }

  showConfirm(title, message) {
    return new Promise((resolve) => {
      const confirmed = confirm(`${title}\n\n${message}`);
      resolve(confirmed);
    });
  }

  showAlert(title, message) {
    alert(`${title}\n\n${message}`);
  }

  // Password Reset Functions
  async changeUserRole(userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data.user;

        // Show role change modal
        document.getElementById('role-change-modal').style.display = 'block';
        document.getElementById('role-change-user-name').value = user.username;
        document.getElementById('current-role').value = user.role;
        document.getElementById('new-role').value =
          user.role === 'admin' ? 'user' : 'admin';

        // Store user ID for form submission
        this.roleChangeUserId = userId;
      }
    } catch (error) {
      console.error('Error loading user for role change:', error);
      this.showNotification('Error loading user details', 'error');
    }
  }

  async resetUserPassword(userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data.user;

        // Show password reset modal
        document.getElementById('password-reset-modal').style.display = 'block';
        document.getElementById('reset-user-name').value = user.username;

        // Store user ID for form submission
        this.passwordResetUserId = userId;
      }
    } catch (error) {
      console.error('Error loading user for password reset:', error);
      this.showNotification('Error loading user details', 'error');
    }
  }

  closePasswordResetModal() {
    document.getElementById('password-reset-modal').style.display = 'none';
    this.passwordResetUserId = null;
  }

  closeRoleChangeModal() {
    document.getElementById('role-change-modal').style.display = 'none';
    this.roleChangeUserId = null;
  }

  async handlePasswordReset(e) {
    e.preventDefault();

    if (!this.passwordResetUserId) return;

    try {
      const formData = new FormData(e.target);
      const newPassword = formData.get('new-password');
      const confirmPassword = formData.get('confirm-password');

      if (newPassword !== confirmPassword) {
        this.showNotification('Passwords do not match', 'error');
        return;
      }

      if (newPassword.length < 8) {
        this.showNotification(
          'Password must be at least 8 characters',
          'error'
        );
        return;
      }

      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
      if (!passwordRegex.test(newPassword)) {
        this.showNotification(
          'Password must contain uppercase, lowercase, number, and special character',
          'error'
        );
        return;
      }

      const response = await fetch(
        `${this.baseURL}/users/${this.passwordResetUserId}/reset-password`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ newPassword: newPassword }),
        }
      );

      if (response.ok) {
        this.closePasswordResetModal();
        this.showNotification('Password reset successfully', 'success');
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to reset password',
          'error'
        );
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      this.showNotification('Error resetting password', 'error');
    }
  }

  async handleRoleChange(e) {
    e.preventDefault();

    if (!this.roleChangeUserId) return;

    try {
      const formData = new FormData(e.target);
      const newRole = formData.get('new-role');

      if (!newRole) {
        this.showNotification('Please select a role', 'error');
        return;
      }

      const response = await fetch(
        `${this.baseURL}/users/${this.roleChangeUserId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        this.closeRoleChangeModal();
        this.showNotification('User role updated successfully', 'success');

        // Add a small delay to ensure the database update is complete
        setTimeout(() => {
          this.loadUsers();
        }, 500);
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to update user role',
          'error'
        );
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      this.showNotification('Error updating user role', 'error');
    }
  }

  // Item Management Functions
  async deleteItem(itemId) {
    if (
      !confirm(
        'Are you sure you want to delete this item? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.loadItems();
        this.showNotification('Item deleted successfully', 'success');
        // Close item details modal if open
        this.closeItemDetailsModal();
      } else {
        const error = await response.json();
        this.showNotification(
          error.message || 'Failed to delete item',
          'error'
        );
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error deleting item:', error);
      this.showNotification('Error deleting item', 'error');
      this.hideLoading();
    }
  }

  // Message Management Functions
  async viewMessage(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const message = data.data.message;
        this.showMessageModal(message);
      } else {
        throw new Error('Failed to load message');
      }
    } catch (error) {
      console.error('Error loading message:', error);
      this.showNotification('Error loading message', 'error');
    }
  }

  showMessageModal(message) {
    alert(
      `Message Details:\n\nFrom: ${message.sender?.username || 'N/A'}\nTo: ${
        message.recipient?.username || 'N/A'
      }\nSubject: ${message.subject || 'N/A'}\nMessage: ${
        message.message || 'N/A'
      }\nDate: ${new Date(message.createdAt).toLocaleDateString()}`
    );
  }

  async replyMessage(messageId) {
    const reply = prompt('Enter your reply:');
    if (reply) {
      try {
        const response = await fetch(
          `${this.baseURL}/messages/${messageId}/reply`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify({ message: reply }),
          }
        );

        if (response.ok) {
          this.showNotification('Reply sent successfully', 'success');
        } else {
          throw new Error('Failed to send reply');
        }
      } catch (error) {
        console.error('Error sending reply:', error);
        this.showNotification('Error sending reply', 'error');
      }
    }
  }

  async deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.loadMessages();
        this.showNotification('Message deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      this.showNotification('Error deleting message', 'error');
    }
  }

  // Additional helper functions
  refreshUsers() {
    this.loadUsers();
  }

  refreshItems() {
    this.loadItems();
  }

  refreshMessages() {
    this.loadMessages();
  }

  filterItems() {
    // Get filter values from the form
    const typeFilter = document.getElementById('item-type-filter')?.value || '';
    const statusFilter =
      document.getElementById('item-status-filter')?.value || '';

    // Build query parameters
    let queryParams = [];
    if (typeFilter) queryParams.push(`type=${encodeURIComponent(typeFilter)}`);
    if (statusFilter)
      queryParams.push(`status=${encodeURIComponent(statusFilter)}`);

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    // Load items with filters
    this.loadItemsWithFilter(queryString);
  }

  async loadItemsWithFilter(queryString = '') {
    try {
      this.showLoading();
      const separator = queryString ? '&' : '?';
      const response = await fetch(
        `${this.baseURL}/items${queryString}${separator}limit=1000`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.displayItems(data.data.items);
      } else {
        throw new Error('Failed to load items');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading items:', error);
      this.hideLoading();
    }
  }

  filterMessages() {
    // Get filter values from the form
    const statusFilter =
      document.getElementById('message-status-filter')?.value || '';

    // Build query parameters
    let queryParams = [];
    if (statusFilter)
      queryParams.push(`status=${encodeURIComponent(statusFilter)}`);

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    // Load messages with filters
    this.loadMessagesWithFilter(queryString);
  }

  async loadMessagesWithFilter(queryString = '') {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/messages${queryString}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.displayMessages(data.data.messages);
      } else {
        throw new Error('Failed to load messages');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error loading messages:', error);
      this.hideLoading();
    }
  }

  // Missing modal functions that are called by global functions
  closeAlertModal() {
    // Implementation for closing alert modal
    const modal = document.getElementById('alert-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  closeConfirmModal() {
    // Implementation for closing confirm modal
    const modal = document.getElementById('confirm-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  confirmOk() {
    // Implementation for confirm OK button
    this.closeConfirmModal();
  }

  // Dashboard stats refresh
  async loadDashboardStats() {
    await this.loadStats();
  }
}

// Global functions for onclick handlers
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}

function logout() {
  adminDashboard
    .showConfirm('Logout', 'Are you sure you want to logout?')
    .then((confirmed) => {
      if (confirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'admin-login.html';
      }
    });
}

function filterItems() {
  if (adminDashboard) {
    adminDashboard.filterItems();
  }
}

function filterClaims() {
  // This function can be enhanced to filter claims by status
  if (adminDashboard) {
    adminDashboard.loadClaims();
  }
}

function filterMessages() {
  if (adminDashboard) {
    adminDashboard.filterMessages();
  }
}

function closePasswordResetModal() {
  if (adminDashboard) {
    adminDashboard.closePasswordResetModal();
  }
}

function closeRoleChangeModal() {
  if (adminDashboard) {
    adminDashboard.closeRoleChangeModal();
  }
}

// Global modal functions for HTML onclick handlers
function closeAlertModal() {
  adminDashboard.closeAlertModal();
}

function closeConfirmModal() {
  adminDashboard.closeConfirmModal();
}

function confirmOk() {
  adminDashboard.confirmOk();
}

function closeUserDetailsModal() {
  adminDashboard.closeUserManagementModal();
}

function closeDeleteUserModal() {
  if (adminDashboard) {
    adminDashboard.closeDeleteUserModal();
  }
}

function confirmDeleteUser() {
  if (adminDashboard) {
    adminDashboard.confirmDeleteUser();
  }
}

// Global refresh functions for HTML onclick handlers
function refreshUsers() {
  if (adminDashboard) {
    adminDashboard.refreshUsers();
  }
}

function refreshItems() {
  if (adminDashboard) {
    adminDashboard.refreshItems();
  }
}

function refreshCategories() {
  if (adminDashboard) {
    adminDashboard.loadCategories();
  }
}

function refreshClaims() {
  if (adminDashboard) {
    adminDashboard.loadClaims();
  }
}

function refreshMessages() {
  if (adminDashboard) {
    adminDashboard.refreshMessages();
  }
}

// Global functions for Add Item modal
function showAddItemModal() {
  if (adminDashboard) {
    adminDashboard.showAddItemModal();
  }
}

function closeAddItemModal() {
  if (adminDashboard) {
    adminDashboard.closeAddItemModal();
  }
}

// Global functions for category modal
function showAddCategoryModal() {
  if (adminDashboard) {
    adminDashboard.showAddCategoryModal();
  }
}

function closeCategoryModal() {
  if (adminDashboard) {
    adminDashboard.closeCategoryModal();
  }
}

// Global functions for Edit User modal
function closeEditUserModal() {
  if (adminDashboard) {
    adminDashboard.closeEditUserModal();
  }
}

// Global functions for Edit Item modal
function closeEditItemModal() {
  if (adminDashboard) {
    adminDashboard.closeEditItemModal();
  }
}

// Global functions for Edit Claim modal
function closeEditClaimModal() {
  if (adminDashboard) {
    adminDashboard.closeEditClaimModal();
  }
}

// Initialize dashboard when page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
  adminDashboard = new AdminDashboard();

  // Make navigation method available globally for onclick handlers
  window.adminDashboard = adminDashboard;
});

// Global navigation function for onclick handlers
window.navigateToSection = function (sectionName, filter = null) {
  if (window.adminDashboard) {
    window.adminDashboard.navigateToSection(sectionName, filter);
  } else {
    console.error('Admin dashboard not initialized');
  }
};

// Item details modal functions
AdminDashboard.prototype.viewItemDetails = async function (itemId) {
  try {
    this.showLoading();
    const response = await fetch(`${this.baseURL}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (response.ok) {
      const data = await response.json();
      const item = data.data.item;
      this.showItemDetailsModal(item);
    } else {
      throw new Error('Failed to load item details');
    }
    this.hideLoading();
  } catch (error) {
    console.error('Error loading item details:', error);
    this.hideLoading();
    this.showNotification('Error loading item details', 'error');
  }
};

AdminDashboard.prototype.showItemDetailsModal = function (item) {
  const modalContent = `
    <div class="modal primary-modal" id="item-details-modal">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3><i class="fas fa-box"></i> Item Details</h3>
          <button class="modal-close" onclick="adminDashboard.closeItemDetailsModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="user-management-container">
            <div class="user-details-section">
              <h4><i class="fas fa-info-circle"></i> Item Information</h4>
              <div class="user-details-card">
                <div class="user-info-item">
                  <strong>ID:</strong>
                  <span>${item._id}</span>
                </div>
                <div class="user-info-item">
                  <strong>Title:</strong>
                  <span>${item.title}</span>
                </div>
                <div class="user-info-item">
                  <strong>Type:</strong>
                  <span class="status-badge status-${item.type}">${
    item.type
  }</span>
                </div>
                <div class="user-info-item">
                  <strong>Category:</strong>
                  <span>${item.category?.name || 'N/A'}</span>
                </div>
                <div class="user-info-item">
                  <strong>Location:</strong>
                  <span>${item.location}</span>
                </div>
                <div class="user-info-item">
                  <strong>Status:</strong>
                  <span class="status-badge status-${item.status}">${
    item.status
  }</span>
                </div>
                <div class="user-info-item">
                  <strong>Reporter:</strong>
                  <span>${item.user?.username || 'Unknown'}</span>
                </div>
                <div class="user-info-item">
                  <strong>Date:</strong>
                  <span>${new Date(
                    item.date_lost_or_found
                  ).toLocaleDateString()}</span>
                </div>
                <div class="user-info-item">
                  <strong>Description:</strong>
                  <span>${item.description || 'No description available'}</span>
                </div>
              </div>
            </div>
            <div class="user-actions-section">
              <h4><i class="fas fa-image"></i> Item Image</h4>
              <div class="user-details-card" style="text-align: center;">
                <img src="${this.baseURL.replace('/api/v1', '')}${
    item.image_url
  }" 
                     alt="${item.title}" 
                     style="max-width: 100%; max-height: 300px; border-radius: 8px; object-fit: cover;"
                     onerror="this.src='${this.baseURL.replace(
                       '/api/v1',
                       ''
                     )}/frontend/img/100x100.png'">
              </div>
              <h4><i class="fas fa-cogs"></i> Quick Actions</h4>
              <div class="action-buttons">
                <button class="action-btn btn-danger" onclick="adminDashboard.deleteItem('${
                  item._id
                }')">
                  <i class="fas fa-trash"></i> Delete Item
                </button>
                <button class="action-btn btn-secondary" onclick="adminDashboard.closeItemDetailsModal()">
                  <i class="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalContent);
  document.getElementById('item-details-modal').style.display = 'flex';
};

AdminDashboard.prototype.closeItemDetailsModal = function () {
  const modal = document.getElementById('item-details-modal');
  if (modal) {
    modal.remove();
  }
};

// Global function to navigate to main site
window.goToMainSite = function () {
  console.log('Navigating to main site in same tab');
  // Navigate to main site in the same tab
  window.location.href = './index.html';
};
