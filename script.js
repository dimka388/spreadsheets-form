// Configuration
const CONFIG = {
    // Get Google Apps Script URL from localStorage or use default
    get GOOGLE_SCRIPT_URL() {
        return localStorage.getItem('googleScriptUrl') || '';
    },
    
    // Set Google Apps Script URL in localStorage
    set GOOGLE_SCRIPT_URL(url) {
        localStorage.setItem('googleScriptUrl', url);
    },
    
    // Server URLs
    get SERVER_URL() {
        // Auto-detect server URL based on current location
        const { protocol, hostname, port } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${port || 3000}/api/submit`;
        }
        // For production, check if server URL is configured
        const savedServerUrl = localStorage.getItem('serverUrl');
        if (savedServerUrl) {
            return savedServerUrl.endsWith('/api/submit') ? savedServerUrl : `${savedServerUrl}/api/submit`;
        }
        return '';
    },
    
    // Set server URL
    set SERVER_URL(url) {
        localStorage.setItem('serverUrl', url);
    },
    
    get TEST_URL() {
        const { protocol, hostname, port } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${port || 3000}/api/test-connection`;
        }
        return localStorage.getItem('serverUrl')?.replace('/api/submit', '/api/test-connection') || '';
    },
    
    // Auto-detect if server is available
    get USE_SERVER() {
        const { hostname } = window.location;
        return hostname === 'localhost' || hostname === '127.0.0.1' || localStorage.getItem('useServer') === 'true';
    }
};

// DOM Elements
const form = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const configNotice = document.getElementById('configNotice');
const submitButton = form.querySelector('.submit-button');
const buttonText = submitButton.querySelector('.button-text');
const loadingSpinner = submitButton.querySelector('.loading-spinner');

// Modal elements
const configModal = document.getElementById('configModal');
const configBtn = document.getElementById('configBtn');
const closeModal = document.getElementById('closeModal');
const scriptUrlInput = document.getElementById('scriptUrl');
const serverUrlInput = document.getElementById('serverUrl');
const saveConfigBtn = document.getElementById('saveConfig');
const testConfigBtn = document.getElementById('testConfig');

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
        // Check if Google Apps Script URL is configured
        if (!CONFIG.GOOGLE_SCRIPT_URL) {
            showConfigNotice();
            return;
        }
        
        let success = false;
        
        if (CONFIG.USE_SERVER && CONFIG.SERVER_URL) {
            console.log('Using server for form submission');
            success = await submitViaServer(data);
        } else {
            console.log('Using direct Google Apps Script submission');
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
    console.log('Submitting data to Google Apps Script:', data);
    console.log('Using URL:', CONFIG.GOOGLE_SCRIPT_URL);
    
    try {
        // First try with CORS mode to get actual response
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'cors' // Try CORS first to get response
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Success response:', result);
            return result.success !== false;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.warn('CORS request failed, trying no-cors mode:', error.message);
        
        // Fallback to no-cors mode
        try {
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                mode: 'no-cors' // This prevents CORS errors but you won't get response data
            });
            
            console.log('No-cors request sent, assuming success');
            return true;
            
        } catch (noCorsError) {
            console.error('No-cors request also failed:', noCorsError);
            
            // If both methods fail, try form data submission
            return await submitWithFormData(data);
        }
    }
}

// Alternative submission method using form data
async function submitWithFormData(data) {
    console.log('Trying form data submission method...');
    
    try {
        // Create form data
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        // Try fetch with form data first
        try {
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });
            
            console.log('Form data fetch completed');
            return true;
            
        } catch (fetchError) {
            console.warn('Form data fetch failed, trying HTML form submission:', fetchError);
            
            // Fallback to HTML form submission
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
            
            console.log('HTML form submitted');
            return true;
        }
        
    } catch (error) {
        console.error('All form data submission methods failed:', error);
        return false;
    }
}

