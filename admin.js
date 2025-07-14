
import { database } from './firebase-config.js';
import { ref, get, set, remove, update } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';

// Admin credentials (you can change these)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin@trimurti9423';

// DOM elements
const adminLogin = document.getElementById('adminLogin');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('loginError');
const loginErrorMessage = document.getElementById('loginErrorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const residentsList = document.getElementById('residents-list');
const linksList = document.getElementById('links-list');
const refreshBtn = document.getElementById('refresh-btn');
const clearDataBtn = document.getElementById('clear-data-btn');
const exportBtn = document.getElementById('export-btn');
const statsDiv = document.getElementById('stats');

// Check if user is already logged in
function checkLoginStatus() {
  const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
  if (isLoggedIn) {
    showAdminPanel();
  } else {
    showLoginForm();
  }
}

// Show admin panel
function showAdminPanel() {
  adminLogin.style.display = 'none';
  adminPanel.style.display = 'block';
  logoutBtn.style.display = 'block';
  loadData();
}

// Show login form
function showLoginForm() {
  adminLogin.style.display = 'block';
  adminPanel.style.display = 'none';
  logoutBtn.style.display = 'none';
  loginError.style.display = 'none';
}

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    showAdminPanel();
  } else {
    loginErrorMessage.textContent = 'Invalid username or password';
    loginError.style.display = 'block';
  }
}

// Handle logout
function logout() {
  sessionStorage.removeItem('adminLoggedIn');
  showLoginForm();
  // Clear form
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
}

// Make logout function global
window.logout = logout;

// Load and display residents data
async function loadResidents() {
  try {
    const residentsRef = ref(database, 'residents');
    const snapshot = await get(residentsRef);

    if (snapshot.exists()) {
      const residents = snapshot.val();
      displayResidents(residents);
    } else {
      residentsList.innerHTML = '<p class="no-data">No residents found.</p>';
    }
  } catch (error) {
    console.error('Error loading residents:', error);
    residentsList.innerHTML = '<p class="error">Error loading residents data.</p>';
  }
}

// Load and display one-time links data
async function loadOneTimeLinks() {
  try {
    const linksRef = ref(database, 'one_time_links');
    const snapshot = await get(linksRef);

    if (snapshot.exists()) {
      const links = snapshot.val();
      displayOneTimeLinks(links);
    } else {
      linksList.innerHTML = '<p class="no-data">No one-time links found.</p>';
    }
  } catch (error) {
    console.error('Error loading one-time links:', error);
    linksList.innerHTML = '<p class="error">Error loading one-time links data.</p>';
  }
}

// Display residents data
function displayResidents(residents) {
  let html = '';
  let totalResidents = 0;
  let accessedCount = 0;
  let forgotPasswordUsed = 0;

  for (const [flatNumber, data] of Object.entries(residents)) {
    totalResidents++;
    if (data.accessed) accessedCount++;
    if (data.forgotPasswordUsed) forgotPasswordUsed++;

    const accessedStatus = data.accessed ? 'Yes' : 'No';
    const forgotStatus = data.forgotPasswordUsed ? 'Yes' : 'No';
    const registrationDate = data.tokenCreatedAt ? new Date(data.tokenCreatedAt).toLocaleString() : 'N/A';
    const accessedDate = data.accessedAt ? new Date(data.accessedAt).toLocaleString() : 'N/A';
    const resetDate = data.resetAt ? new Date(data.resetAt).toLocaleString() : 'N/A';

    html += `
      <div class="resident-card">
        <div class="card-header">
          <h3><i class="fas fa-home"></i> Flat ${flatNumber}</h3>
          <div class="card-actions">
            <button class="action-btn reset-btn" onclick="resetResidentAccess('${flatNumber}')">
              <i class="fas fa-undo"></i> Reset
            </button>
            <button class="action-btn delete-btn" onclick="deleteResident('${flatNumber}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="card-details">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Mobile:</strong> ${data.mobile}</p>
          <p><strong>Password:</strong> ${data.password}</p>
          <p><strong>Registered:</strong> ${registrationDate}</p>
          <p><strong>Accessed:</strong> ${accessedStatus}</p>
          <p><strong>Last Access:</strong> ${accessedDate}</p>
          <p><strong>Forgot Used:</strong> ${forgotStatus}</p>
          <p><strong>Last Reset:</strong> ${resetDate}</p>
        </div>
      </div>
    `;
  }

  residentsList.innerHTML = html || '<p class="no-data">No residents found</p>';
  
  // Setup search functionality after rendering residents
  setupResidentsSearch();
  
  // Update stats
  updateStats(totalResidents, accessedCount, forgotPasswordUsed);
}

