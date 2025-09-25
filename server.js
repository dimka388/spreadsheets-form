const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://dimka388.github.io', 'https://your-domain.com'] // Add your GitHub Pages URL
        : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:8000'], // Local development
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Main API endpoint to proxy requests to Google Apps Script
app.post('/api/submit', async (req, res) => {
    try {
        console.log('Received form submission:', req.body);
        
        // Get Google Apps Script URL from request or environment
        const scriptUrl = req.body.scriptUrl || process.env.GOOGLE_SCRIPT_URL;
        
        if (!scriptUrl) {
            return res.status(400).json({
                success: false,
                error: 'Google Apps Script URL is required'
            });
        }
        
        // Validate required fields
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, email, and message are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        
        // Prepare data for Google Apps Script
        const formData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone || '',
            company: req.body.company || '',
            message: req.body.message,
            timestamp: req.body.timestamp || new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };
        
        console.log('Sending to Google Apps Script:', scriptUrl);
        console.log('Data:', formData);
        
        // Send request to Google Apps Script
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            timeout: 30000 // 30 second timeout
        });
        
        console.log('Google Apps Script response status:', response.status);
        
        let result;
        try {
            const responseText = await response.text();
            console.log('Google Apps Script raw response:', responseText);
            
            if (responseText.trim()) {
                result = JSON.parse(responseText);
            } else {
                // Empty response, assume success if status is OK
                result = { success: true, message: 'Form submitted successfully' };
            }
        } catch (parseError) {
            console.warn('Failed to parse JSON response:', parseError.message);
            
            // If response is not JSON, assume success if status is OK
            if (response.ok) {
                result = { success: true, message: 'Form submitted successfully' };
            } else {
                throw new Error(`Google Apps Script returned ${response.status}: ${response.statusText}`);
            }
        }
        
        if (response.ok) {
            console.log('Success! Parsed result:', result);
            res.json({
                success: true,
                message: 'Form submitted successfully',
                data: result
            });
        } else {
            throw new Error(`Google Apps Script error: ${result.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('Error submitting to Google Apps Script:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to submit form. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Test endpoint for Google Apps Script connectivity
app.post('/api/test-connection', async (req, res) => {
    try {
        const { scriptUrl } = req.body;
        
        if (!scriptUrl) {
            return res.status(400).json({
                success: false,
                error: 'Script URL is required'
            });
        }
        
        console.log('Testing connection to:', scriptUrl);
        
        // Test with GET request first
        const response = await fetch(scriptUrl, {
            method: 'GET',
            timeout: 15000
        });
        
        const responseText = await response.text();
        console.log('Test response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            result = { message: 'Response received but not JSON' };
        }
        
        res.json({
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: result
        });
        
    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the form page
app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Local development URLs:`);
        console.log(`  - Home: http://localhost:${PORT}`);
        console.log(`  - Form: http://localhost:${PORT}/form`);
        console.log(`  - Health: http://localhost:${PORT}/health`);
    }
});

module.exports = app;