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
  localStorage.setItem('jwt', data.token); // Store token
  window.location.href = 'index.html'; // Redirect
}

const logout = async () => {
  localStorage.removeItem('jwt'); // Clear token
  await fetch('/api/v1/auth/logout', { method: 'POST' }); // Optional: Backend cleanup
  window.location.href = 'login.html';
};

document.querySelector('.logout-btn')?.addEventListener('click', logout);
