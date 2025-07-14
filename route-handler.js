
// Universal admin route handler
// This script should be included on all pages to handle admin URL access

(function() {
  function checkForAdminAccess() {
    const currentURL = window.location.href;
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    
    // Check various admin URL patterns
    const isAdminRequest = 
      currentURL.endsWith('/admin') ||
      currentURL.endsWith('/admin/') ||
      pathname.endsWith('/admin') ||
      hash === '#admin' ||
      search.includes('admin=true') ||
      currentURL.includes('/admin?');
    
    if (isAdminRequest && !pathname.includes('admin.html')) {
      // Redirect to admin panel
      window.location.href = 'admin.html';
      return true;
    }
    
    return false;
  }
  
  // Check immediately when script loads
  checkForAdminAccess();
  
  // Also check when URL changes (for single page apps)
  window.addEventListener('popstate', checkForAdminAccess);
  
  // Listen for hash changes
  window.addEventListener('hashchange', checkForAdminAccess);
})();
