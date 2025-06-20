
// const API_BASE_URL = window.location.origin;
const API_BASE_URL = window.location.origin;

// DOM elements
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const registerBtnText = document.getElementById('registerBtnText');
const registerBtnLoading = document.getElementById('registerBtnLoading');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Handle form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(registerForm);
  const name = formData.get('name').trim();
  const email = formData.get('email').trim();
  const region = formData.get('region');
  const licenseNumber = formData.get('licenseNumber').trim();
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  // Validation
  if (!name || !email || !region || !licenseNumber || !password || !confirmPassword) {
    showError('Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }

  // Show loading state
  setLoading(true);
  hideMessages();

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        region,
        licenseNumber,
        password
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store token and user info
      localStorage.setItem('vetToken', data.token);
      localStorage.setItem('vetInfo', JSON.stringify(data.vet));

      // Show success message
      showSuccess(`Account created successfully! Welcome, ${data.vet.name}. Redirecting...`);

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);

    } else {
      throw new Error(data.message || 'Registration failed');
    }

  } catch (error) {
    console.error('Registration error:', error);
    showError(error.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
});

// Password confirmation validation
document.getElementById('confirmPassword').addEventListener('input', function () {
  const password = document.getElementById('password').value;
  const confirmPassword = this.value;

  if (confirmPassword && password !== confirmPassword) {
    this.style.borderColor = '#c62828';
  } else {
    this.style.borderColor = '#e1e1e1';
  }
});

// Utility functions
function setLoading(loading) {
  registerBtn.disabled = loading;
  registerBtnText.style.display = loading ? 'none' : 'inline';
  registerBtnLoading.style.display = loading ? 'inline-block' : 'none';
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
