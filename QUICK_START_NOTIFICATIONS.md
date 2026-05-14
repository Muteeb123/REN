# Quick Start Checklist - Push Notifications

## Before Running the App

### Backend Setup (5 minutes)
- [ ] Install firebase-admin: `npm install firebase-admin`
- [ ] Get Firebase Service Account key from Firebase Console
- [ ] Create `.env` file in `Backend-node` with:
  ```
  FIREBASE_SERVICE_ACCOUNT=<base64_encoded_key>
  ```
- [ ] Run backend: `npm run dev`

### Frontend Setup (2 minutes)
- [ ] Ensure `Frontend/src/config/urls.js` has correct `NODE_BACKEND_URL`
- [ ] Rebuild native modules: `npx expo prebuild --clean`
- [ ] Run app: `npm start` or `expo start`

## Testing Workflow

1. **On First Launch**
   - Allow notification permissions
   - Check backend logs for "FCM token saved"

2. **In Settings**
   - Toggle notifications ON
   - Click "Send Test Notification"
   - Should receive notification on device

3. **Test Disable**
   - Toggle notifications OFF
   - Click "Send Test Notification" (should show error)

## Command Reference

```bash
# Backend
cd "Backend-node"
npm install firebase-admin
npm run dev

# Frontend
cd Frontend
npx expo prebuild --clean
npm start

# Test notification endpoint
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"userId": "your_user_id"}'
```

## Troubleshooting Commands

```bash
# Check if Firebase is initialized
# In backend, check app.js logs

# View MongoDB to confirm token saved
# db.users.findOne({_id: ObjectId("user_id")})

# Check FCM token format
# Token should start with: eyJ...
```

## Important Files

| File | Purpose |
|------|---------|
| `Backend-node/services/pushNotification.service.js` | Firebase logic |
| `Backend-node/routes/notification.routes.js` | API endpoints |
| `Frontend/App.js` | Permission & token setup |
| `Frontend/src/screens/Settings.js` | UI controls |
| `Backend-node/Models/User.model.js` | Database fields |

## Environment Variables Needed

```
FIREBASE_SERVICE_ACCOUNT=<base64_service_account_json>
```

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Firebase service account not configured" | Add FIREBASE_SERVICE_ACCOUNT to .env |
| "FCM token not found" | Restart app, check permissions |
| "Failed to save FCM token" | Check user ID is correct |
| Notification not received | Check battery optimization settings, notification permissions |

## API Endpoints Available

```
POST   /api/notifications/token      - Save FCM token
POST   /api/notifications/enable     - Enable notifications
POST   /api/notifications/disable    - Disable notifications  
POST   /api/notifications/test       - Send test notification
GET    /api/notifications/status     - Check notification status
```

---

Refer to `PUSH_NOTIFICATIONS_SETUP.md` for complete documentation.
