
import { database } from './firebase-config.js';
import { ref, get, update, remove, set } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';

// Wing configuration
const wingConfig = {
  'A': { floors: 4, flatsPerFloor: 4 },
  'B': { floors: 4, flatsPerFloor: 4 },
  'C': { floors: 4, flatsPerFloor: 4 },
  'D': { floors: 6, flatsPerFloor: 4 },
  'E': { floors: 4, flatsPerFloor: 4 },
  'F': { floors: 6, flatsPerFloor: 4 }
};

// DOM elements
const wingSelect = document.getElementById('resetWing');
const floorSelect = document.getElementById('resetFloor');
const flatSelect = document.getElementById('resetFlat');
const phoneInput = document.getElementById('resetPhone');
const nameInput = document.getElementById('resetName');
const form = document.getElementById('forgetPasswordForm');
const resultDiv = document.getElementById('resetResult');
const errorDiv = document.getElementById('resetError');
const errorMessage = document.getElementById('resetErrorMessage');

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

// Generate one-time password link
async function generateOneTimeLink(flatNumber, mobile, name, password) {
  try {
    // Generate unique token
    const token = Math.random().toString(36).substr(2, 10) + Date.now().toString(36);
    const timestamp = Date.now();

    // Create one-time link data
    const linkData = {
      flatNumber: flatNumber,
      password: password,
      mobile: mobile,
      name: name,
      createdAt: timestamp,
      used: false
    };

    // Store one-time link data
    const linkRef = ref(database, `one_time_links/${token}`);
    await set(linkRef, linkData);

    return token;
  } catch (error) {
    console.error('Error creating one-time link:', error);
    throw error;
  }
}

// Reset resident access and generate new link
async function resetResidentAccess(flatNumber, mobile, name) {
  try {
    // Check if resident exists (must be registered first)
    const residentRef = ref(database, `residents/${flatNumber}`);
    const snapshot = await get(residentRef);

    if (!snapshot.exists()) {
      throw new Error('No password link has been generated for this flat number. You must generate a password link first before you can reset it.');
    }

    const data = snapshot.val();

    // Verify mobile number matches exactly
    if (data.mobile !== mobile) {
      throw new Error('Mobile number does not match the registered mobile number for this flat.');
    }

    // Verify name matches (case insensitive)
    if (data.name.toLowerCase() !== name.toLowerCase()) {
      throw new Error('Resident name does not match the registered name for this flat.');
    }

    // Only allow reset if they have accessed before (i.e., truly registered)
    if (!data.accessed && !data.tokenCreatedAt) {
      throw new Error('You must first generate and use a password link before you can reset it.');
    }

    // Check if user has already used the forget password option
    if (data.forgotPasswordUsed) {
      throw new Error('You have already used the forget password option once. Please contact the society admin to reset your access again.');
    }

    // Reset resident access - keep original data but mark as not accessed and track forget password usage
    await update(residentRef, {
      mobile: data.mobile,
      name: data.name,
      password: data.password,
      accessed: false,
      resetAt: Date.now(),
      forgotPasswordUsed: true, // Mark that forget password has been used
      forgotPasswordUsedAt: Date.now(), // Track when it was used
      tokenCreatedAt: data.tokenCreatedAt // Preserve original registration time
    });

    // Remove any existing one-time links for this resident
    const linksRef = ref(database, 'one_time_links');
    const linksSnapshot = await get(linksRef);

    if (linksSnapshot.exists()) {
      const links = linksSnapshot.val();
      const promises = [];

      for (const [token, linkData] of Object.entries(links)) {
        if (linkData.flatNumber === flatNumber && linkData.mobile === mobile) {
          promises.push(remove(ref(database, `one_time_links/${token}`)));
        }
      }

      await Promise.all(promises);
    }

    // Generate new one-time link
    const newToken = await generateOneTimeLink(flatNumber, mobile, name, data.password);
    const passwordLink = `${window.location.origin}/password.html?token=${newToken}`;

    console.log('Resident access reset and new link generated');
    return passwordLink;
  } catch (error) {
    console.error('Error resetting resident access:', error);
    throw error;
  }
}

// Show loading state
function showLoading() {
  const submitBtn = document.querySelector('.forget-btn');
  if (submitBtn) {
    submitBtn.innerHTML = `
      <span class="loading-spinner"></span>
      Generating New Link...
    `;
    submitBtn.disabled = true;
  }
  hideResults();
}

// Hide loading state
function hideLoading() {
  const submitBtn = document.querySelector('.forget-btn');
  if (submitBtn) {
    submitBtn.innerHTML = 'Generate New Password Link';
    submitBtn.disabled = false;
  }
}

// Handle form submission
async function handleForgetPassword(e) {
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
    // Check if resident exists in database
    const residentRef = ref(database, `residents/${flat}`);
    const snapshot = await get(residentRef);

    if (!snapshot.exists()) {
      hideLoading();
      showError('No record found for this flat. Please generate your first password link from the main page.');
      return;
    }

    const residentData = snapshot.val();

    // Verify mobile number and name
    if (residentData.mobile !== phone || residentData.name.toLowerCase() !== name.toLowerCase()) {
      hideLoading();
      showError('Mobile number or name does not match our records.');
      return;
    }

    // Check if forget password has already been used
    if (residentData.forgotPasswordUsed) {
      hideLoading();
      showError('You have already used the forget password option. Please contact the society admin to reset your access.');
      return;
    }

    // Reset resident access and generate new link
    const newLink = await resetResidentAccess(flat, phone, name);
    hideLoading();
    showPasswordLink(newLink);

  } catch (error) {
    console.error('Error:', error);
    hideLoading();
    showError('An error occurred. Please try again or contact society office.');
  }
}

function showPasswordLink(link) {
  // Update the result div content to show the password link
  const passwordDisplay = resultDiv.querySelector('.password-display');
  passwordDisplay.innerHTML = `
    <h3>Password Access Reset Successfully!</h3>
    <div class="link-display">
      <p>Your new one-time password link has been created. Click the link below to view your password:</p>
      <div style="margin: 1rem 0; padding: 1rem; background: #21262d; border: 1px solid #30363d; border-radius: 8px; word-break: break-all; color: #e6edf3; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; font-size: 0.9rem;">
        <a href="${link}" target="_blank" style="display: inline-block; padding: 1rem 2rem; background: linear-gradient(135deg, #3fb950, #2ea043); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0.5rem 0; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(63, 185, 80, 0.3);">
          Click here to view your password
        </a>
        <br><br>
        <small>Link: ${link}</small>
      </div>
      <p style="color: #ff7b72; font-weight: 500; margin: 1rem 0; padding: 1rem; background: rgba(255, 123, 114, 0.1); border: 1px solid rgba(255, 123, 114, 0.2); border-radius: 8px;">⚠️ This link can only be used ONCE. Save your password when you click the link.</p>
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
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideResults() {
  resultDiv.style.display = 'none';
  errorDiv.style.display = 'none';
}

// Global functions for buttons
window.clearResetError = function() {
  hideResults();
}

// Initialize dropdowns and event listeners after DOM is ready
function initializeDropdowns() {
  // Event listeners
  if (wingSelect) wingSelect.addEventListener('change', updateFloorOptions);
  if (floorSelect) floorSelect.addEventListener('change', updateFlatOptions);
  if (form) form.addEventListener('submit', handleForgetPassword);

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
  // Wait for skeleton loading to complete
  setTimeout(initializeDropdowns, 1600);
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Remove skeleton loading and enable form after 1.5 seconds
  setTimeout(removeSkeletonLoading, 1500);
});

console.log('Forget password system initialized');
