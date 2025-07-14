import { database } from './firebase-config.js';
import { ref, get, set, update } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';

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

// Store or update resident data with view tracking
async function storeResidentData(flatNumber, mobile, name, password) {
  try {
    const timestamp = Date.now();
    const residentRef = ref(database, `residents/${flatNumber}`);

    // Check if resident already exists
    const snapshot = await get(residentRef);

    if (snapshot.exists()) {
      const existingData = snapshot.val();
      // Update existing resident data
      await update(residentRef, {
        mobile: mobile,
        name: name,
        password: password,
        lastAccessedAt: timestamp,
        viewCount: (existingData.viewCount || 0) + 1
      });
    } else {
      // Create new resident data
      const residentData = {
        flatNumber: flatNumber,
        password: password,
        mobile: mobile,
        name: name,
        createdAt: timestamp,
        lastAccessedAt: timestamp,
        viewCount: 1,
        forgotPasswordUsed: false,
        adminReset: false
      };

      await set(residentRef, residentData);
    }

    return true;
  } catch (error) {
    console.error('Error storing resident data:', error);
    throw error;
  }
}

// Check if resident can still view their password
async function checkResidentAccess(flatNumber, mobile) {
  try {
    const residentRef = ref(database, `residents/${flatNumber}`);
    const snapshot = await get(residentRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Check if mobile number matches
      if (data.mobile === mobile) {
        const viewCount = data.viewCount || 0;
        return {
          hasAccess: viewCount < 2,
          viewCount: viewCount,
          canView: viewCount < 2,
          existingData: data
        };
      }
    }
    return {
      hasAccess: true,
      viewCount: 0,
      canView: true,
      existingData: null
    };
  } catch (error) {
    console.error('Error checking resident access:', error);
    return {
      hasAccess: false,
      viewCount: 0,
      canView: false,
      existingData: null
    };
  }
}
// Generate a random token for one-time links
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Update floor options based on selected wing
function updateFloorOptions() {
  const selectedWing = wingSelect.value;
  
  // Clear floor and flat dropdowns
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
    
    // Enable floor dropdown
    floorSelect.disabled = false;
  } else {
    floorSelect.disabled = true;
    flatSelect.disabled = true;
  }
}

