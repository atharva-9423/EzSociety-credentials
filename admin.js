
import { database } from './firebase-config.js';
import { ref, get, set, remove, update } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';

// DOM elements
const residentsList = document.getElementById('residents-list');
const linksList = document.getElementById('links-list');
const refreshBtn = document.getElementById('refresh-btn');
const clearDataBtn = document.getElementById('clear-data-btn');
const exportBtn = document.getElementById('export-btn');
const statsDiv = document.getElementById('stats');

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
        <div class="resident-header">
          <h3>Flat ${flatNumber}</h3>
          <div class="resident-actions">
            <button class="action-btn reset-btn" onclick="resetResidentAccess('${flatNumber}')">
              <i class="fas fa-undo"></i> Reset Access
            </button>
            <button class="action-btn delete-btn" onclick="deleteResident('${flatNumber}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="resident-details">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Mobile:</strong> ${data.mobile}</p>
          <p><strong>Password:</strong> ${data.password}</p>
          <p><strong>Registered:</strong> ${registrationDate}</p>
          <p><strong>Password Accessed:</strong> ${accessedStatus}</p>
          <p><strong>Last Accessed:</strong> ${accessedDate}</p>
          <p><strong>Forget Password Used:</strong> ${forgotStatus}</p>
          <p><strong>Last Reset:</strong> ${resetDate}</p>
        </div>
      </div>
    `;
  }

  residentsList.innerHTML = html;
  
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
        <div class="link-header">
          <h4>Token: ${token.substring(0, 20)}...</h4>
          <div class="link-actions">
            <span class="status ${statusClass}">${status}</span>
            <button class="action-btn delete-btn" onclick="deleteLink('${token}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="link-details">
          <p><strong>Flat:</strong> ${data.flatNumber}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Mobile:</strong> ${data.mobile}</p>
          <p><strong>Created:</strong> ${createdDate}</p>
          <p><strong>Used:</strong> ${usedDate}</p>
        </div>
      </div>
    `;
  }

  linksList.innerHTML = html;
}

// Update statistics
function updateStats(totalResidents, accessedCount, forgotPasswordUsed) {
  const accessRate = totalResidents > 0 ? Math.round((accessedCount / totalResidents) * 100) : 0;
  const forgotRate = totalResidents > 0 ? Math.round((forgotPasswordUsed / totalResidents) * 100) : 0;

  statsDiv.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>${totalResidents}</h3>
        <p>Total Residents</p>
      </div>
      <div class="stat-card">
        <h3>${accessedCount}</h3>
        <p>Accessed Passwords</p>
      </div>
      <div class="stat-card">
        <h3>${accessRate}%</h3>
        <p>Access Rate</p>
      </div>
      <div class="stat-card">
        <h3>${forgotPasswordUsed}</h3>
        <p>Forgot Password Used</p>
      </div>
      <div class="stat-card">
        <h3>${forgotRate}%</h3>
        <p>Forgot Password Rate</p>
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

// Event listeners
refreshBtn.addEventListener('click', loadData);
clearDataBtn.addEventListener('click', clearAllData);
exportBtn.addEventListener('click', exportData);

// Load data on page load
document.addEventListener('DOMContentLoaded', loadData);

console.log('Admin system initialized');
