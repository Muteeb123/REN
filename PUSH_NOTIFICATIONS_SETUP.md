# Push Notification System Implementation Guide

## Overview
This document outlines the complete push notification system implementation for the REN app, including backend services, frontend UI, token management, and Firebase configuration.

## What Was Implemented

### 1. **Frontend (React Native)**

#### App.js - Permission Handling & Token Management
- **Auto-requests permissions** on app start (Android 13+ and Firebase)
- **Gets FCM token** from Firebase Messaging
- **Saves token** to both local storage and backend
- **Handles foreground notifications** with alerts
- **Handles background notifications** with proper listeners

#### Settings.js - Notification Control
- **Toggle Switch** to enable/disable notifications
- **Test Notification Button** to verify setup works
- **Automatic sync** with backend on toggle changes
- **Responsive UI** with loading states

### 2. **Backend (Node.js/Express)**

#### Models - User Schema Updates
- Added `fcmToken` field to store device tokens
- Added `notificationsEnabled` boolean flag
- Default notifications to enabled

#### Services - Push Notification Service (`pushNotification.service.js`)
- **Firebase Admin initialization**
- **sendPushNotification()** - Send to single device
- **sendMulticastPushNotification()** - Send to multiple devices
- **saveFcmToken()** - Store/update user token
- **disableNotifications()** - Remove token and disable
- **enableNotifications()** - Re-enable with new token
- **sendTestNotification()** - Send test message
- **getFcmToken()** - Retrieve user's token

#### Routes - Notification API (`notification.routes.js`)
- `POST /api/notifications/token` - Save/update FCM token
- `POST /api/notifications/disable` - Disable notifications
- `POST /api/notifications/enable` - Enable notifications
- `POST /api/notifications/test` - Send test notification
- `GET /api/notifications/status` - Check notification status

## Setup Instructions

### Step 1: Install Backend Dependencies
```bash
cd "Backend(Node)"
npm install firebase-admin
```

### Step 2: Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### Step 3: Configure Environment Variables
Create or update `.env` file in `Backend(Node)` directory:

```env
# Existing variables...
PORT=5000
MONGODB_URI=your_mongodb_uri

# Firebase Configuration (NEW)
# Convert the JSON file to base64:
# On Windows PowerShell:
# $content = Get-Content "path/to/firebase-key.json" -Raw
# [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

# On Mac/Linux:
# base64 < path/to/firebase-key.json

FIREBASE_SERVICE_ACCOUNT=<base64_encoded_service_account_key>
```

### Step 4: Update Frontend Configuration
Ensure your `Frontend/src/config/urls.js` has the correct backend URL:
```javascript
export const NODE_BACKEND_URL = "your_backend_url";
```

### Step 5: Install Frontend Dependencies
```bash
cd Frontend
npm install
# or
yarn add
```

### Step 6: Configure Firebase in React Native
The app uses Firebase as a dependency. Make sure Firebase is properly configured:

```bash
cd Frontend
npx expo prebuild --clean  # Rebuild native modules
```

## How It Works

### User Flow

1. **App Opens**
   - App.js checks Android 13+ notification permission
   - Requests Firebase messaging permission
   - Gets FCM token from Firebase
   - Saves token to AsyncStorage and backend

2. **User Enables Notifications (Settings)**
   - Toggle is turned ON
   - Current FCM token is sent to backend
   - Backend updates user's `fcmToken` and `notificationsEnabled = true`
   - User is notified of success

3. **User Disables Notifications (Settings)**
   - Toggle is turned OFF
   - Backend deletes user's FCM token (`fcmToken = null`)
   - Backend sets `notificationsEnabled = false`
   - No notifications will be received

4. **Send Test Notification**
   - Click "Send Test Notification" button
   - Backend retrieves user's FCM token
   - Firebase sends push notification
   - Notification appears on device (foreground or background)

### Technical Flow

```
Frontend                 Backend                Firebase Cloud Messaging
  |                        |                            |
  |--Save FCM Token------->|                            |
  |                        |--Store in DB               |
  |                        |                            |
  |--Toggle Notification-->|                            |
  |                        |--Update DB                 |
  |                        |                            |
  |--Send Test Notif------>|                            |
  |                        |--Get FCM Token             |
  |                        |--Send via FCM------------->|
  |                        |                            |
  |<--Notification <-------Receive & Display            |
```

## API Endpoints Reference

