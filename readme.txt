autotoolkit.io - Marketo Program Manager
This web application provides a custom toolkit for managing Adobe Marketo Engage program assets. It offers a user-friendly interface to search for programs, view all their associated assets (emails, campaigns, landing pages, etc.), and perform actions like activating or approving them.

The application is built with a vanilla JavaScript frontend and a Node.js backend, using Firebase for user authentication and data storage.

Tech Stack
Frontend
HTML5: Structure of the web pages.

Tailwind CSS: For all styling and layout.

Vanilla JavaScript (ES6 Modules): Handles all client-side logic, including DOM manipulation, API calls, and dynamic UI components.

Firebase Client SDK: Manages user authentication (sign-up, login, logout) directly in the browser.

Backend
Node.js: JavaScript runtime environment.

Express.js: Web server framework for handling API routes and serving static files.

Firebase Admin SDK: Securely interacts with Firebase services (like Firestore) from the server.

Database & Services
Firebase Authentication: For secure user sign-up and login.

Firestore: NoSQL database used to store user profile information.

Adobe Marketo Engage API: The external API that this toolkit interacts with.

File Structure
marketo-editor/
├── .env                  # Stores secret API keys for Marketo
├── .gitignore            # Specifies files for Git to ignore (VERY IMPORTANT)
├── serviceAccountKey.json # Firebase Admin private key (DO NOT COMMIT)
├── package.json          # Lists project dependencies
├── node_modules/         # Directory where npm packages are installed
│
├── js/
│   ├── server.js         # The Node.js/Express backend server
│   ├── firebase-init.js  # Centralized Firebase configuration for the frontend
│   └── shared-ui.js      # Dynamically loads the shared header/nav bar
│
└── public/
    ├── css/
    │   └── styles.css    # Custom CSS styles
    ├── index.html        # Main landing page
    ├── dashboard.html    # Hub page after login
    ├── marketo-app.html  # The core Marketo program management tool
    ├── login.html        # User login page
    └── sign-up.html      # User sign-up page

Setup and Installation
Follow these steps to get the project running on your local machine.

Prerequisites
Node.js installed

Git installed

A Firebase project with Authentication and Firestore enabled.

1. Clone the Repository
If your code is on GitHub, clone it to your local machine:

git clone <your-repository-url>
cd marketo-editor

2. Install Dependencies
Install the required Node.js modules:

npm install express axios cors dotenv firebase-admin

3. Environment Variables
Create a file named .env in the root of the project and add your Marketo API credentials:

MUNCHKIN_ID=your-marketo-munchkin-id
CLIENT_ID=your-marketo-api-client-id
CLIENT_SECRET=your-marketo-api-client-secret

4. Firebase Configuration
A. Service Account Key (Backend)

Go to your Firebase project settings and generate a private key for your service account.

Download the resulting JSON file.

Rename it to serviceAccountKey.json and place it in the root of the project directory.

Security Warning: This file is highly sensitive. The .gitignore file is configured to prevent it from being uploaded to GitHub. Never share it publicly.

B. Firebase Config (Frontend)

Open the js/firebase-init.js file.

Find the firebaseConfig object.

Paste your web app's Firebase configuration keys, which you can find in your Firebase project settings.

Running the Application
Open your terminal and navigate to the project's root directory (marketo-editor).

Start the server with the following command:

node js/server.js

The server will start, and you can access the application by opening a web browser and navigating to http://localhost:3001.

Key Modules & Dependencies
express: Backend web framework.

axios: For making HTTP requests to the Marketo API from the server.

cors: Express middleware to enable Cross-Origin Resource Sharing.

dotenv: Loads environment variables from the .env file.

firebase-admin: Allows the backend server to securely interact with Firebase services.