import { database } from './firebase-config.js';
import { ref, set, get, child, push, remove, update } from 'firebase/database';

// Real password database from the credentials file
const passwordDatabase = {
  // Wing A - Fruits theme
  'A101': 'apple101', 'A102': 'banana102', 'A103': 'cherry103', 'A104': 'orange104',
  'A201': 'mango201', 'A202': 'grape202', 'A203': 'peach203', 'A204': 'lemon204',
  'A301': 'berry301', 'A302': 'melon302', 'A303': 'kiwi303', 'A304': 'plum304',
  'A401': 'lime401', 'A402': 'pear402', 'A403': 'fig403', 'A404': 'date404',

  // Wing B - Colors theme
  'B101': 'blue101', 'B102': 'green102', 'B103': 'red103', 'B104': 'yellow104',
  'B201': 'purple201', 'B202': 'pink202', 'B203': 'orange203', 'B204': 'white204',
  'B301': 'black301', 'B302': 'silver302', 'B303': 'gold303', 'B304': 'brown304',
  'B401': 'gray401', 'B402': 'navy402', 'B403': 'cream403', 'B404': 'coral404',

  // Wing C - Animals theme
  'C101': 'cat101', 'C102': 'dog102', 'C103': 'bird103', 'C104': 'fish104',
  'C201': 'lion201', 'C202': 'tiger202', 'C203': 'bear203', 'C204': 'wolf204',
  'C301': 'eagle301', 'C302': 'owl302', 'C303': 'deer303', 'C304': 'fox304',
  'C401': 'rabbit401', 'C402': 'mouse402', 'C403': 'horse403', 'C404': 'zebra404',

  // Wing D - Nature theme
  'D101': 'sun101', 'D102': 'moon102', 'D103': 'star103', 'D104': 'sky104',
  'D201': 'cloud201', 'D202': 'rain202', 'D203': 'snow203', 'D204': 'wind204',
  'D301': 'earth301', 'D302': 'fire302', 'D303': 'water303', 'D304': 'air304',
  'D401': 'hill401', 'D402': 'river402', 'D403': 'ocean403', 'D404': 'lake404',
  'D501': 'tree501', 'D502': 'flower502', 'D503': 'grass503', 'D504': 'leaf504',
  'D601': 'rock601', 'D602': 'sand602', 'D603': 'stone603', 'D604': 'coral604',

  // Wing E - Objects theme
  'E101': 'book101', 'E102': 'pen102', 'E103': 'paper103', 'E104': 'desk104',
  'E201': 'chair201', 'E202': 'table202', 'E203': 'lamp203', 'E204': 'clock204',
  'E301': 'phone301', 'E302': 'music302', 'E303': 'game303', 'E304': 'movie304',
  'E401': 'coffee401', 'E402': 'tea402', 'E403': 'bread403', 'E404': 'cake404',

  // Wing F - Positive Words theme
  'F101': 'happy101', 'F102': 'smile102', 'F103': 'joy103', 'F104': 'peace104',
  'F201': 'love201', 'F202': 'hope202', 'F203': 'dream203', 'F204': 'wish204',
  'F301': 'light301', 'F302': 'bright302', 'F303': 'shine303', 'F304': 'glow304',
  'F401': 'safe401', 'F402': 'warm402', 'F403': 'cool403', 'F404': 'fresh404',
  'F501': 'clean501', 'F502': 'clear502', 'F503': 'pure503', 'F504': 'soft504',
  'F601': 'sweet601', 'F602': 'nice602', 'F603': 'good603', 'F604': 'best604'
};

// DOM elements
const wingSelect = document.getElementById('wing');
const floorSelect = document.getElementById('floor');
const flatSelect = document.getElementById('flat');
const phoneInput = document.getElementById('phone');
const nameInput = document.getElementById('name');
const form = document.getElementById('passwordForm');
const resultDiv = document.getElementById('result');
const errorDiv = document.getElementById('error');
const passwordLink = document.getElementById('passwordLink');
const errorMessage = document.getElementById('errorMessage');

// Wing configuration
const wingConfig = {
  'A': { floors: 4, flatsPerFloor: 4 },
  'B': { floors: 4, flatsPerFloor: 4 },
  'C': { floors: 4, flatsPerFloor: 4 },
  'D': { floors: 6, flatsPerFloor: 4 },
  'E': { floors: 4, flatsPerFloor: 4 },
  'F': { floors: 6, flatsPerFloor: 4 }
};

