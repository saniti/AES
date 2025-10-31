// Highlight active navigation item based on current path
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && href !== '#' && currentPath.startsWith(href)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
});
