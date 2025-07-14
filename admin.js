
import { database } from './firebase-config.js';
import { ref, get, update, remove } from 'firebase/database';

// Admin credentials (in production, store these securely)
const ADMIN_CREDENTIALS = {
  'admin': 'admin@trimurti9423'
};

// DOM elements
const adminLoginDiv = document.getElementById('adminLogin');
const adminPanelDiv = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminUsernameInput = document.getElementById('adminUsername');
const adminPasswordInput = document.getElementById('adminPassword');
const loginErrorDiv = document.getElementById('loginError');
const loginErrorMessage = document.getElementById('loginErrorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const residentsData = document.getElementById('residentsData');
const adminResultDiv = document.getElementById('adminResult');
const adminResultTitle = document.getElementById('adminResultTitle');
const adminResultMessage = document.getElementById('adminResultMessage');

// Check if admin is already logged in
function checkAdminSession() {
  const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
  if (isLoggedIn === 'true') {
    showAdminPanel();
  }
}

// Handle admin login
async function handleAdminLogin(e) {
  e.preventDefault();
  
  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value.trim();
  
  // Validate credentials
  if (ADMIN_CREDENTIALS[username] && ADMIN_CREDENTIALS[username] === password) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    showAdminPanel();
    hideLoginError();
  } else {
    showLoginError('Invalid credentials. Access denied.');
  }
}

// Show admin panel
function showAdminPanel() {
  adminLoginDiv.style.display = 'none';
  adminPanelDiv.style.display = 'block';
  logoutBtn.style.display = 'block';
  loadResidents();
}

// Show login error
function showLoginError(message) {
  loginErrorMessage.textContent = message;
  loginErrorDiv.style.display = 'block';
}

// Hide login error
function hideLoginError() {
  loginErrorDiv.style.display = 'none';
}

// Logout function
window.logout = function() {
  sessionStorage.removeItem('adminLoggedIn');
  adminLoginDiv.style.display = 'block';
  adminPanelDiv.style.display = 'none';
  logoutBtn.style.display = 'none';
  adminLoginForm.reset();
  hideLoginError();
}

// Load all residents
window.loadResidents = async function() {
  try {
    const residentsRef = ref(database, 'residents');
    const snapshot = await get(residentsRef);
    
    if (snapshot.exists()) {
      const residents = snapshot.val();
      displayResidents(residents);
    } else {
      residentsData.innerHTML = '<p>No residents found in database.</p>';
    }
  } catch (error) {
    console.error('Error loading residents:', error);
    residentsData.innerHTML = '<p>Error loading residents data.</p>';
  }
}

// Display residents list
function displayResidents(residents) {
  const flatNumbers = Object.keys(residents).sort();
  
  let html = '<div style="margin-bottom: 1rem;"><strong>Total Residents: ' + flatNumbers.length + '</strong></div>';
  
  flatNumbers.forEach(flatNumber => {
    const resident = residents[flatNumber];
    const status = resident.accessed ? 'accessed' : 'unused';
    const statusText = resident.accessed ? 'Password Accessed' : 'Not Accessed';
    const accessTime = resident.accessedAt ? new Date(resident.accessedAt).toLocaleString() : 'Never';
    const forgotPasswordStatus = resident.forgotPasswordUsed ? 'Used' : 'Available';
    const forgotPasswordTime = resident.forgotPasswordUsedAt ? new Date(resident.forgotPasswordUsedAt).toLocaleString() : 'Never';
    
    html += `
      <div class="resident-item">
        <div class="resident-info">
          <strong>Flat ${flatNumber}</strong><br>
          <small>Name: ${resident.name}</small><br>
          <small>Mobile: ${resident.mobile}</small><br>
          <small>Last Access: ${accessTime}</small><br>
          <small>Forget Password: ${forgotPasswordStatus} ${resident.forgotPasswordUsed ? '(' + forgotPasswordTime + ')' : ''}</small>
        </div>
        <div class="resident-actions">
          <span class="status-badge status-${status}">${statusText}</span>
          ${resident.forgotPasswordUsed ? '<span class="status-badge" style="background: #ff7b72; color: white; margin-left: 0.5rem;">Reset Needed</span>' : ''}
          <button class="reset-btn" onclick="resetResidentAccess('${flatNumber}')" 
                  ${!resident.accessed && !resident.forgotPasswordUsed ? 'disabled' : ''}>
            Reset Access
          </button>
        </div>
      </div>
    `;
  });
  
  residentsData.innerHTML = html;
}

// Reset resident access
window.resetResidentAccess = async function(flatNumber) {
  try {
    const residentRef = ref(database, `residents/${flatNumber}`);
    
    // Update resident access status and reset forget password usage
    await update(residentRef, {
      accessed: false,
      accessedAt: null,
      resetAt: Date.now(),
      resetBy: 'admin',
      forgotPasswordUsed: false, // Reset forget password usage
      forgotPasswordUsedAt: null // Clear forget password usage timestamp
    });
    
    // Also clean up any existing one-time links for this resident
    await cleanupOldLinks(flatNumber);
    
    showAdminResult('Access Reset Successful', 
      `Password access has been reset for Flat ${flatNumber}. The resident can now generate a new one-time link.`);
    
    // Reload residents to show updated status
    loadResidents();
    
  } catch (error) {
    console.error('Error resetting resident access:', error);
    showAdminResult('Error', 'Failed to reset access. Please try again.');
  }
}

// Clean up old one-time links for a resident
async function cleanupOldLinks(flatNumber) {
  try {
    const linksRef = ref(database, 'one_time_links');
    const snapshot = await get(linksRef);
    
    if (snapshot.exists()) {
      const links = snapshot.val();
      const promises = [];
      
      Object.keys(links).forEach(token => {
        if (links[token].flatNumber === flatNumber) {
          const linkRef = ref(database, `one_time_links/${token}`);
          promises.push(remove(linkRef));
        }
      });
      
      await Promise.all(promises);
      console.log(`Cleaned up old links for flat ${flatNumber}`);
    }
  } catch (error) {
    console.error('Error cleaning up old links:', error);
  }
}

// Show admin result message
function showAdminResult(title, message) {
  adminResultTitle.textContent = title;
  adminResultMessage.textContent = message;
  adminResultDiv.style.display = 'block';
  
  // Scroll to result
  adminResultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Hide admin result
window.hideAdminResult = function() {
  adminResultDiv.style.display = 'none';
}

// Event listeners
adminLoginForm.addEventListener('submit', handleAdminLogin);

// Check for admin access in URL
function checkAdminURL() {
  const currentURL = window.location.href;
  if (currentURL.endsWith('/admin') || currentURL.includes('/admin?') || currentURL.includes('#admin')) {
    // Already on admin page, no need to redirect
    return true;
  }
  return false;
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
  checkAdminSession();
});

console.log('Admin panel initialized');
