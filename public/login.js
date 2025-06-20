const API_BASE_URL = window.location.origin;

// DOM elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginBtnLoading = document.getElementById('loginBtnLoading');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Check if user is already logged in
// window.addEventListener('DOMContentLoaded', () => {
//   const token = localStorage.getItem('vetToken');
//   const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
//
//   if (token) {
//     if (redirectUrl) {
//       window.location.href = redirectUrl;
//     } else {
//       window.location.href = '/dashboard.html';
//     }
//   } else {
//     // пользователь не залогинен — оставайся на login.html
//     console.log('No token found. Waiting for login...');
//   }
// });

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const email = formData.get('email').trim();
  const password = formData.get('password');

  // Validation
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  // Show loading state
  setLoading(true);
  hideMessages();

  try {

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await response.json();

    if (response.ok && data.success) {

      // Show success message
      showSuccess(`Welcome back, ${data.vet.name}! Redirecting...`);
      // Redirect after a short delay
      setTimeout(() => {
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/dashboard.html';
        }
      }, 1500);
      //
    } else {
      throw new Error(data.message || 'Login failed');
    }

  } catch (error) {
    console.error('Login error:', error);
    showError(error.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
});

// Utility functions
function setLoading(loading) {
  loginBtn.disabled = loading;
  loginBtnText.style.display = loading ? 'none' : 'inline';
  loginBtnLoading.style.display = loading ? 'inline-block' : 'none';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}

// Demo credentials info (remove in production)
console.log(`
🐄 Cow Inspection Service - Demo
================================
To test the login, first register a vet account using:

POST ${API_BASE_URL}/api/auth/register
{
  "email": "vet@example.com",
  "password": "password123",
  "name": "Dr. Example",
  "region": "North",
  "licenseNumber": "VET001"
}

Then use those credentials to login.
        `);
