const image = document.getElementById('menu-link');

image.addEventListener('click', () => {
  let subMenu = document.getElementById('Sub-menu-wrap');

  subMenu.classList.toggle('open-menu');
});

document.querySelectorAll('.menu_container a').forEach((link) => {
  link.addEventListener('click', () => {
    let subMenu = document.getElementById('Sub-menu-wrap');

    subMenu.classList.toggle('open-menu');
  });
});

async function handleLoginSuccess(data) {
  localStorage.setItem('token', data.token); // Store token
  window.location.href = 'index.html'; // Redirect
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

  window.location.href = 'login.html';
};

document.querySelector('.logout-btn')?.addEventListener('click', logout);

// Check if user is admin and show admin link
async function checkAdminStatus() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const userData = await response.json();
      if (userData.data.user.role === 'admin') {
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) {
          adminLink.style.display = 'block';
        }
      }
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
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
    // Redirect to login if no token
    window.location.href = 'login.html';
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
    } else {
      // Token is invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    // On error, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
}
