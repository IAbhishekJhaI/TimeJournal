# Time Tracker - Service Account Setup Guide

## Overview
This version uses Google Service Account authentication, which provides secure, password-less access to your spreadsheets without requiring user sign-in or making spreadsheets public.

## What is a Service Account?

A Service Account is like a "robot account" that can access Google services on behalf of your application. Unlike API keys:
- ✅ **More secure** - uses private key authentication
- ✅ **No public sharing needed** - spreadsheet can remain private
- ✅ **Granular permissions** - can share specific sheets with the service account
- ✅ **Enterprise-ready** - suitable for team environments

## Complete Setup Guide

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" dropdown → "NEW PROJECT"
3. Enter project name: "Time Tracker App"
4. Click "CREATE"
5. Wait for project creation to complete

### Step 2: Enable Google Sheets API

1. In your project, click "APIs & Services" from the left menu
2. Click "Library"
3. Search for "Google Sheets API"
4. Click on "Google Sheets API"
5. Click "ENABLE"

### Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "Service account"
3. Fill in the details:
   - **Service account name**: `time-tracker-bot`
   - **Service account ID**: (auto-filled, something like `time-tracker-bot@project-id.iam.gserviceaccount.com`)
   - **Description**: "Service account for time tracking app"
4. Click "CREATE AND CONTINUE"
5. **Grant access** (optional): Skip this step, click "CONTINUE"
6. **Grant users access** (optional): Skip this step, click "DONE"

### Step 4: Create Service Account Key

1. In the Credentials page, find your newly created service account in the "Service Accounts" section
2. Click on the service account email
3. Go to the "KEYS" tab
4. Click "ADD KEY" → "Create new key"
5. Select "JSON" as the key type
6. Click "CREATE"
7. A JSON file will download to your computer - **keep this safe!**

**⚠️ IMPORTANT SECURITY NOTE:**
- This JSON file contains your private key
- Never share it publicly or commit to GitHub
- Anyone with this file can access your spreadsheet
- Treat it like a password!

### Step 5: Share Spreadsheet with Service Account

1. Open your Google Spreadsheet
2. Click the "Share" button (top right)
3. In the "Add people and groups" field, paste the **service account email**
   - It looks like: `time-tracker-bot@project-id.iam.gserviceaccount.com`
   - You can find this in the downloaded JSON file (look for `client_email`)
