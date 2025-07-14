import { database } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';

// DOM elements
const loadingDiv = document.getElementById('loading');
const passwordDisplayDiv = document.getElementById('password-display');
const errorDisplayDiv = document.getElementById('error-display');
const passwordValue = document.getElementById('passwordValue');
const flatInfo = document.getElementById('flatInfo');
const errorMessage = document.getElementById('errorMessage');

// Get token from URL parameters
function getTokenFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Validate and get password from Firebase
async function getPasswordFromToken(token) {
  try {
    const linkRef = ref(database, `one_time_links/${token}`);
    const snapshot = await get(linkRef);

    if (!snapshot.exists()) {
      throw new Error('Invalid or expired link. Please generate a new one.');
    }

    const data = snapshot.val();

    if (data.used) {
      throw new Error('This link has already been used. Please generate a new one if needed.');
    }

    // Check if link is older than 24 hours (optional security measure)
    const now = Date.now();
    const linkAge = now - data.createdAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (linkAge > maxAge) {
      throw new Error('This link has expired. Please generate a new one.');
    }

    return data;
  } catch (error) {
    console.error('Error getting password from token:', error);
    throw error;
  }
}

// Show loading state
function showLoading() {
  loadingDiv.style.display = 'block';
  passwordDisplayDiv.style.display = 'none';
  errorDisplayDiv.style.display = 'none';
}

// Show password
function showPassword(data) {
  passwordValue.textContent = data.password;
  
  // Format flat number as A-101 instead of A101
  const formattedFlatNumber = data.flatNumber.replace(/^([A-F])(\d+)/, '$1-$2');
  
  flatInfo.innerHTML = `
    <p><strong>Flat Number:</strong> ${formattedFlatNumber}</p>
    <p><strong>Resident:</strong> ${data.name}</p>
    <p><strong>Mobile:</strong> ${data.mobile}</p>
  `;

  loadingDiv.style.display = 'none';
  passwordDisplayDiv.style.display = 'block';
  errorDisplayDiv.style.display = 'none';
}

// Show error
function showError(message) {
  errorMessage.textContent = message;

  loadingDiv.style.display = 'none';
  passwordDisplayDiv.style.display = 'none';
  errorDisplayDiv.style.display = 'block';
}

// Mark link as used and resident as accessed
async function markAsUsed(token, flatNumber) {
  try {
    // Mark one-time link as used
    const linkRef = ref(database, `one_time_links/${token}`);
    await update(linkRef, {
      used: true,
      usedAt: Date.now()
    });

    // Mark resident as accessed
    const residentRef = ref(database, `residents/${flatNumber}`);
    await update(residentRef, {
      accessed: true,
      accessedAt: Date.now()
    });

    console.log('Link marked as used successfully');
  } catch (error) {
    console.error('Error marking link as used:', error);
  }
}

// Copy password to clipboard
function copyPassword() {
  const passwordText = passwordValue.textContent;
  const copyBtn = document.getElementById('copyPasswordBtn');
  navigator.clipboard.writeText(passwordText).then(() => {
    // Visual feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    copyBtn.style.background = 'linear-gradient(135deg, #3fb950, #2ea043)';

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = 'linear-gradient(135deg, #58a6ff, #79c0ff)';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy password:', err);
     // Fallback for older browsers
     const textArea = document.createElement('textarea');
     textArea.value = passwordText;
     document.body.appendChild(textArea);
     textArea.focus();
     textArea.select();
     
     try {
       document.execCommand('copy');
       const originalText = copyBtn.innerHTML;
       copyBtn.innerHTML = '✅ Copied!';
       copyBtn.style.background = 'linear-gradient(135deg, #3fb950, #2ea043)';
       
       setTimeout(() => {
         copyBtn.innerHTML = originalText;
         copyBtn.style.background = 'linear-gradient(135deg, #58a6ff, #79c0ff)';
       }, 2000);
     } catch (fallbackErr) {
       copyBtn.innerHTML = '❌ Copy Failed';
       setTimeout(() => {
         copyBtn.innerHTML = '📋 Copy Password';
       }, 2000);
     }
     
     document.body.removeChild(textArea);
  });
}

// Make copy function global
window.copyPassword = copyPassword;

// Initialize page
async function init() {
  showLoading();

  const token = getTokenFromURL();

  if (!token) {
    showError('No token provided. Please use the complete link you received.');
    return;
  }

  try {
    const data = await getPasswordFromToken(token);
    showPassword(data);

    // Mark as used after successful display
    await markAsUsed(token, data.flatNumber);

  } catch (error) {
    showError(error.message || 'An error occurred while retrieving your password.');
  }
}

// Start initialization when page loads
document.addEventListener('DOMContentLoaded', init);

console.log('Password display system initialized');
