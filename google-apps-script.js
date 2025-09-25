/**
 * Google Apps Script for handling form submissions
 * 
 * Instructions:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Replace the default code with this script
 * 4. Save and deploy as a web app
 * 5. Copy the web app URL and use it in your configuration
 */

function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    let data;
    
    // Handle different content types
    if (e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Missing required fields: name, email, and message are required'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare the row data
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const rowData = [
      timestamp,
      data.name,
      data.email,
      data.phone || '',
      data.company || '',
      data.message,
      data.userAgent || '',
      data.ip || ''
    ];
    
    // Add headers if this is the first row
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([
        ['Timestamp', 'Name', 'Email', 'Phone', 'Company', 'Message', 'User Agent', 'IP Address']
      ]);
      
      // Format the header row
      const headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    // Append the data
    sheet.appendRow(rowData);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    const dataRange = sheet.getRange(lastRow, 1, 1, 8);
    
    // Format timestamp column
    sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 8);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Form submitted successfully',
        row: lastRow,
        timestamp: timestamp.toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString(),
        message: 'Failed to process form submission'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK', 
      message: 'Form handler is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify the script works
 * Run this in the Apps Script editor to test
 */
function testFormSubmission() {
  const testData = {
    postData: {
      type: 'application/json',
      contents: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        message: 'This is a test message',
        timestamp: new Date().toISOString()
      })
    }
  };
  
  const result = doPost(testData);
  console.log('Test result:', result.getContent());
}

/**
 * Function to set up the spreadsheet with proper formatting
 * Run this once to initialize your spreadsheet
 */
function setupSpreadsheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Clear existing content
  sheet.clear();
  
  // Add headers
  const headers = ['Timestamp', 'Name', 'Email', 'Phone', 'Company', 'Message', 'User Agent', 'IP Address'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e8f0fe');
  headerRange.setBorder(true, true, true, true, true, true);
  
  // Set column widths
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 150); // Name  
  sheet.setColumnWidth(3, 200); // Email
  sheet.setColumnWidth(4, 130); // Phone
  sheet.setColumnWidth(5, 150); // Company
  sheet.setColumnWidth(6, 300); // Message
  sheet.setColumnWidth(7, 200); // User Agent
  sheet.setColumnWidth(8, 120); // IP Address
  
  // Freeze the header row
  sheet.setFrozenRows(1);
  
  console.log('Spreadsheet setup complete!');
}