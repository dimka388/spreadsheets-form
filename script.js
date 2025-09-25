// Configuration
const CONFIG = {
    // Direct Google Apps Script URL (may have CORS issues)
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzzK1haMLCr34L-Iin14Eo6q9etJ2EY6inPPrMlSm1qGDOgAM7uTC4NdaaS67nIZ8ju/exec',
    
    // Server URL for local development and production
    SERVER_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? `${window.location.protocol}//${window.location.host}/api/submit`
        : 'https://your-deployed-server-url.com/api/submit', // Update this when you deploy the server
    
    // Use server as primary method to avoid CORS issues
    // Auto-detect if we're running on localhost with server
    USE_SERVER: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// DOM Elements
const form = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const submitButton = form.querySelector('.submit-button');
const buttonText = submitButton.querySelector('.button-text');
const loadingSpinner = submitButton.querySelector('.loading-spinner');

// Form submission handler
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous messages
    hideMessages();
    
    // Show loading state
    setLoadingState(true);
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        company: formData.get('company') || '',
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };
    
    try {
        let success = false;
        
        if (CONFIG.USE_SERVER) {
            // Try server first
            success = await submitToServer(data);
        } else {
            // Try direct Google Apps Script
            success = await submitToGoogleScript(data);
        }
        
        if (success) {
            showSuccessMessage();
            form.reset();
        } else {
            throw new Error('Submission failed');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage();
    } finally {
        setLoadingState(false);
    }
});

// Submit directly to Google Apps Script
async function submitToGoogleScript(data) {
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // This prevents CORS errors but you won't get response data
        });
        
        // With no-cors mode, we can't read the response
        // We'll assume success if no error is thrown
        return true;
        
    } catch (error) {
        console.error('Google Script submission error:', error);
        
        // If direct submission fails, try alternative method
        return await submitWithFormData(data);
    }
}

// Alternative submission method using form data
async function submitWithFormData(data) {
    try {
        // Create a temporary form for submission
        const tempForm = document.createElement('form');
        tempForm.method = 'POST';
        tempForm.action = CONFIG.GOOGLE_SCRIPT_URL;
        tempForm.target = '_blank';
        tempForm.style.display = 'none';
        
        // Add form fields
        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            tempForm.appendChild(input);
        });
        
        // Submit form
        document.body.appendChild(tempForm);
        tempForm.submit();
        document.body.removeChild(tempForm);
        
        return true;
    } catch (error) {
        console.error('Form data submission error:', error);
        return false;
    }
}

// Submit through server (CORS-free solution)
async function submitToServer(data) {
    try {
        const response = await fetch(CONFIG.SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success;
        
    } catch (error) {
        console.error('Server submission error:', error);
        return false;
    }
}

// UI Helper Functions
function setLoadingState(loading) {
    submitButton.disabled = loading;
    if (loading) {
        submitButton.classList.add('loading');
    } else {
        submitButton.classList.remove('loading');
    }
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function showSuccessMessage() {
    successMessage.style.display = 'block';
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showErrorMessage() {
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Form validation
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#e1e5e9';
        }
    });
    
    return isValid;
}

// Email validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Real-time validation
form.addEventListener('input', function(e) {
    const field = e.target;
    
    if (field.hasAttribute('required') && field.value.trim()) {
        field.style.borderColor = '#28a745';
    } else if (field.hasAttribute('required')) {
        field.style.borderColor = '#e1e5e9';
    }
    
    // Email specific validation
    if (field.type === 'email' && field.value) {
        if (validateEmail(field.value)) {
            field.style.borderColor = '#28a745';
        } else {
            field.style.borderColor = '#dc3545';
        }
    }
});