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