// Submit via server (CORS-free solution)
async function submitViaServer(data) {
    console.log('Submitting via server to:', CONFIG.SERVER_URL);
    
    try {
        // Include the Google Apps Script URL in the request
        const requestData = {
            ...data,
            scriptUrl: CONFIG.GOOGLE_SCRIPT_URL
        };
        
        const response = await fetch(CONFIG.SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        return result.success;
        
    } catch (error) {
        console.error('Server submission error:', error);
        
        // Fallback to direct submission if server fails
        console.log('Server failed, trying direct submission...');
        return await submitToGoogleScript(data);
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
    configNotice.style.display = 'none';
}

function showSuccessMessage() {
    hideMessages();
    successMessage.style.display = 'block';
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showErrorMessage() {
    hideMessages();
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showConfigNotice() {
    hideMessages();
    configNotice.style.display = 'block';
    configNotice.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Automatically open config modal after showing notice
    setTimeout(() => openConfigModal(), 1000);
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

// Configuration Modal Functions
function openConfigModal() {
    // Load current URLs if exist
    scriptUrlInput.value = CONFIG.GOOGLE_SCRIPT_URL || '';
    serverUrlInput.value = localStorage.getItem('serverUrl') || '';
    configModal.style.display = 'block';
    scriptUrlInput.focus();
}

function closeConfigModal() {
    configModal.style.display = 'none';
}

function saveConfiguration() {
    const scriptUrl = scriptUrlInput.value.trim();
    const serverUrl = serverUrlInput.value.trim();
    
    if (!scriptUrl) {
        alert('Please enter a Google Apps Script URL');
        return;
    }
    
    if (!isValidGoogleScriptUrl(scriptUrl)) {
        alert('Please enter a valid Google Apps Script URL. It should end with "/exec"');
        return;
    }
    
    // Validate server URL if provided
    if (serverUrl && !isValidServerUrl(serverUrl)) {
        alert('Please enter a valid server URL (should start with http:// or https://)');
        return;
    }
    
    // Save to localStorage
    CONFIG.GOOGLE_SCRIPT_URL = scriptUrl;
    if (serverUrl) {
        CONFIG.SERVER_URL = serverUrl;
        localStorage.setItem('useServer', 'true');
    } else {
        localStorage.removeItem('serverUrl');
        localStorage.setItem('useServer', 'false');
    }
    
    closeConfigModal();
    
    const message = serverUrl 
        ? '✅ Configuration saved! Forms will be submitted via your server for better reliability.'
        : '✅ Configuration saved! Forms will be submitted directly to Google Apps Script.';
    
    showMessage(message, 'success');
}

async function testConfiguration() {
    const url = scriptUrlInput.value.trim();
    
    if (!url) {
        alert('Please enter a Google Apps Script URL first');
        return;
    }
    
    if (!isValidGoogleScriptUrl(url)) {
        alert('Please enter a valid Google Apps Script URL. It should end with "/exec"');
        return;
    }
    
    // Show loading state
    testConfigBtn.disabled = true;
    testConfigBtn.textContent = 'Testing...';
    
    try {
        console.log('Testing Google Apps Script URL:', url);
        
        // Use server for testing if available
        if (CONFIG.USE_SERVER && CONFIG.TEST_URL) {
            console.log('Testing via server:', CONFIG.TEST_URL);
            
            const response = await fetch(CONFIG.TEST_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ scriptUrl: url })
            });
            
            const result = await response.json();
            console.log('Server test result:', result);
            
            if (result.success) {
                showMessage('✅ Connection test successful via server! The script is working properly.', 'success');
            } else {
                showMessage(`⚠️ Server test failed: ${result.error}`, 'warning');
            }
            
        } else {
            // Direct test (may have CORS issues)
            console.log('Testing direct connection...');
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Direct test result:', result);
                
                if (result.status === 'OK') {
                    showMessage('✅ Direct connection test successful! The script is running properly.', 'success');
                } else {
                    showMessage('⚠️ Connected but got unexpected response. Check the console for details.', 'warning');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
    } catch (corsError) {
        console.warn('Direct test failed, trying no-cors fallback:', corsError.message);
        
        try {
            // Fallback to no-cors test
            await fetch(url, {
                method: 'GET',
                mode: 'no-cors'
            });
            
            showMessage('⚠️ Connection seems OK, but CORS is blocked. Server will handle this for you.', 'warning');
            
        } catch (error) {
            console.error('All tests failed:', error);
            showMessage('❌ Connection test failed. Please check your URL and try again.', 'error');
        }
    } finally {
        testConfigBtn.disabled = false;
        testConfigBtn.textContent = 'Test Connection';
    }
}

function isValidGoogleScriptUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'script.google.com' && 
               urlObj.pathname.includes('/macros/s/') && 
               url.endsWith('/exec');
    } catch {
        return false;
    }
}

function isValidServerUrl(url) {
    try {
        const urlObj = new URL(url);
        return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
               urlObj.hostname.length > 0;
    } catch {
        return false;
    }
}

function showMessage(message, type) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}-message`;
    messageEl.innerHTML = message; // Use innerHTML to support emoji and formatting
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.left = '50%';
    messageEl.style.transform = 'translateX(-50%)';
    messageEl.style.zIndex = '1001';
    messageEl.style.maxWidth = '500px';
    messageEl.style.fontSize = '0.9rem';
    messageEl.style.lineHeight = '1.4';
    
    document.body.appendChild(messageEl);
    
    // Remove after longer time for warnings
    const timeout = type === 'warning' ? 5000 : 3000;
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, timeout);
}

// Event Listeners for Modal
configBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openConfigModal();
});

closeModal.addEventListener('click', closeConfigModal);

saveConfigBtn.addEventListener('click', saveConfiguration);

testConfigBtn.addEventListener('click', testConfiguration);

// Close modal when clicking outside
configModal.addEventListener('click', (e) => {
    if (e.target === configModal) {
        closeConfigModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && configModal.style.display === 'block') {
        closeConfigModal();
    }
});

// Initialize: Check if configuration exists on page load
document.addEventListener('DOMContentLoaded', () => {
    // Show config notice if no URL is configured
    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        setTimeout(() => {
            showConfigNotice();
        }, 2000); // Show notice after 2 seconds
    }
});