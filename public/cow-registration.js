// Get cow ID from URL parameters safely
function getCowIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const cowId = urlParams.get('cowId');
        return cowId && cowId.trim() ? cowId.trim() : '';
    } catch (error) {
        console.error('Error parsing URL parameters:', error);
        return '';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const cowId = getCowIdFromUrl();
    
    // Set cow ID in various places
    const cowIdDisplay = document.getElementById('cowIdDisplay');
    const cowIdMessage = document.getElementById('cowIdMessage');
    const cowIdInput = document.getElementById('cowId');
    const lastInspectionInput = document.getElementById('lastInspection');
    const infoMessage = document.querySelector('.info-message');
    
    // Display cow ID or placeholder text
    const displayText = cowId || 'New Registration';
    if (cowIdDisplay) safeSetTextContent(cowIdDisplay, displayText);
    if (cowIdMessage) safeSetTextContent(cowIdMessage, cowId || 'Not specified');
    
    // Update info message based on whether cow ID was provided
    if (infoMessage) {
        if (cowId) {
            infoMessage.innerHTML = `
                <strong>Cow Not Found:</strong> The cow ID "${sanitizeInput(cowId)}" doesn't exist in our database. 
                Please fill out the form below to register this cow.
            `;
        } else {
            infoMessage.innerHTML = `
                <strong>New Cow Registration:</strong> Fill out the form below to register a new cow in the system.
            `;
        }
    }
    
    // Handle cow ID input field
    if (cowIdInput) {
        cowIdInput.value = sanitizeInput(cowId);
        
        // If no cow ID from URL, make the field editable
        if (!cowId) {
            cowIdInput.removeAttribute('readonly');
            cowIdInput.style.background = '#fff';
            cowIdInput.placeholder = 'Enter cow ID';
            cowIdInput.required = true;
        }
    }
    
    // Set default last inspection date to today
    if (lastInspectionInput) {
        lastInspectionInput.value = getCurrentDate();
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

function initializeEventListeners() {
    // Handle custom breed selection
    const breedSelect = document.getElementById('breed');
    if (breedSelect) {
        breedSelect.addEventListener('change', function(e) {
            const customGroup = document.getElementById('customBreedGroup');
            const customBreedInput = document.getElementById('customBreed');
            
            if (e.target.value === 'Other') {
                if (customGroup) customGroup.style.display = 'block';
                if (customBreedInput) customBreedInput.required = true;
            } else {
                if (customGroup) customGroup.style.display = 'none';
                if (customBreedInput) {
                    customBreedInput.required = false;
                    customBreedInput.value = '';
                }
            }
        });
    }

    // Handle form submission
    const form = document.getElementById('cowRegistrationForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }

    // Form validation on blur
    const requiredFields = document.querySelectorAll('input[required], select[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function validateField(field) {
    if (!field || !field.value) {
        if (field) field.style.borderColor = '#dc3545';
    } else {
        field.style.borderColor = '#ced4da';
    }
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    
    // Disable submit button and show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
    }
    
    try {
        // Collect and validate form data
        const formData = collectFormData();
        
        if (!validateFormData(formData)) {
            throw new Error('Please fill in all required fields correctly');
        }
        
        // Submit the form
        const response = await submitCowRegistration(formData);
        
        if (response.success) {
            showMessage('Cow registered successfully! Redirecting to cow profile...', 'success');
            
            // Redirect to the cow's profile page after 2 seconds
            safeSetTimeout(() => {
                // Safe redirect using location.assign instead of direct assignment
                const redirectUrl = '/cow/' + encodeURIComponent(formData.cowId);
                window.location.assign(redirectUrl);
            }, 2000);
        } else {
            throw new Error(response.message || 'Registration failed');
        }
        
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Cow';
        }
    }
}

function collectFormData() {
    const cowIdInput = document.getElementById('cowId');
    const nameInput = document.getElementById('name');
    const breedSelect = document.getElementById('breed');
    const customBreedInput = document.getElementById('customBreed');
    const ageInput = document.getElementById('age');
    const weightInput = document.getElementById('weight');
    const healthStatusSelect = document.getElementById('healthStatus');
    const lastInspectionInput = document.getElementById('lastInspection');
    const notesTextarea = document.getElementById('notes');
    
    const formData = {
        cowId: cowIdInput ? cowIdInput.value : '',
        name: nameInput ? nameInput.value.trim() : '',
        breed: breedSelect && breedSelect.value === 'Other' 
            ? (customBreedInput ? customBreedInput.value.trim() : '')
            : (breedSelect ? breedSelect.value : ''),
        age: ageInput ? parseFloat(ageInput.value) : 0,
        weight: weightInput ? parseInt(weightInput.value) : 0,
        healthStatus: healthStatusSelect ? healthStatusSelect.value : 'healthy',
        lastInspection: lastInspectionInput ? lastInspectionInput.value : getCurrentDate()
    };

    // Add notes to medical history if provided
    const notes = notesTextarea ? notesTextarea.value.trim() : '';
    if (notes) {
        formData.medicalHistory = [{
            date: new Date(),
            diagnosis: 'Initial registration',
            treatment: notes,
            veterinarian: 'Registration System'
        }];
    }

    return formData;
}

function validateFormData(formData) {
    // Check required fields
    if (!formData.cowId || !formData.name || !formData.breed || 
        !formData.age || !formData.weight || !formData.healthStatus) {
        return false;
    }
    
    // Validate numeric fields
    if (isNaN(formData.age) || formData.age < 0 || formData.age > 30) {
        showMessage('Please enter a valid age between 0 and 30 years', 'error');
        return false;
    }
    
    if (isNaN(formData.weight) || formData.weight < 50 || formData.weight > 2000) {
        showMessage('Please enter a valid weight between 50 and 2000 kg', 'error');
        return false;
    }
    
    return true;
}

async function submitCowRegistration(formData) {
    try {
        const response = await fetch('/api/cow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        return data;
    } catch (error) {
        throw new Error(error.message || 'Network error occurred');
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    
    safeSetTextContent(messageDiv, message);
    messageDiv.className = 'message ' + sanitizeInput(type);
    messageDiv.style.display = 'block';

    // Auto-hide error messages after 5 seconds
    if (type === 'error') {
        safeSetTimeout(() => {
            if (messageDiv) {
                messageDiv.style.display = 'none';
            }
        }, 5000);
    }
}

// Utility function to get current date in YYYY-MM-DD format
function getCurrentDate() {
    try {
        return new Date().toISOString().split('T')[0];
    } catch (error) {
        console.error('Error getting current date:', error);
        return '2025-01-01'; // Fallback date
    }
}

// Safe timeout handler
function safeSetTimeout(callback, delay) {
    try {
        return setTimeout(callback, delay);
    } catch (error) {
        console.error('Error setting timeout:', error);
        // Execute callback immediately if setTimeout fails
        callback();
    }
}

// Input sanitization function
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>'"&]/g, '') // Remove HTML/XML characters
        .trim();
}

// Safe text content setter
function safeSetTextContent(element, text) {
    if (element && typeof text === 'string') {
        element.textContent = sanitizeInput(text);
    }
}

// Export functions for testing (if needed) - CSP compliant
(function() {
    'use strict';
    
    // Feature detection for module exports
    if (typeof module !== 'undefined' && 
        typeof module.exports === 'object' && 
        module.exports) {
        
        module.exports = {
            collectFormData: collectFormData,
            validateFormData: validateFormData,
            submitCowRegistration: submitCowRegistration,
            showMessage: showMessage,
            sanitizeInput: sanitizeInput,
            safeSetTextContent: safeSetTextContent
        };
    }
})();
