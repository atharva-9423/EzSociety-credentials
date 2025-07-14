
// Install app page functionality

// Check for admin access in URL
function checkAdminURL() {
  const currentURL = window.location.href;
  if (currentURL.endsWith('/admin') || currentURL.includes('/admin?') || currentURL.includes('#admin')) {
    window.location.href = 'admin.html';
    return true;
  }
  return false;
}

// Initialize admin URL check
document.addEventListener('DOMContentLoaded', function() {
  checkAdminURL();
});

console.log('Install app page initialized');
