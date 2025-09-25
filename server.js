const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Google Apps Script URL
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzzK1haMLCr34L-Iin14Eo6q9etJ2EY6inPPrMlSm1qGDOgAM7uTC4NdaaS67nIZ8ju/exec';

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://dimka388.github.io', 'https://your-domain.com'] // Add your GitHub Pages URL
        : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'], // Local development
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for local development)
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
            ...req.body,
            timestamp: req.body.timestamp || new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };
        
        // Send request to Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            timeout: 30000 // 30 second timeout
        });
        
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            // If response is not JSON, assume success if status is OK
            if (response.ok) {
                result = { success: true, message: 'Form submitted successfully' };
            } else {
                throw new Error(`Google Apps Script returned ${response.status}: ${response.statusText}`);
            }
        }
        
        console.log('Google Apps Script response:', result);
        
        if (response.ok) {
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

// Alternative endpoint using URL-encoded form data (for better compatibility)
app.post('/api/submit-form', async (req, res) => {
    try {
        console.log('Received form submission (URL-encoded):', req.body);
        
        // Convert to the same format as JSON endpoint
        const formData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone || '',
            company: req.body.company || '',
            message: req.body.message,
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };
        
        // Create form data for Google Apps Script
        const params = new URLSearchParams();
        Object.keys(formData).forEach(key => {
            params.append(key, formData[key]);
        });
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            timeout: 30000
        });
        
        if (response.ok) {
            res.json({
                success: true,
                message: 'Form submitted successfully'
            });
        } else {
            throw new Error(`Google Apps Script returned ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('Error submitting form data:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to submit form. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Serve the main page for local development
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the form page for local development
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
    console.log(`Google Apps Script URL: ${GOOGLE_SCRIPT_URL}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Local development URLs:`);
        console.log(`  - Home: http://localhost:${PORT}`);
        console.log(`  - Form: http://localhost:${PORT}/form`);
        console.log(`  - Health: http://localhost:${PORT}/health`);
    }
});

module.exports = app;