// Generate a random token for one-time links
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Update floor options based on selected wing
function updateFloorOptions() {
  const selectedWing = wingSelect.value;
  floorSelect.innerHTML = '<option value="">Select Floor</option>';
  flatSelect.innerHTML = '<option value="">Select Flat</option>';

  if (selectedWing && wingConfig[selectedWing]) {
    const floors = wingConfig[selectedWing].floors;
    for (let i = 1; i <= floors; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Floor ${i}`;
      floorSelect.appendChild(option);
    }
  }
}

// Update flat options based on selected floor
function updateFlatOptions() {
  const selectedWing = wingSelect.value;
  const selectedFloor = floorSelect.value;
  flatSelect.innerHTML = '<option value="">Select Flat</option>';

  if (selectedWing && selectedFloor) {
    const flatsPerFloor = wingConfig[selectedWing].flatsPerFloor;
    for (let i = 1; i <= flatsPerFloor; i++) {
      const flatNumber = `${selectedWing}${selectedFloor}0${i}`;
      const option = document.createElement('option');
      option.value = flatNumber;
      option.textContent = `${selectedWing}-${selectedFloor}0${i}`;
      flatSelect.appendChild(option);
    }
  }
}

// Check if resident has already accessed their password
async function checkResidentAccess(flatNumber, mobile) {
  try {
    // Use once('value') for potentially faster reads
    const residentRef = ref(database, `residents/${flatNumber}`);
    const snapshot = await get(residentRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Check if mobile matches and they have accessed before
      if (data.mobile === mobile && data.accessed) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking resident access:', error);
    return false; // Default to allowing access if check fails
  }
}

// Create one-time link in Firebase
async function createOneTimeLink(flatNumber, mobile, name, password) {
  try {
    const token = generateToken();
    const timestamp = Date.now();

    // Store one-time link data
    const linkRef = ref(database, `one_time_links/${token}`);
    await set(linkRef, {
      flatNumber: flatNumber,
      password: password,
      mobile: mobile,
      name: name,
      createdAt: timestamp,
      used: false
    });

    // Store resident data (but mark as not accessed yet)
    const residentRef = ref(database, `residents/${flatNumber}`);
    await set(residentRef, {
      mobile: mobile,
      name: name,
      password: password,
      accessed: false,
      tokenCreatedAt: timestamp
    });

    return token;
  } catch (error) {
    console.error('Error creating one-time link:', error);
    throw error;
  }
}

// Show loading state
function showLoading() {
  const submitBtn = document.querySelector('.lookup-btn');
  if (submitBtn) {
    submitBtn.innerHTML = `
      <span class="loading-spinner"></span>
      Generating Link...
    `;
    submitBtn.disabled = true;
  }
  hideResults();
}

// Hide loading state
function hideLoading() {
  const submitBtn = document.querySelector('.lookup-btn');
  if (submitBtn) {
    submitBtn.innerHTML = 'Generate One-Time Password Link';
    submitBtn.disabled = false;
  }
}

// Handle form submission
async function handlePasswordLookup(e) {
  e.preventDefault();

  const wing = wingSelect.value;
  const floor = floorSelect.value;
  const flat = flatSelect.value;
  const phone = phoneInput.value.trim();
  const name = nameInput.value.trim();

  // Clear previous results
  hideResults();

  // Validate inputs
  if (!wing || !floor || !flat || !phone || !name) {
    showError('Please fill in all fields.');
    return;
  }

  if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
    showError('Mobile number must be exactly 10 digits.');
    return;
  }

  // Check if flat exists in password database
  if (!passwordDatabase[flat]) {
    showError('Invalid flat selection. Please check your wing, floor, and flat number.');
    return;
  }

  // Show loading animation
  showLoading();

  try {
    // Check if resident has already accessed their password
    const hasAccessed = await checkResidentAccess(flat, phone);
    if (hasAccessed) {
      hideLoading();
      showError('You have already accessed your password. Contact society office if you need it again.');
      return;
    }

    const password = passwordDatabase[flat];

    // Create one-time link
    const token = await createOneTimeLink(flat, phone, name, password);
    const link = `${window.location.origin}/password.html?token=${token}`;

    hideLoading();
    showPasswordLink(link);

  } catch (error) {
    console.error('Error:', error);
    hideLoading();
    showError('An error occurred. Please try again or contact society office.');
  }
}

function showPasswordLink(link) {
  passwordLink.innerHTML = `
    <a href="${link}" target="_blank" class="password-link-btn">
      Click here to view your password
    </a>
    <br><br>
    <small>Link: ${link}</small>
  `;
  resultDiv.style.display = 'block';
  errorDiv.style.display = 'none';

  // Scroll to result
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(message) {
  errorMessage.textContent = message;
  errorDiv.style.display = 'block';
  resultDiv.style.display = 'none';

  // Scroll to error
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideResults() {
  resultDiv.style.display = 'none';
  errorDiv.style.display = 'none';
}

// Global functions for buttons
window.clearResult = function() {
  hideResults();
  if (form) form.reset();
}

window.clearError = function() {
  hideResults();
}

// Event listeners
wingSelect.addEventListener('change', updateFloorOptions);
floorSelect.addEventListener('change', updateFlatOptions);
form.addEventListener('submit', handlePasswordLookup);

// Initialize phone input to only accept numbers
phoneInput.addEventListener('input', function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});

// Initialize name input to only accept letters and spaces
nameInput.addEventListener('input', function(e) {
  this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
});

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

console.log('Password lookup system initialized with Firebase');
console.log('Total flats available:', Object.keys(passwordDatabase).length);