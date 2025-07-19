# Surprizen Authentication System - Todo List

## Frontend Setup Tasks

1. **Install Required Dependencies**
   - Run the install-deps.sh script to install React Navigation packages:
     ```bash
     cd surprizen
     chmod +x install-deps.sh
     ./install-deps.sh
     ```
   - Update packages to recommended versions (based on Expo output):
     ```bash
     npm install @react-native-async-storage/async-storage@2.1.2
     npm install react-native-safe-area-context@5.4.0
     npm install react-native-screens@~4.11.1
     ```

2. **Configure Firebase**
   - Create a Firebase project at
     [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google providers
   - Create a `.env` file in the `surprizen` directory with your Firebase
     config:
     ```
     EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

3. **Test Frontend Authentication Flow**
   - Start the Expo development server:
     ```bash
     cd surprizen
     npm start
     ```
   - **What to expect**: The Expo CLI should open a development server in your
     browser (usually at http://localhost:19002) with QR codes and options to
     run on different platforms
   - **If prompted for username/password**: This might be an Expo account login.
     You can:
     - Create a free Expo account at
       [https://expo.dev/signup](https://expo.dev/signup)
     - Or run `npx expo login` in the terminal first
     - Or skip login and run locally without an account

   - **Testing the authentication screens**:
     - Open the app in Expo Go (mobile) or web browser
     - You should see the login screen first (since no user is authenticated)
     - Test user registration with email/password:
       - Click "Sign Up" link
       - Enter test email and password
       - Verify account creation works
     - Test login with email/password:
       - Use the credentials you just created
       - Verify you're redirected to the Home screen
     - Test Google authentication:
       - Click "Continue with Google" button
       - Complete Google OAuth flow
     - Verify session persistence:
       - Close and reopen the app
       - Should automatically show Home screen (not login)
     - Test password reset functionality:
       - Go to login screen
       - Click "Forgot Password?"
       - Enter your email
       - Check for reset email

## Backend Setup Tasks

1. **Configure Firebase Admin SDK (Use Same Project as Frontend)**
   - Go to your existing Firebase project console
   - Navigate to **Project Settings** → **Service Accounts** tab
   - Click **"Generate new private key"** button
   - Download the JSON file (keep it secure!)
   - Create a `.env` file in the `surprizen-api` directory:
     ```
     FIREBASE_PROJECT_ID=your_same_project_id_from_frontend
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
     FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
     JWT_SECRET=your_secure_random_string_generate_this
     JWT_EXPIRATION=1h
     JWT_REFRESH_EXPIRATION=30d
     CORS_ORIGIN=http://localhost:19006
     ```
   - **Note**: Use the same `FIREBASE_PROJECT_ID` as in your frontend `.env`
     file

   - **Where to find each value**:

     **FIREBASE_DATABASE_URL**:
     - In Firebase Console → Project Settings → General tab
     - Look for "Realtime Database" section
     - If you don't see it, you may need to create a Realtime Database first:
       - Go to "Realtime Database" in left sidebar
       - Click "Create Database"
       - Choose your region
       - The URL will be:
         `https://YOUR_PROJECT_ID-default-rtdb.REGION.firebasedatabase.app/`
     - **Alternative**: If you're only using Firestore (not Realtime Database),
       you can use a placeholder like:
       `https://your-project-id-default-rtdb.firebaseio.com/`

     **JWT_SECRET**:
     - Generate a secure random string (32+ characters)
     - You can generate one using:
       ```bash
       # Option 1: Using Node.js
       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

       # Option 2: Using OpenSSL (Mac/Linux)
       openssl rand -hex 32

       # Option 3: Online generator (use a reputable one)
       # Or just use a long random string like: "your_super_secure_random_string_here_make_it_long_and_complex_123456789"
       ```

     **All other values** come from the service account JSON file you download
     from Firebase

2. **Set Up Supabase (Optional for Now)**
   - Create a Supabase project at [https://supabase.com/](https://supabase.com/)
   - Add Supabase URL and key to the `.env` file:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     ```

3. **Start the API Server**
   - Install dependencies:
     ```bash
     cd surprizen-api
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

4. **Test Backend API Endpoints with Postman**

   **Base URL**: `http://localhost:5000` (or whatever port your API is running
   on)

   **Test 1: Health Check (No Auth Required)**
   - Method: `GET`
   - URL: `http://localhost:5000/api/v1/health`
   - Expected Response: `{"status": "ok", "timestamp": "..."}`

   **🚨 Troubleshooting 403 Forbidden Error:**

   **Check 1: Is the API server running?**
   ```bash
   cd surprizen-api
   npm run dev
   ```
   - Look for: "Server running on port 5000" in terminal
   - If not running, start it first

   **Check 2: Try the root endpoint first**
   - URL: `http://localhost:5000/`
   - Should return: `{"message": "Welcome to Surprizen API"}`
   - If this works but `/api/v1/health` doesn't, there's a routing issue

   **Check 3: Check the actual port**
   - Look at your terminal output when starting the API
   - It might be running on a different port (3000, 8000, etc.)
   - Try: `http://localhost:3000/api/v1/health`

   **Check 4: CORS issues**
   - Add these headers in Postman:
     - `Origin: http://localhost:19006`
     - `Content-Type: application/json`

   **Check 5: Helmet security headers**
   - The API uses Helmet middleware which might be blocking requests
   - Try disabling Helmet temporarily for testing

   **Test 2: Create Session (Requires Firebase ID Token)**
   - Method: `POST`
   - URL: `http://localhost:3001/api/v1/auth/session` (note we changed port
     to 3001)
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
        "idToken": "YOUR_FIREBASE_ID_TOKEN_HERE"
     }
     ```
   - **How to get Firebase ID Token**:
     - Use your frontend app to login
     - In browser dev tools, check Network tab for Firebase auth requests
     - Or add console.log in your frontend auth code to print the token

   **🚨 Troubleshooting "Invalid or expired Firebase token" Error:**

   **Step 1: Check your Postman request**
   - Make sure you're using `POST` method
   - Make sure you've set `Content-Type: application/json` header
   - Make sure you're sending a raw JSON body, not form data
   - Make sure the JSON is valid (no syntax errors)

   **Step 2: Set up Firebase Admin SDK properly**
   - Create a Firebase project at
     [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Create a `.env` file in the `surprizen-api` directory using the
     `.env.example` as a template
   - Fill in the Firebase values from the downloaded JSON file

   **Step 3: Restart your API server**
   - Stop the current server (Ctrl+C)
   - Start it again: `npm run dev`
   - Check the logs to make sure it loads the environment variables
   - Expected Response:
     ```json
     {
        "success": true,
        "data": {
           "accessToken": "jwt_token_here",
           "refreshToken": "refresh_token_here",
           "expiresIn": 3600
        }
     }
     ```

   **Test 3: Verify Session (Requires JWT Token)**
   - Method: `GET`
   - URL: `http://localhost:5000/api/v1/auth/verify-session`
   - Headers:
     - `Authorization: Bearer YOUR_JWT_ACCESS_TOKEN_HERE`
   - Expected Response:
     ```json
     {
        "success": true,
        "message": "Session is valid",
        "user": {
           "uid": "user_id",
           "email": "user@example.com"
        }
     }
     ```

   **Test 4: Get User Profile (Requires JWT Token)**
   - Method: `GET`
   - URL: `http://localhost:5000/api/v1/auth/profile`
   - Headers:
     - `Authorization: Bearer YOUR_JWT_ACCESS_TOKEN_HERE`
   - Expected Response:
     ```json
     {
        "success": true,
        "data": {
           "id": "user_id",
           "email": "user@example.com",
           "displayName": "User Name",
           "createdAt": "timestamp",
           "lastLoginAt": "timestamp"
        }
     }
     ```

   **Test 5: Update User Profile (Requires JWT Token)**
   - Method: `POST`
   - URL: `http://localhost:5000/api/v1/auth/profile`
   - Headers:
     - `Authorization: Bearer YOUR_JWT_ACCESS_TOKEN_HERE`
     - `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
        "displayName": "Updated Name",
        "preferences": {
           "notificationPreferences": {
              "email": true,
              "push": false
           }
        }
     }
     ```

   **Test 6: Refresh Token**
   - Method: `POST`
   - URL: `http://localhost:5000/api/v1/auth/refresh-token`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
        "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
     }
     ```
   - Expected Response:
     ```json
     {
        "success": true,
        "data": {
           "accessToken": "new_jwt_token_here",
           "expiresIn": 3600
        }
     }
     ```

   **Testing Order**:
   1. Start with Health Check to ensure API is running
   2. Create Session (you'll need Firebase setup first)
   3. Use the returned JWT token for all other protected endpoints
   4. Test token refresh with the returned refresh token

## Integration Testing

1. **Connect Frontend to Backend**
   - Update the frontend to use the backend API for session management
   - Add API service in the frontend to handle authentication requests
   - Test the complete authentication flow from frontend to backend

2. **Verify Session Persistence**
   - Test that sessions persist for the expected duration (30 days)
   - Verify that token refresh works correctly
   - Test automatic session restoration when the app is reopened

## Security Testing

1. **Verify Token Security**
   - Ensure JWT tokens are properly validated
   - Test token expiration handling
   - Verify that protected routes require authentication

2. **Test Error Handling**
   - Test invalid credentials scenarios
   - Test expired token scenarios
   - Verify appropriate error messages are displayed to users

## Documentation

1. **Update README Files**
   - Document the authentication flow
   - Add setup instructions for new developers
   - Include API endpoint documentation

2. **Create User Guide**
   - Document the user registration process
   - Document the login process
   - Document password reset functionality

## Next Steps

After completing the authentication system, proceed to the next tasks in the
implementation plan:

- Task 3.1: Create conversational UI components
- Task 3.2: Implement Vertex AI integration for Vision Chatbot

## Google Gemini API Setup (Task 3.2)

### 1. Get Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Backend Environment
1. Add the API key to your `surprizen-api/.env` file:
   ```
   GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
   ```
2. Restart your backend server:
   ```bash
   cd surprizen-api
   npm run dev
   ```

### 3. Test Google Gemini Integration
1. **Start both servers** (backend and frontend)
2. **Navigate to Vision Chat** from the Home screen
3. **Test the AI conversation**:
   - Should get intelligent responses from Google Gemini
   - Profile card should update based on conversation
   - Quick reply options should be contextually relevant
4. **Check server logs** for Gemini API calls and responses

### 4. Expected Behavior
- ✅ **Intelligent Responses**: AI should provide contextual, natural responses
- ✅ **Profile Updates**: Information should be extracted and stored in profile card
- ✅ **Dynamic Quick Replies**: Options should change based on conversation context
- ✅ **Conversation Flow**: Should guide user through gift planning process

### 5. Troubleshooting
- **API Key Error**: Make sure the GOOGLE_GEMINI_API_KEY is set correctly in your .env file
- **Network Errors**: Check that your backend server can access the Google AI API
- **Response Parsing**: Check server logs for any JSON parsing errors from Gemini responses
- **Fallback Responses**: If Gemini fails, the system should provide fallback responses

## Next Steps After Task 3.2

After completing the Vision Chatbot with Google Gemini API:
- Task 3.3: Build profile card component (✅ Already completed)
- Task 3.4: Implement quick-reply chip system (✅ Already completed)
- Task 4.1: Create strategy conversation flow