// Display one-time links data
function displayOneTimeLinks(links) {
  let html = '';
  let activeLinks = 0;
  let usedLinks = 0;

  for (const [token, data] of Object.entries(links)) {
    if (data.used) {
      usedLinks++;
    } else {
      activeLinks++;
    }

    const status = data.used ? 'Used' : 'Active';
    const statusClass = data.used ? 'status-used' : 'status-active';
    const createdDate = new Date(data.createdAt).toLocaleString();
    const usedDate = data.usedAt ? new Date(data.usedAt).toLocaleString() : 'N/A';

    html += `
      <div class="link-card">
        <div class="card-header">
          <h4><i class="fas fa-link"></i> ${token.substring(0, 15)}...</h4>
          <div class="card-actions">
            <span class="status ${statusClass}">${status}</span>
            <button class="action-btn delete-btn" onclick="deleteLink('${token}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="card-details">
          <p><strong>Flat:</strong> ${data.flatNumber}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Mobile:</strong> ${data.mobile}</p>
          <p><strong>Created:</strong> ${createdDate}</p>
          <p><strong>Used:</strong> ${usedDate}</p>
        </div>
      </div>
    `;
  }

  linksList.innerHTML = html || '<p class="no-data">No one-time links found</p>';
}

// Update statistics
function updateStats(totalResidents, accessedCount, forgotPasswordUsed) {
  const accessRate = totalResidents > 0 ? Math.round((accessedCount / totalResidents) * 100) : 0;
  const forgotRate = totalResidents > 0 ? Math.round((forgotPasswordUsed / totalResidents) * 100) : 0;

  statsDiv.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3><i class="fas fa-users"></i> ${totalResidents}</h3>
        <p>Total Residents</p>
      </div>
      <div class="stat-card">
        <h3><i class="fas fa-check-circle"></i> ${accessedCount}</h3>
        <p>Passwords Accessed</p>
      </div>
      <div class="stat-card">
        <h3><i class="fas fa-percentage"></i> ${accessRate}%</h3>
        <p>Access Rate</p>
      </div>
      <div class="stat-card">
        <h3><i class="fas fa-key"></i> ${forgotPasswordUsed}</h3>
        <p>Password Resets</p>
      </div>
      <div class="stat-card">
        <h3><i class="fas fa-chart-line"></i> ${forgotRate}%</h3>
        <p>Reset Rate</p>
      </div>
    </div>
  `;
}

// Reset resident access
async function resetResidentAccess(flatNumber) {
  if (!confirm(`Are you sure you want to reset access for flat ${flatNumber}? This will allow them to generate a new password link.`)) {
    return;
  }

  try {
    const residentRef = ref(database, `residents/${flatNumber}`);
    await update(residentRef, {
      accessed: false,
      forgotPasswordUsed: false,
      resetAt: Date.now(),
      adminReset: true
    });

    // Remove any existing one-time links for this resident
    const linksRef = ref(database, 'one_time_links');
    const linksSnapshot = await get(linksRef);

    if (linksSnapshot.exists()) {
      const links = linksSnapshot.val();
      const promises = [];

      for (const [token, linkData] of Object.entries(links)) {
        if (linkData.flatNumber === flatNumber) {
          promises.push(remove(ref(database, `one_time_links/${token}`)));
        }
      }

      await Promise.all(promises);
    }

    alert('Resident access reset successfully!');
    loadData();
  } catch (error) {
    console.error('Error resetting resident access:', error);
    alert('Error resetting resident access. Please try again.');
  }
}

// Delete resident
async function deleteResident(flatNumber) {
  if (!confirm(`Are you sure you want to delete resident data for flat ${flatNumber}? This action cannot be undone.`)) {
    return;
  }

  try {
    // Delete resident data
    const residentRef = ref(database, `residents/${flatNumber}`);
    await remove(residentRef);

    // Delete associated one-time links
    const linksRef = ref(database, 'one_time_links');
    const linksSnapshot = await get(linksRef);

    if (linksSnapshot.exists()) {
      const links = linksSnapshot.val();
      const promises = [];

      for (const [token, linkData] of Object.entries(links)) {
        if (linkData.flatNumber === flatNumber) {
          promises.push(remove(ref(database, `one_time_links/${token}`)));
        }
      }

      await Promise.all(promises);
    }

    alert('Resident deleted successfully!');
    loadData();
  } catch (error) {
    console.error('Error deleting resident:', error);
    alert('Error deleting resident. Please try again.');
  }
}

// Delete one-time link
async function deleteLink(token) {
  if (!confirm('Are you sure you want to delete this one-time link?')) {
    return;
  }

  try {
    const linkRef = ref(database, `one_time_links/${token}`);
    await remove(linkRef);

    alert('One-time link deleted successfully!');
    loadData();
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Error deleting link. Please try again.');
  }
}

// Clear all data
async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone and will delete all residents and one-time links.')) {
    return;
  }

  if (!confirm('This will permanently delete all data. Are you absolutely sure?')) {
    return;
  }

  try {
    // Clear residents data
    const residentsRef = ref(database, 'residents');
    await remove(residentsRef);

    // Clear one-time links data
    const linksRef = ref(database, 'one_time_links');
    await remove(linksRef);

    alert('All data cleared successfully!');
    loadData();
  } catch (error) {
    console.error('Error clearing data:', error);
    alert('Error clearing data. Please try again.');
  }
}

// Export data
async function exportData() {
  try {
    const residentsRef = ref(database, 'residents');
    const linksRef = ref(database, 'one_time_links');
    
    const [residentsSnapshot, linksSnapshot] = await Promise.all([
      get(residentsRef),
      get(linksRef)
    ]);

    const exportData = {
      residents: residentsSnapshot.exists() ? residentsSnapshot.val() : {},
      one_time_links: linksSnapshot.exists() ? linksSnapshot.val() : {},
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `residents-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
}

// Load all data
function loadData() {
  loadResidents();
  loadOneTimeLinks();
}

// Make functions global for onclick handlers
window.resetResidentAccess = resetResidentAccess;
window.deleteResident = deleteResident;
window.deleteLink = deleteLink;
window.clearAllData = clearAllData;
window.exportData = exportData;

// Search functionality for residents
function setupResidentsSearch() {
  const searchInput = document.getElementById('residentsSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      const residentCards = document.querySelectorAll('.resident-card');
      
      residentCards.forEach(card => {
        const flatNumberElement = card.querySelector('.card-header h3');
        if (flatNumberElement) {
          const flatNumber = flatNumberElement.textContent.toLowerCase();
          if (flatNumber.includes(searchTerm)) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        }
      });
    });
  }
}

// Event listeners
loginForm.addEventListener('submit', handleLogin);
refreshBtn.addEventListener('click', loadData);
clearDataBtn.addEventListener('click', clearAllData);
exportBtn.addEventListener('click', exportData);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  checkLoginStatus();
});

console.log('Admin system initialized');
