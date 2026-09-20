# 🚀 Firebase Setup Guide — POS & BackOffice

This system is configured to use **Firebase Firestore** as its real-time, serverless cloud database. There is **no backend server needed** — both the POS and BackOffice connect directly to Firestore with real-time sync, offline support, and zero server maintenance costs.

---

## 1. Create Your Firebase Project (2 minutes)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project** (or **Add project**)
3. Name it: `pos-demo` (or any name you prefer)
4. Google Analytics can be enabled or disabled (your choice) → click **Create project**

---

## 2. Enable Cloud Firestore

1. In the left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**
3. Select your closest location (e.g., `asia-south1` or `us-central1`)
4. Choose **Start in production mode** → click **Create**
5. Go to the **Rules** tab in Firestore and paste the contents of `firestore.rules` (found in this repository), then click **Publish**.

---

## 3. Enable Email/Password Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Select **Email/Password** under Native providers
4. Toggle **Enable** (leave Email link disabled) → click **Save**

---

## 4. Get Your Web App Config

1. Click the **Gear icon (Project settings)** in the top left sidebar
2. In the **General** tab, scroll down to **Your apps**
3. Click the **Web icon (`</>`)**
4. Register app name: `pos-web` (no need to check Firebase Hosting) → click **Register app**
5. You will see a `firebaseConfig` snippet like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "pos-demo-12345.firebaseapp.com",
     projectId: "pos-demo-12345",
     storageBucket: "pos-demo-12345.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```

---

## 5. Paste Credentials into `.env` Files

Open or create `POS/.env` and `BackOffice/.env` and paste your values:

### `POS/.env` & `BackOffice/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=pos-demo-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pos-demo-12345
VITE_FIREBASE_STORAGE_BUCKET=pos-demo-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

---

## 6. Seed Initial Data (Products, Categories, Users)

To populate Firestore with all 26 products, 8 categories, 4 suppliers, and default staff logins:

1. In Firebase Console → **Project settings** → **Service accounts** tab
2. Click **Generate new private key** → Download the JSON file
3. Rename the downloaded file to `serviceAccountKey.json` and place it inside the `firebase-seed/` folder
4. Run the seed script:
   ```bash
   cd firebase-seed
   npm install
   npm run seed
   ```

### Default Login Accounts Created:
- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`
- **Cashier**: `cashier` / `cashier123`

---

## 7. Running Locally

### Start POS:
```bash
cd POS
npm run dev
```

### Start BackOffice:
```bash
cd BackOffice
npm run dev
```

---

## 8. Deploying to Vercel (Cloud Hosting)

Both apps are 100% static SPAs and can be deployed directly to Vercel for free:

1. Push this repository to your GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import `POS-Demo`
3. **For POS**: Set Root Directory to `POS`
4. Under **Environment Variables**, add the 6 `VITE_FIREBASE_*` variables
5. Click **Deploy**!
6. Repeat the same for `BackOffice` (Set Root Directory to `BackOffice`)!
