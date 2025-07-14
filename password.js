
import { database } from './firebase-config.js';
import { ref, get, update } from 'firebase/database';

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

// Load and display password
async function loadPassword() {
  const token = getTokenFromURL();
  
  if (!token) {
    showError('Invalid or missing token. Please generate a new password link.');
    return;
  }
  
  try {
    // Get one-time link data
    const linkRef = ref(database, `one_time_links/${token}`);
    const snapshot = await get(linkRef);
    
    if (!snapshot.exists()) {
      showError('Invalid or expired link. Please generate a new password link.');
      return;
    }
    
    const linkData = snapshot.val();
    
    // Check if link has already been used
    if (linkData.used) {
      showError('This link has already been used. Please generate a new password link if needed.');
      return;
    }
    
    // Check if link is older than 24 hours (optional security measure)
    const linkAge = Date.now() - linkData.createdAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (linkAge > maxAge) {
      showError('This link has expired. Please generate a new password link.');
      return;
    }
    
    // Display password
    showPassword(linkData);
    
    // Mark link as used and resident as accessed
    await markAsUsed(token, linkData.flatNumber);
    
  } catch (error) {
    console.error('Error loading password:', error);
    showError('An error occurred while loading your password. Please try again.');
  }
}

// Display the password
function showPassword(linkData) {
  passwordValue.textContent = linkData.password;
  
  // Format flat number as A-101 instead of A101
  const formattedFlatNumber = linkData.flatNumber.replace(/^([A-F])(\d+)/, '$1-$2');
  
  flatInfo.innerHTML = `
    <p><strong>Flat Number:</strong> ${formattedFlatNumber}</p>
    <p><strong>Resident:</strong> ${linkData.name}</p>
    <p><strong>Mobile:</strong> ${linkData.mobile}</p>
  `;
  
  loadingDiv.style.display = 'none';
  passwordDisplayDiv.style.display = 'block';
  errorDisplayDiv.style.display = 'none';
}

// Show error message
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
window.copyPassword = async function() {
  const passwordText = passwordValue.textContent;
  const copyBtn = document.getElementById('copyPasswordBtn');
  
  try {
    await navigator.clipboard.writeText(passwordText);
    
    // Show success feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ Copied!';
    copyBtn.style.background = 'linear-gradient(135deg, #3fb950, #2ea043)';
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.style.background = 'linear-gradient(135deg, #58a6ff, #79c0ff)';
    }, 2000);
    
  } catch (err) {
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
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadPassword);
