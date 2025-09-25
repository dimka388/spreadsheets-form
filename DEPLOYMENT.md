# Deployment Guide

This guide will help you deploy your spreadsheets form application to various platforms.

## 🚀 GitHub Pages Deployment (Static Site)

### Prerequisites
1. GitHub account
2. Your Google Apps Script web app URL

### Steps

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Source: "Deploy from a branch"
   - Branch: "main" / (root)
   - Click "Save"

3. **Your site will be available at**:
   `https://yourusername.github.io/spreadsheets-form`

### GitHub Pages Configuration

The GitHub Actions workflow in `.github/workflows/deploy.yml` will automatically deploy your site when you push to the main branch.

## 🖥️ Server Deployment Options

### Option 1: Railway (Recommended)

1. **Sign up at [Railway](https://railway.app)**
2. **Connect your GitHub repository**
3. **Deploy with one click**
4. **Set environment variables**:
   - `GOOGLE_SCRIPT_URL`: Your Google Apps Script URL
   - `NODE_ENV`: `production`

### Option 2: Render

1. **Sign up at [Render](https://render.com)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Add environment variables**:
   - `GOOGLE_SCRIPT_URL`: Your Google Apps Script URL
   - `NODE_ENV`: `production`

### Option 3: Heroku

1. **Install Heroku CLI**
2. **Login to Heroku**:
   ```bash
   heroku login
   ```
3. **Create a new app**:
   ```bash
   heroku create your-app-name
   ```
4. **Set environment variables**:
   ```bash
   heroku config:set GOOGLE_SCRIPT_URL=your-google-apps-script-url
   heroku config:set NODE_ENV=production
   ```
5. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 4: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```
2. **Deploy**:
   ```bash
   vercel
   ```
3. **Set environment variables** in Vercel dashboard

## 📊 Google Apps Script Setup

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Form Submissions" or similar

### Step 2: Set up Apps Script
1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete the default code
3. Copy and paste the code from `google-apps-script.js`
4. Save the project (Ctrl+S)

### Step 3: Deploy as Web App
1. Click **Deploy → New deployment**
2. Settings:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
3. Click **Deploy**
4. Copy the **Web app URL**
5. Click **Done**

### Step 4: Test the Script
1. Run the `setupSpreadsheet()` function to initialize your sheet
2. Run the `testFormSubmission()` function to test
3. Check your spreadsheet for the test data

### Step 5: Update Your Configuration
Update the Google Apps Script URL in your code:

**For Static Site (GitHub Pages)**:
Update `script.js`:
```javascript
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'YOUR_COPIED_WEB_APP_URL_HERE',
    USE_SERVER: false
};
```

**For Server Deployment**:
Set the environment variable:
```bash
GOOGLE_SCRIPT_URL=YOUR_COPIED_WEB_APP_URL_HERE
```

## 🔧 Configuration Updates

### For GitHub Pages (Static)
After deploying your server, update `script.js`:
```javascript
const CONFIG = {
    SERVER_URL: 'https://your-deployed-server-url.com/api/submit',
    USE_SERVER: true
};
```

### For Server Deployment
Update CORS settings in `server.js` if needed:
```javascript
app.use(cors({
    origin: [
        'https://yourusername.github.io',
        'https://your-custom-domain.com'
    ],
    credentials: true
}));
```

## 🧪 Testing Your Deployment

### Test Static Site
1. Visit your GitHub Pages URL
2. Fill out the form
3. Check your Google Sheet for submissions

### Test Server
1. Visit your server health endpoint: `/health`
2. Should return: `{"status":"OK",...}`
3. Test form submission through your frontend

### Test Google Apps Script
Direct test the script:
```bash
curl -X POST "YOUR_GOOGLE_APPS_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Use the server solution
   - Ensure CORS is properly configured

2. **Google Apps Script Not Receiving Data**:
   - Check the script execution log
   - Verify permissions are set correctly
   - Test with the provided test function

3. **GitHub Pages Not Updating**:
   - Check the Actions tab for deployment status
   - Ensure the workflow has proper permissions

4. **Server Not Responding**:
   - Check server logs
   - Verify environment variables
   - Test the health endpoint

### Support
If you encounter issues:
1. Check the browser console for errors
2. Review server logs (if using server solution)
3. Test each component individually
4. Create an issue on GitHub with detailed information

## 📈 Going Production

### Security Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting (optional)
- [ ] Monitor server logs
- [ ] Set up error tracking (optional)

### Performance Tips
- Use CDN for static assets (optional)
- Enable gzip compression (already included)
- Monitor Google Apps Script quotas
- Consider caching strategies for high traffic

### Monitoring
- Set up uptime monitoring for your server
- Monitor Google Apps Script execution quotas
- Track form submission success rates