### Save/Update FCM Token
```bash
POST /api/notifications/token
Content-Type: application/json

{
  "userId": "user_mongodb_id",
  "fcmToken": "firebase_token_string"
}

Response:
{
  "success": true,
  "message": "FCM token saved successfully",
  "user": { ... }
}
```

### Send Test Notification
```bash
POST /api/notifications/test
Content-Type: application/json

{
  "userId": "user_mongodb_id"
}

Response:
{
  "success": true,
  "message": "Test notification sent"
}
```

### Disable Notifications
```bash
POST /api/notifications/disable
Content-Type: application/json

{
  "userId": "user_mongodb_id"
}

Response:
{
  "success": true,
  "message": "Notifications disabled successfully",
  "user": { notificationsEnabled: false, fcmToken: null }
}
```

### Enable Notifications
```bash
POST /api/notifications/enable
Content-Type: application/json

{
  "userId": "user_mongodb_id",
  "fcmToken": "firebase_token_string"
}

Response:
{
  "success": true,
  "message": "Notifications enabled successfully",
  "user": { notificationsEnabled: true, fcmToken: "..." }
}
```

### Check Notification Status
```bash
GET /api/notifications/status?userId=user_mongodb_id

Response:
{
  "success": true,
  "notificationsEnabled": true,
  "hasToken": true
}
```

## Testing the Implementation

### 1. Test Permission Prompt
- Open the app fresh
- You should see a notification permission prompt
- Accept permissions
- Check backend that token was saved

### 2. Test Settings Toggle
- Go to Settings screen
- Toggle notifications ON/OFF
- Check console logs for success messages
- Verify changes persist after reopening app

### 3. Test Push Notification
- Go to Settings screen
- Ensure notifications are enabled
- Click "Send Test Notification"
- You should receive a notification with test message

### 4. Test Token Updates
- Log out
- Log in with different account
- New FCM token should be saved for new user

## Troubleshooting

### "Firebase service account not configured"
- **Solution**: Add `FIREBASE_SERVICE_ACCOUNT` to `.env` file
- Ensure the base64 encoding is correct

### "FCM token not found" Error
- **Cause**: App didn't successfully get Firebase token
- **Solution**: 
  - Check notification permissions are granted
  - Restart the app
  - Check Firebase project is properly configured

### Test Notification Not Received
- **Check 1**: Notifications are enabled in Settings
- **Check 2**: Background restrictions (Android Settings → Battery → App battery usage)
- **Check 3**: Backend logs for errors
- **Check 4**: Firebase configuration in `app.js`

### Token Not Saving to Backend
- **Check 1**: User ID is correctly passed from frontend
- **Check 2**: Backend URL is correct in `urls.js`
- **Check 3**: MongoDB connection is working
- **Check 4**: Check backend logs for errors

## File Changes Summary

### New Files Created
- `Backend(Node)/services/pushNotification.service.js` - Notification service
- `Backend(Node)/routes/notification.routes.js` - API routes

### Files Modified
- `Backend(Node)/Models/User.model.js` - Added FCM fields
- `Backend(Node)/app.js` - Added Firebase init and routes
- `Frontend/App.js` - Added permission & token handling
- `Frontend/src/screens/Settings.js` - Added notification toggle & test button
- `Backend(Node)/package.json` - Added firebase-admin dependency

## Security Considerations

1. **Token Validation**: Always validate userId on backend before sending notifications
2. **Rate Limiting**: Consider adding rate limiting to prevent notification spam
3. **User Consent**: Always get explicit user consent before sending notifications
4. **Data Retention**: Consider auto-deleting tokens after X days of inactivity
5. **Error Handling**: Never expose sensitive Firebase details in error messages

## Future Enhancements

1. **Notification Categories**
   - Different notification types (chat, mood alert, etc.)
   - User preferences per notification type

2. **Scheduling**
   - Schedule notifications for specific times
   - Recurring notifications for meditation reminders

3. **Deep Linking**
   - Direct users to specific screens when tapping notification
   - Add notification context data

4. **Analytics**
   - Track notification delivery rates
   - Track user interactions with notifications

5. **Multi-Device Support**
   - Allow users to have multiple device tokens
   - Manage devices independently

## Dependencies Added
- `firebase-admin` (^13.0.0) - Firebase Admin SDK for backend

## Dependencies Already Present (Frontend)
- `@react-native-firebase/messaging` - Firebase Messaging for push notifications
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-permissions` (if not present, may be needed)

---

**Last Updated**: May 7, 2026
**Status**: Production Ready
