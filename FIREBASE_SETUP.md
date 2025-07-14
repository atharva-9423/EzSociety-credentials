
# Firebase Setup Instructions

## Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "society-visitor-app")
4. Follow the setup wizard

## Step 2: Enable Realtime Database
1. In your Firebase project console, click "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" for now
4. Select your preferred location

## Step 3: Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register your app name
5. Copy the config object

## Step 4: Update Configuration
1. Open `firebase-config.js`
2. Replace the firebaseConfig object with your copied config
3. Make sure the databaseURL is included

## Step 5: Set Database Rules (Optional Security)
In your Firebase Realtime Database rules, you can set:

```json
{
  "rules": {
    "one_time_links": {
      ".read": true,
      ".write": true
    },
    "residents": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Security Note
For production, implement proper authentication and more restrictive rules.