4. Set permission to **"Editor"**
5. **Uncheck** "Notify people" (the service account won't receive emails)
6. Click "Share"

Now your service account can read and write to the spreadsheet!

### Step 6: Get Your Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the `SPREADSHEET_ID` (the long string between `/d/` and `/edit`)
4. Example: `13-jynghNoDEMum1Fo_1HmI7EiXgXf7DwZ2UfFBrLVKM`

### Step 7: Configure the Application

1. Open `time-tracker-service-account.html` in your browser
2. Click "Choose File" or paste the entire contents of the JSON file
   - Open the downloaded JSON file with a text editor
   - Copy ALL the contents (including the curly braces)
   - Paste into the textarea in the app
3. Enter your Spreadsheet ID
4. Click "Start Tracking"

Your credentials are saved securely in your browser's localStorage.

## Using the App

### First Time Setup:
1. Paste service account JSON key
2. Enter spreadsheet ID
3. Click "Start Tracking"

### Daily Usage:
1. Select date
2. Click "Load Day"
3. Select activity and fill time slots
4. Click "Save to Google Sheets"

### Change Spreadsheet:
1. Click "Change Settings"
2. Enter new credentials
3. Click "Start Tracking"

## For Multiple Users (3 Users)

### Option A: Shared Service Account (Recommended)
1. **One person** creates the service account and downloads the JSON key
2. **Share the JSON file** securely with the other 2 users
   - Use encrypted email
   - Or a secure file sharing service
   - Or a password manager that supports file sharing
3. **Each user** has their own copy of the spreadsheet
4. **Share each spreadsheet** with the service account email
5. Each user enters the same JSON but different spreadsheet IDs

### Option B: Individual Service Accounts
1. Each user creates their own service account
2. Each user downloads their own JSON key
3. Each user shares their spreadsheet with their own service account
4. More secure but requires more setup

## Security Best Practices

### Protecting Your Service Account Key

**DO:**
- ✅ Store the JSON file in a secure location
- ✅ Use a password manager for the JSON content
- ✅ Delete old keys if you create new ones
- ✅ Regularly review who has access to the key
- ✅ Use different service accounts for different apps

**DON'T:**
- ❌ Commit the JSON file to Git/GitHub
- ❌ Email it unencrypted
- ❌ Share it in Slack/Teams/public channels
- ❌ Store it in Dropbox/Google Drive without encryption
- ❌ Screenshot and share it

### Revoking Access

If the JSON key is compromised:
1. Go to Google Cloud Console
2. Navigate to your service account
3. Go to "KEYS" tab
4. Delete the compromised key
5. Create a new key
6. Update the app with the new key

### Sharing Spreadsheets

- Only share with the service account email, not with "Anyone with the link"
- This keeps your data private
- Only users with the service account credentials can access via the app

## Troubleshooting

### "Error authenticating"
**Causes:**
- Invalid JSON format
- Incorrect service account key
- Service account doesn't have Sheets API enabled

**Solutions:**
- Verify the JSON is complete (starts with `{` and ends with `}`)
- Re-download the key from Google Cloud Console
- Ensure Google Sheets API is enabled in your project

### "Error loading activities" or "Error saving"
**Causes:**
- Spreadsheet not shared with service account
- Incorrect spreadsheet ID
- Service account doesn't have Editor permissions

**Solutions:**
- Verify the spreadsheet is shared with the service account email
- Check the spreadsheet ID is correct
- Ensure service account has "Editor" permission, not just "Viewer"

### "Failed to get access token"
**Causes:**
- Corrupted or invalid private key
- Service account deleted in Google Cloud

**Solutions:**
- Create a new service account key
- Verify service account still exists in Google Cloud Console

### "Date not found in sheet"
**Causes:**
- Date doesn't exist in Days sheet
- Incorrect date format

**Solutions:**
- Ensure date exists in column A of Days sheet
- Date format should be: YYYY.M.D (e.g., "2026.2.9")

## Advantages of Service Account vs API Key

| Feature | Service Account | API Key |
|---------|----------------|---------|
| **Security** | ✅ High (private key) | ⚠️ Medium (just a key) |
| **Spreadsheet Privacy** | ✅ Private | ❌ Must be public |
| **Authentication** | ✅ JWT-based | ⚠️ Key-based |
| **Permissions** | ✅ Granular (per sheet) | ❌ Global |
| **Revocation** | ✅ Easy (delete key) | ⚠️ Change key everywhere |
| **Enterprise Use** | ✅ Recommended | ❌ Not recommended |
| **Setup Complexity** | ⚠️ Moderate | ✅ Simple |

## Technical Details

### How Authentication Works

1. **JWT Creation**: App creates a signed JSON Web Token using the private key
2. **Token Exchange**: JWT is exchanged for an access token from Google OAuth
3. **API Calls**: Access token is used to make authenticated API requests
4. **Auto-Refresh**: Token automatically refreshes when expired (1 hour validity)

### What's Stored in Browser

- Service account JSON (encrypted in localStorage)
- Spreadsheet ID
- Nothing is sent to any server except Google's APIs

### CORS and Security

- The app uses client-side JWT signing (jsrsasign library)
- All API calls go directly to Google Sheets API
- No backend server required
- Works entirely in the browser

## Migration Guide

### Moving from API Key Version

1. Create service account (follow steps above)
2. Share spreadsheet with service account
3. Update spreadsheet from "public" to "private" (shared only with service account)
4. Open service account version of the app
5. Enter service account JSON and spreadsheet ID
6. All your data remains unchanged

## Support

### Common Questions

**Q: Can I use the same service account for multiple spreadsheets?**
A: Yes! Just share each spreadsheet with the service account email.

**Q: Can multiple people use the same service account?**
A: Yes, but they must all have the JSON key file. Better to create separate service accounts for better security.

**Q: Does the service account need special permissions?**
A: No, just "Editor" access to the specific spreadsheet is enough.

**Q: Can I use this for work/enterprise?**
A: Yes! Service accounts are designed for this. Consider using Google Workspace for better management.

**Q: What happens if I lose the JSON file?**
A: You'll need to create a new key in Google Cloud Console. The old key will continue working until you delete it.

---

**Need help?** Check the browser console (F12) for detailed error messages.

Enjoy secure time tracking! 🔒📊