// Update flat options based on selected floor
function updateFlatOptions() {
  const selectedWing = wingSelect.value;
  const selectedFloor = floorSelect.value;
  
  // Clear flat dropdown
  flatSelect.innerHTML = '<option value="">Select Flat</option>';

  if (selectedWing && selectedFloor && wingConfig[selectedWing]) {
    const flatsPerFloor = wingConfig[selectedWing].flatsPerFloor;
    for (let i = 1; i <= flatsPerFloor; i++) {
      const flatNumber = `${selectedWing}${selectedFloor}0${i}`;
      const option = document.createElement('option');
      option.value = flatNumber;
      option.textContent = `${selectedWing}-${selectedFloor}0${i}`;
      flatSelect.appendChild(option);
    }
    
    // Enable flat dropdown
    flatSelect.disabled = false;
  } else {
    flatSelect.disabled = true;
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

  // Check if resident can still view their password
  const accessInfo = await checkResidentAccess(flat, phone);

  if (!accessInfo.canView) {
    hideLoading();
    showError(`You have already viewed your password ${accessInfo.viewCount} times. Contact society admin to reset your access.`);
    return;
  }

  const password = passwordDatabase[flat];

  // Store/update resident data and increment view count
  await storeResidentData(flat, phone, name, password);

  hideLoading();
  showPasswordDirect(password, flat, name, phone, accessInfo.viewCount + 1);
}

function showPasswordDirect(password, flatNumber, name, mobile, viewCount) {
  const passwordDisplay = resultDiv.querySelector('.password-display');
  const remainingViews = 2 - viewCount;

  passwordDisplay.innerHTML = `
    <h3>Your Password</h3>
    <div class="password-info">
      <div class="password-value" style="background: #21262d; border: 2px solid #3fb950; border-radius: 8px; padding: 1rem; font-size: 1.5rem; font-weight: bold; color: #3fb950; letter-spacing: 2px; margin: 1rem 0; word-break: break-all;">${password}</div>
      <div class="flat-info" style="background: linear-gradient(145deg, #161b22, #21262d); border: 1px solid #373e47; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
        <p><strong>Flat Number:</strong> ${flatNumber.replace(/^([A-F])(\d+)/, '$1-$2')}</p>
        <p><strong>Resident:</strong> ${name}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Views Used:</strong> ${viewCount} of 2</p>
        <p><strong>Remaining Views:</strong> ${remainingViews}</p>
      </div>
      <p class="warning" style="color: #ff7b72; font-weight: 500; margin: 1.5rem 0; padding: 1rem; background: rgba(255, 123, 114, 0.1); border: 1px solid rgba(255, 123, 114, 0.2); border-radius: 8px;">
        ⚠️ You can only view your password ${remainingViews} more time${remainingViews !== 1 ? 's' : ''}. After that, contact admin to reset your access.
      </p>
      <button onclick="copyPassword('${password}')" class="copy-btn" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #58a6ff, #79c0ff); color: #0d1117; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin: 1rem 0;">
        📋 Copy Password
      </button>
    </div>
  `;

  resultDiv.style.display = 'block';
  errorDiv.style.display = 'none';
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

// Copy password to clipboard
function copyPassword(password) {
  navigator.clipboard.writeText(password).then(() => {
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ Copied!';
      copyBtn.style.background = 'linear-gradient(135deg, #3fb950, #2ea043)';

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = 'linear-gradient(135deg, #58a6ff, #79c0ff)';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy password:', err);
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.textContent = '❌ Copy Failed';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy Password';
      }, 2000);
    }
  });
}

// Make copy function global
window.copyPassword = copyPassword;

// Global functions for buttons
window.clearResult = function() {
  hideResults();
  if (form) form.reset();
}

window.clearError = function() {
  hideResults();
}

// Initialize dropdowns and event listeners after DOM is ready
function initializeDropdowns() {
  // Initialize dropdown states
  if (floorSelect) {
    floorSelect.disabled = true;
  }
  if (flatSelect) {
    flatSelect.disabled = true;
  }

  // Event listeners with immediate execution
  if (wingSelect) {
    wingSelect.addEventListener('change', function(e) {
      console.log('Wing changed to:', e.target.value);
      updateFloorOptions();
    });
  }
  
  if (floorSelect) {
    floorSelect.addEventListener('change', function(e) {
      console.log('Floor changed to:', e.target.value);
      updateFlatOptions();
    });
  }
  
  if (form) {
    form.addEventListener('submit', handlePasswordLookup);
  }

  // Initialize phone input to only accept numbers
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  }

  // Initialize name input to only accept letters and spaces
  if (nameInput) {
    nameInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    });
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize immediately
  initializeDropdowns();
  
  // Wait for skeleton loading to complete
  setTimeout(function() {
    removeSkeletonLoading();
    // Re-initialize to ensure everything is working
    initializeDropdowns();
  }, 1600);
});

// Remove skeleton loading from form elements
function removeSkeletonLoading() {
  const skeletonElements = document.querySelectorAll('.skeleton-loader');
  skeletonElements.forEach(element => {
    element.classList.remove('skeleton-loader');
  });

  // Enable form elements
  const formElements = document.querySelectorAll('select, input, button');
  formElements.forEach(element => {
    element.disabled = false;
  });
}

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

  // Remove skeleton loading and enable form after 1.5 seconds
  setTimeout(removeSkeletonLoading, 1500);
});

console.log('Password lookup system initialized with Firebase');
console.log('Total flats available:', Object.keys(passwordDatabase).length);
