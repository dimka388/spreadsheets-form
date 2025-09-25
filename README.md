# Spreadsheets Form

A simple web application that collects form submissions and sends them directly to Google Sheets. The project includes both a static frontend (deployable to GitHub Pages) and an optional Express.js server to handle CORS issues.

## 🚀 Features

- **Clean, responsive design** that works on all devices
- **Direct Google Sheets integration** via Google Apps Script
- **CORS-free server solution** for reliable form submissions
- **Real-time form validation** with user feedback
- **Easy deployment** to GitHub Pages
- **Optional server deployment** for enhanced reliability

## 📋 Quick Start

### Option 1: Static Website (GitHub Pages)

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
3. **Update the Google Apps Script URL** in `script.js`:
   ```javascript
   const CONFIG = {
       GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
   };
   ```
4. **Commit and push** your changes
5. Your site will be available at: `https://yourusername.github.io/spreadsheets-form`

### Option 2: With Server (Recommended for production)

1. **Deploy the server** to a platform like Railway, Render, or Heroku
2. **Update the configuration** in `script.js`:
   ```javascript
   const CONFIG = {
       SERVER_URL: 'https://your-deployed-server-url.com/api/submit',
       USE_SERVER: true
   };
   ```
3. **Deploy to GitHub Pages** as described in Option 1

## 🛠️ Local Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/spreadsheets-form.git
   cd spreadsheets-form
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your Google Apps Script URL.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 📊 Google Apps Script Setup

To connect your form to Google Sheets, you'll need to create a Google Apps Script:

1. **Create a new Google Sheet**
2. **Open Apps Script** (Extensions → Apps Script)
3. **Replace the default code** with:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Parse the JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Prepare the row data
    const rowData = [
      new Date(data.timestamp),
      data.name,
      data.email,
      data.phone || '',
      data.company || '',
      data.message
    ];
    
    // Add headers if this is the first row
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Name', 'Email', 'Phone', 'Company', 'Message']
      ]);
    }
    
    // Append the data
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({status: 'OK', message: 'Form handler is running'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. **Deploy the script**:
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"
   - Copy the web app URL

5. **Update your configuration** with the copied URL

## 🌐 Deployment Options

### GitHub Pages (Free)
- Automatic deployment on push to main branch
- Perfect for static sites
- May have CORS limitations with some browsers

### Server Deployment Platforms

#### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

#### Render
1. Create a new web service
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`

#### Heroku
1. Create a new app
2. Connect to GitHub repository
3. Enable automatic deploys
4. Add environment variables in settings

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_SCRIPT_URL` | Your Google Apps Script web app URL | Required |
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |

### Client Configuration

Update `script.js` to configure the frontend:

```javascript
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'your-google-apps-script-url',
    SERVER_URL: 'your-server-url/api/submit',
    USE_SERVER: false // Set to true to use server
};
```

## 🎨 Customization

### Styling
- Edit `styles.css` to customize the appearance
- The design uses CSS Grid and Flexbox for responsiveness
- Color scheme can be easily modified by updating CSS variables

### Form Fields
- Add or remove fields in `form.html`
- Update the JavaScript in `script.js` to handle new fields
- Modify the Google Apps Script to accommodate new fields

### Branding
- Update the logo and site title in HTML files
- Modify colors, fonts, and styling in `styles.css`
- Add your own images to the `assets` folder

## 🐛 Troubleshooting

### CORS Issues
- Use the server solution (`USE_SERVER: true`)
- Ensure your server allows your domain in CORS settings

### Form Not Submitting
- Check browser console for errors
- Verify Google Apps Script URL is correct
- Test the Google Apps Script directly

### Google Apps Script Errors
- Check the Apps Script execution log
- Ensure the script has proper permissions
- Verify the spreadsheet is accessible

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Look through existing GitHub issues
3. Create a new issue with detailed information

---

Made with ❤️ for easy form-to-spreadsheet integration