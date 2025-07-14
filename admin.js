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

// Display residents data
function displayResidents(residents) {
  let html = '';
  let totalResidents = 0;
  let accessedCount = 0;
  let forgotPasswordUsed = 0;
  let passwordResets = 0;

  for (const [flatNumber, data] of Object.entries(residents)) {
    totalResidents++;
    
    // Count accessed residents (viewCount > 0)
    const viewCount = data.viewCount || 0;
    if (viewCount > 0) accessedCount++;
    
    // Count forgot password usage
    if (data.forgotPasswordUsed) forgotPasswordUsed++;
    
    // Count admin resets
    if (data.adminReset) passwordResets++;

    const accessedStatus = viewCount > 0 ? `Yes (${viewCount}/2 views)` : 'No';
    const forgotStatus = data.forgotPasswordUsed ? 'Yes' : 'No';
    const registrationDate = data.createdAt ? new Date(data.createdAt).toLocaleString() : 
                           data.tokenCreatedAt ? new Date(data.tokenCreatedAt).toLocaleString() : 'N/A';
    const accessedDate = data.lastAccessedAt ? new Date(data.lastAccessedAt).toLocaleString() : 
                        data.accessedAt ? new Date(data.accessedAt).toLocaleString() : 'N/A';
    const resetDate = data.resetAt ? new Date(data.resetAt).toLocaleString() : 'N/A';
    const forgotUsedDate = data.forgotPasswordUsedAt ? new Date(data.forgotPasswordUsedAt).toLocaleString() : 'N/A';

    html += `
      <div class="resident-card">
        <div class="card-header">
          <h3><i class="fas fa-home"></i> Flat ${flatNumber}</h3>
          <div class="card-actions">
            <button class="action-btn reset-btn" onclick="resetResidentAccess('${flatNumber}')">
              <i class="fas fa-undo"></i> Reset Views
            </button>
            <button class="action-btn delete-btn" onclick="deleteResident('${flatNumber}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="card-details">
          <p><strong>Name:</strong> ${data.name || 'N/A'}</p>
          <p><strong>Mobile:</strong> ${data.mobile || 'N/A'}</p>
          <p><strong>Password:</strong> ${data.password || 'N/A'}</p>
          <p><strong>Registered:</strong> ${registrationDate}</p>
          <p><strong>Accessed:</strong> ${accessedStatus}</p>
          <p><strong>Last Access:</strong> ${accessedDate}</p>
          <p><strong>Forgot Used:</strong> ${forgotStatus}</p>
          <p><strong>Forgot Used At:</strong> ${forgotUsedDate}</p>
          <p><strong>Last Reset:</strong> ${resetDate}</p>
          <p><strong>Admin Reset:</strong> ${data.adminReset ? 'Yes' : 'No'}</p>
        </div>
      </div>
    `;
  }

  residentsList.innerHTML = html || '<p class="no-data">No residents found</p>';

  // Setup search functionality after rendering residents
  setupResidentsSearch();

  // Update stats
  updateStats(totalResidents, accessedCount, forgotPasswordUsed, passwordResets);
}

// Update statistics
function updateStats(totalResidents, accessedCount, forgotPasswordUsed, passwordResets) {
  const accessRate = totalResidents > 0 ? Math.round((accessedCount / totalResidents) * 100) : 0;
  const forgotRate = totalResidents > 0 ? Math.round((forgotPasswordUsed / totalResidents) * 100) : 0;
  const resetRate = totalResidents > 0 ? Math.round((passwordResets / totalResidents) * 100) : 0;

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
        <p>Forgot Password Used</p>
      </div>
      <div class="stat-card">
        <h3><i class="fas fa-undo"></i> ${passwordResets}</h3>
        <p>Admin Resets</p>
      </div>
      <div class="stat-card">
        <h3><i class="fas fa-chart-line"></i> ${resetRate}%</h3>
        <p>Reset Rate</p>
      </div>
    </div>
  `;
}

// Reset resident access
async function resetResidentAccess(flatNumber) {
  if (!confirm(`Are you sure you want to reset view count for flat ${flatNumber}? This will allow them to view their password 2 more times.`)) {
    return;
  }

  try {
    const residentRef = ref(database, `residents/${flatNumber}`);
    await update(residentRef, {
      viewCount: 0,
      forgotPasswordUsed: false,
      resetAt: Date.now(),
      adminReset: true
    });

    alert('Resident view count reset successfully! They can now view their password 2 more times.');
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

    alert('Resident deleted successfully!');
    loadData();
  } catch (error) {
    console.error('Error deleting resident:', error);
    alert('Error deleting resident. Please try again.');
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

    const residentsSnapshot = await get(residentsRef);

    const exportData = {
      residents: residentsSnapshot.exists() ? residentsSnapshot.val() : {},
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
}

// Make functions global for onclick handlers
window.resetResidentAccess = resetResidentAccess;
window.deleteResident = deleteResident;
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
