// Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    this.token = localStorage.getItem('token');
    this.currentUser = null;
    this.stats = {
      totalUsers: 0,
      totalItems: 0,
      lostItems: 0,
      foundItems: 0,
    };

    this.init();
  }

  init() {
    this.checkAuth();
    this.setupEventListeners();
    this.loadDashboard();
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
    // Navigation links
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.getAttribute('data-section');
        this.showSection(section);
      });
    });

    // Category form
    document.getElementById('category-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCategorySubmit();
    });

    // Password reset form
    document
      .getElementById('password-reset-form')
      .addEventListener('submit', (e) => {
        this.handlePasswordReset(e);
      });

    // Role change form
    document
      .getElementById('role-change-form')
      .addEventListener('submit', (e) => {
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
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach((section) => {
      section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });
    document
      .querySelector(`[data-section="${sectionName}"]`)
      .classList.add('active');

    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users Management',
      items: 'Items Management',
      categories: 'Categories Management',
      claims: 'Claims Management',
      messages: 'Messages Management',
    };
    document.getElementById('page-title').textContent = titles[sectionName];

    // Load section data
    this.loadSectionData(sectionName);
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

        document.getElementById('total-users').textContent =
          this.stats.totalUsers;
        document.getElementById('total-items').textContent =
          this.stats.totalItems;
        document.getElementById('lost-items').textContent =
          this.stats.lostItems;
        document.getElementById('found-items').textContent =
          this.stats.foundItems;

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
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${
                  user.role === 'admin' ? 'status-active' : 'status-pending'
                }">${user.role}</span></td>
                <td>
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
      const response = await fetch(`${this.baseURL}/items`, {
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
        '<tr><td colspan="10" class="text-center">No items found</td></tr>';
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${item._id}</td>
                <td>
                    <img src="${this.baseURL.replace('/api/v1', '')}${
        item.image_url
      }" 
                         alt="${item.title}" 
                         onerror="this.src='img/100x100.png'">
                </td>
                <td>${item.title}</td>
                <td><span class="status-badge status-${item.type}">${
        item.type
      }</span></td>
                <td>${item.category?.name || 'N/A'}</td>
                <td>${item.location}</td>
                <td><span class="status-badge status-${item.status}">${
        item.status
      }</span></td>
                <td>${item.user?.username || 'Unknown'}</td>
                <td>${new Date(
                  item.date_lost_or_found
                ).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.viewItem('${
                      item._id
                    }')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteItem('${
                      item._id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  }

  async loadCategories() {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/categories`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.displayCategories(data.data.categories);
      } else {
        throw new Error('Failed to load categories');
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
        '<tr><td colspan="5" class="text-center">No categories found</td></tr>';
      return;
    }

    categories.forEach((category) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${category._id}</td>
                <td>${category.name}</td>
                <td>${category.description || 'N/A'}</td>
                <td>${category.itemCount || 0}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="adminDashboard.editCategory('${
                      category._id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteCategory('${
                      category._id
                    }')">
                        <i class="fas fa-trash"></i>
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
        '<tr><td colspan="6" class="text-center">No claims found</td></tr>';
      return;
    }

    claims.forEach((claim) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${claim._id}</td>
                <td>${claim.item?.title || 'N/A'}</td>
                <td>${claim.claimer_user?.username || 'N/A'}</td>
                <td><span class="status-badge status-${claim.status}">${
        claim.status
      }</span></td>
                <td>${new Date(claim.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="adminDashboard.approveClaim('${
                      claim._id
                    }')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.rejectClaim('${
                      claim._id
                    }')">
                        <i class="fas fa-times"></i>
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
                <td>${message._id}</td>
                <td>${message.sender?.username || 'N/A'}</td>
                <td>${message.recipient?.username || 'N/A'}</td>
                <td>${message.subject || 'N/A'}</td>
                <td>${new Date(message.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.viewMessage('${
                      message._id
                    }')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteMessage('${
                      message._id
                    }')">
                        <i class="fas fa-trash"></i>
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
    document.getElementById('category-modal').classList.add('active');
  }

  closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
  }

  async handleCategorySubmit() {
    try {
      const formData = new FormData(document.getElementById('category-form'));
      const categoryData = {
        name: formData.get('name'),
        description: formData.get('description'),
      };

      const response = await fetch(`${this.baseURL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        this.closeCategoryModal();
        this.loadCategories();
        this.showNotification('Category added successfully', 'success');
      } else {
        throw new Error('Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      this.showNotification('Failed to add category', 'error');
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
                             onerror="this.src='img/100x100.png'">
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

  async deleteItem(itemId) {
    const confirmed = await this.showConfirm(
      'Delete Item',
      'Are you sure you want to delete this item?'
    );
    if (confirmed) {
      try {
        const response = await fetch(`${this.baseURL}/items/${itemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` },
        });

        if (response.ok) {
          this.loadItems();
          this.showNotification('Item deleted successfully', 'success');
        } else {
          throw new Error('Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        this.showNotification('Failed to delete item', 'error');
      }
    }
  }

  // User Management
  async deleteUser(userId) {
    const confirmed = await this.showConfirm(
      'Delete User',
      'Are you sure you want to delete this user?'
    );
    if (confirmed) {
      try {
        const response = await fetch(`${this.baseURL}/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` },
        });

        if (response.ok) {
          this.loadUsers();
          this.showNotification('User deleted successfully', 'success');
        } else {
          throw new Error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        this.showNotification('Failed to delete user', 'error');
      }
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

  // Approve Claim
  async approveClaim(claimId) {
    const confirmed = await this.showConfirm(
      'Approve Claim',
      'Are you sure you want to approve this claim?'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(
        `${this.baseURL}/claims/${claimId}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        this.showNotification('Claim approved successfully', 'success');
        this.loadClaims();
      } else {
        throw new Error('Failed to approve claim');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error approving claim:', error);
      this.showNotification('Error approving claim', 'error');
      this.hideLoading();
    }
  }

  // Reject Claim
  async rejectClaim(claimId) {
    const confirmed = await this.showConfirm(
      'Reject Claim',
      'Are you sure you want to reject this claim?'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/claims/${claimId}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.showNotification('Claim rejected successfully', 'success');
        this.loadClaims();
      } else {
        throw new Error('Failed to reject claim');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      this.showNotification('Error rejecting claim', 'error');
      this.hideLoading();
    }
  }

  // View Message
  async viewMessage(messageId) {
    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const message = data.data.message;

        this.showAlert(
          'Message Details',
          `From: ${message.sender?.username || 'Unknown'}\nTo: ${
            message.recipient?.username || 'Unknown'
          }\nSubject: ${message.subject || 'N/A'}\nContent: ${
            message.content || 'N/A'
          }\nDate: ${new Date(message.createdAt).toLocaleDateString()}`
        );
      } else {
        throw new Error('Failed to fetch message');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error viewing message:', error);
      this.showNotification('Error viewing message', 'error');
      this.hideLoading();
    }
  }

  // Delete Message
  async deleteMessage(messageId) {
    const confirmed = await this.showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message?'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.showNotification('Message deleted successfully', 'success');
        this.loadMessages();
      } else {
        throw new Error('Failed to delete message');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error deleting message:', error);
      this.showNotification('Error deleting message', 'error');
      this.hideLoading();
    }
  }

  // Reset User Password
  async resetUserPassword(userId) {
    const currentUser = this.currentManagedUser;

    // Store current user data
    this.currentResetUser = { id: userId, username: currentUser.username };

    // Open password reset modal
    document.getElementById('reset-user-name').value = currentUser.username;
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    const passwordResetModal = document.getElementById('password-reset-modal');
    passwordResetModal.classList.add('active');

    // Add backdrop click handler specifically for secondary modal
    passwordResetModal.onclick = (e) => {
      if (e.target === passwordResetModal) {
        this.closePasswordResetModal();
      }
    };
  }

  // Handle password reset form submission
  async handlePasswordReset(event) {
    event.preventDefault();

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      this.showAlert('Password Mismatch', 'Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      this.showAlert(
        'Password Too Short',
        'Password must be at least 8 characters long'
      );
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      this.showAlert(
        'Password Validation',
        'Password must contain at least one uppercase letter'
      );
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      this.showAlert(
        'Password Validation',
        'Password must contain at least one lowercase letter'
      );
      return;
    }

    if (!/\d/.test(newPassword)) {
      this.showAlert(
        'Password Validation',
        'Password must contain at least one number'
      );
      return;
    }

    if (!/[!@#$%^&*]/.test(newPassword)) {
      this.showAlert(
        'Password Validation',
        'Password must contain at least one special character (!@#$%^&*)'
      );
      return;
    }

    // Confirm password reset
    if (!this.currentResetUser) {
      this.showAlert('Error', 'No user selected for password reset');
      return;
    }

    const confirmed = await this.showConfirm(
      'Reset Password',
      `Are you sure you want to reset the password for ${this.currentResetUser.username}?`
    );
    if (!confirmed) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(
        `${this.baseURL}/users/${this.currentResetUser.id}/reset-password`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const username = this.currentResetUser?.username || 'Unknown User';
        this.showNotification(
          `Password reset successfully for ${username}`,
          'success'
        );

        // Store username before closing modal
        const userNameForAlert = username;

        // Close modal
        this.closePasswordResetModal();

        // Show the new password in a modal (for admin to share with user)
        this.showAlert(
          'Password Reset Successful',
          `Password reset successful!\n\nUser: ${userNameForAlert}\nNew Password: ${newPassword}\n\nPlease share this password securely with the user.`
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error resetting password:', error);
      this.showNotification(
        'Error resetting password: ' + error.message,
        'error'
      );
      this.hideLoading();
    }
  }

  // Close password reset modal
  closePasswordResetModal() {
    document.getElementById('password-reset-modal').classList.remove('active');
    this.currentResetUser = null;
  }

  // Role Change Management
  async changeUserRole(userId) {
    const currentUser = this.currentManagedUser;

    // Store current user data for the role change modal
    this.currentRoleChangeUser = {
      id: userId,
      username: currentUser.username,
      role: currentUser.role,
    };

    // Open role change modal
    document.getElementById('role-change-user-name').value =
      currentUser.username;
    document.getElementById('current-role').value = currentUser.role;
    document.getElementById('new-role').value = '';

    const roleChangeModal = document.getElementById('role-change-modal');
    roleChangeModal.classList.add('active');

    // Add backdrop click handler specifically for secondary modal
    roleChangeModal.onclick = (e) => {
      if (e.target === roleChangeModal) {
        this.closeRoleChangeModal();
      }
    };
  }

  // Handle role change form submission
  async handleRoleChange(event) {
    event.preventDefault();

    const newRole = document.getElementById('new-role').value;

    // Validate that a role is selected
    if (!newRole) {
      this.showAlert('Role Required', 'Please select a role');
      return;
    }

    // Check if role is actually changing
    if (newRole === this.currentRoleChangeUser.role) {
      this.showAlert('No Change', 'User already has this role');
      return;
    }

    // Confirm role change
    if (!this.currentRoleChangeUser) {
      this.showAlert('Error', 'No user selected for role change');
      return;
    }

    const confirmed = await this.showConfirm(
      'Change User Role',
      `Are you sure you want to change ${this.currentRoleChangeUser.username}'s role from ${this.currentRoleChangeUser.role} to ${newRole}?`
    );
    if (!confirmed) {
      return;
    }

    try {
      this.showLoading();
      const response = await fetch(
        `${this.baseURL}/users/${this.currentRoleChangeUser.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const username = this.currentRoleChangeUser?.username || 'Unknown User';
        this.showNotification(
          `Role changed successfully for ${username}`,
          'success'
        );

        // Close modal
        this.closeRoleChangeModal();

        // Refresh users list
        this.loadUsers();

        // Show success message
        this.showAlert(
          'Role Change Successful',
          `${username}'s role has been changed from ${this.currentRoleChangeUser.role} to ${newRole}`
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change role');
      }
      this.hideLoading();
    } catch (error) {
      console.error('Error changing role:', error);
      this.showNotification('Error changing role: ' + error.message, 'error');
      this.hideLoading();
    }
  }

  // Close role change modal
  closeRoleChangeModal() {
    document.getElementById('role-change-modal').classList.remove('active');
    this.currentRoleChangeUser = null;
  }

  // Navigate to section from stat cards
  navigateToSection(sectionName, filter = null) {
    // Update the active section
    this.showSection(sectionName);

    // If a filter is provided, apply it
    if (filter && sectionName === 'items') {
      // Apply filter to items
      this.filterItemsByType(filter);
    }

    // Scroll to top of the section
    document.getElementById(sectionName).scrollIntoView({ behavior: 'smooth' });
  }

  // Filter items by type
  filterItemsByType(type) {
    // Get the current items data
    const tbody = document.getElementById('items-table-body');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row) => {
      const typeCell = row.cells[3]; // Type column
      if (typeCell) {
        const itemType = typeCell.textContent.toLowerCase();
        if (type === 'all' || itemType.includes(type)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });

    // Update the filter dropdown if it exists
    const filterSelect = document.getElementById('item-type-filter');
    if (filterSelect) {
      filterSelect.value = type;
    }
  }

  // Utility Functions
  showLoading() {
    document.getElementById('loading').classList.add('active');
  }

  hideLoading() {
    document.getElementById('loading').classList.remove('active');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            background-color: ${
              type === 'success'
                ? '#28a745'
                : type === 'error'
                ? '#dc3545'
                : '#17a2b8'
            };
        `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Refresh functions
  refreshUsers() {
    this.loadUsers();
  }

  refreshItems() {
    this.loadItems();
  }

  refreshCategories() {
    this.loadCategories();
  }

  refreshClaims() {
    this.loadClaims();
  }

  refreshMessages() {
    this.loadMessages();
  }

  // Filter functions
  filterItems() {
    const filterValue = document.getElementById('item-type-filter').value;
    this.filterItemsByType(filterValue);
  }

  filterClaims() {
    const filterValue = document.getElementById('claim-status-filter').value;
    // Get the current claims data
    const tbody = document.getElementById('claims-table-body');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row) => {
      const statusCell = row.cells[3]; // Status column
      if (statusCell) {
        const itemStatus = statusCell.textContent.toLowerCase();
        if (filterValue === 'all' || itemStatus.includes(filterValue)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });
  }

  // Modal Management Functions
  showAlert(title, message) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    document.getElementById('alert-modal').classList.add('active');
  }

  closeAlertModal() {
    document.getElementById('alert-modal').classList.remove('active');
  }

  showConfirm(title, message) {
    return new Promise((resolve) => {
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;
      document.getElementById('confirm-modal').classList.add('active');

      // Store the resolve function to be called when user clicks OK or Cancel
      this.confirmResolve = resolve;
    });
  }

  closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    if (this.confirmResolve) {
      this.confirmResolve(false);
      this.confirmResolve = null;
    }
  }

  confirmOk() {
    document.getElementById('confirm-modal').classList.remove('active');
    if (this.confirmResolve) {
      this.confirmResolve(true);
      this.confirmResolve = null;
    }
  }

  showUserDetails(user) {
    const userDetailsContent = document.getElementById('user-details-content');

    // Get user initials for avatar
    const initials = user.username
      ? user.username.charAt(0).toUpperCase()
      : 'U';

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Create beautified user details
    userDetailsContent.innerHTML = `
      <div class="user-details-header">
        <div class="user-avatar">${initials}</div>
        <h4 class="user-name">${user.username || 'Unknown User'}</h4>
        <span class="user-role">${user.role || 'User'}</span>
      </div>
      <div class="user-details-body">
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-id-card user-detail-icon"></i>
            User ID
          </span>
          <span class="user-detail-value id">${user._id || 'N/A'}</span>
        </div>
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-user user-detail-icon"></i>
            Username
          </span>
          <span class="user-detail-value">${user.username || 'N/A'}</span>
        </div>
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-envelope user-detail-icon"></i>
            Email
          </span>
          <span class="user-detail-value">${user.email || 'N/A'}</span>
        </div>
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-phone user-detail-icon"></i>
            Contact
          </span>
          <span class="user-detail-value">${user.contact_info || 'N/A'}</span>
        </div>
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-shield-alt user-detail-icon"></i>
            Role
          </span>
          <span class="user-detail-value">${user.role || 'N/A'}</span>
        </div>
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-calendar-plus user-detail-icon"></i>
            Created
          </span>
          <span class="user-detail-value date">${formatDate(
            user.createdAt
          )}</span>
        </div>
        <div class="user-detail-row">
          <span class="user-detail-label">
            <i class="fas fa-calendar-edit user-detail-icon"></i>
            Updated
          </span>
          <span class="user-detail-value date">${formatDate(
            user.updatedAt
          )}</span>
        </div>
      </div>
    `;

    document.getElementById('user-details-modal').classList.add('active');
  }

  closeUserDetailsModal() {
    document.getElementById('user-details-modal').style.display = 'none';
    this.currentManagedUser = null;
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
  if (adminDashboard) {
    adminDashboard.filterClaims();
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
    adminDashboard.refreshCategories();
  }
}

function refreshClaims() {
  if (adminDashboard) {
    adminDashboard.refreshClaims();
  }
}

function refreshMessages() {
  if (adminDashboard) {
    adminDashboard.refreshMessages();
  }
}

// Initialize dashboard when page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
  adminDashboard = new AdminDashboard();
});
