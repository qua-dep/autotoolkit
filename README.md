# autotoolkit.io - Marketo Program Manager

## Overview

This web application provides a custom toolkit for managing Adobe Marketo Engage program assets. It offers a user-friendly, single-page application experience to search for programs, view all their associated assets (emails, campaigns, landing pages, etc.), and perform individual or bulk actions like activating or approving them.

The application is built with a vanilla JavaScript frontend and a Node.js backend, using Firebase for user authentication and persistent data/log storage.

## Tech Stack

| Category              | Technology                                       | Purpose                                                              |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| **Frontend** | HTML5                                            | Structure of the web pages.                                          |
|                       | Tailwind CSS                                     | All styling and layout.                                              |
|                       | Vanilla JavaScript (ES6 Modules)                 | Handles all client-side logic, DOM manipulation, and API calls.      |
|                       | Firebase Client SDK                              | Manages user authentication (sign-up, login, logout) in the browser. |
| **Backend** | Node.js                                          | JavaScript runtime environment.                                      |
|                       | Express.js                                       | Web server framework for handling API routes and serving static files. |
|                       | Firebase Admin SDK                               | Securely interacts with Firebase services from the server.           |
| **Database & Services** | Firebase Authentication                          | Secure user sign-up and login.                                       |
|                       | Firestore                                        | NoSQL database for user profiles, connections, and activity logs.    |
|                       | Adobe Marketo Engage API                         | The external API that this toolkit interacts with.                   |

---

## File Structure

The project is organized into two main directories: `public/` for client-side assets and `js/` for all JavaScript logic (both client and server).

autotoolkit/├── .env                  # Stores secret API keys and Firebase config├── .gitignore            # Specifies files for Git to ignore├── serviceAccountKey.json # Firebase Admin private key (DO NOT COMMIT)├── package.json          # Lists project dependencies and scripts│├── js/│   ├── marketo/          # Client-side modules for the Marketo tool│   │   ├── asset-search.js│   │   ├── debug-log.js│   │   ├── history.js│   │   └── program-tools.js│   ││   ├── firebase-init.js  # Securely initializes Firebase on the client│   ├── server.js         # The Node.js/Express backend server│   └── shared-ui.js      # Dynamically loads the shared header/nav bar│└── public/├── marketo/│   └── app.html      # The main SPA shell for the Marketo toolkit│├── css/│   └── styles.css    # Custom CSS styles for the application│├── dashboard.html    # Hub page after login├── index.html        # Main landing page├── login.html        # User login page└── settings.html     # User profile and connection settings page└── signup.html       # User sign-up page
---

## Application Flow & Module Connections

The application follows a modern single-page application (SPA) architecture, even without a traditional frontend framework.

### 1. Backend Server (`js/server.js`)

The server is the central hub of the application.
-   **Responsibilities:**
    -   Serves all static files from the `public/` and `js/` directories.
    -   Provides a secure `/api/config` endpoint for the frontend to fetch public Firebase keys.
    -   Handles all API requests for user data (profiles, connections) and interacts securely with the Firebase Admin SDK.
    -   Acts as a secure proxy for all calls to the Marketo API, preventing client secrets from being exposed.
    -   Manages a persistent logging system, writing user activity and debug information to Firestore.

### 2. Frontend Application Shell (`public/marketo/app.html`)

This is the core of the Marketo toolkit.
-   **Responsibilities:**
    -   Acts as the main container for the different tool views (Program Tools, History, etc.).
    -   Manages the "global state" for the Marketo tool, including the list of open program tabs and the currently active tab. This state persists as the user navigates between the different tool views.
    -   Handles the main navigation logic, dynamically loading the appropriate JavaScript module into the page when a user clicks a tab.
    -   Manages the global connection selector in the header.

### 3. Frontend Tool Modules (`js/marketo/*.js`)

Each file in this directory represents a distinct tool or "tab" within the Marketo application.
-   **`program-tools.js`**: The main tool for searching programs and managing assets. It is "stateless" and receives its data (open tabs, active tab) from `app.html`. It handles all rendering of the asset table, filters, sorting, and pagination.
-   **`history.js`**: Fetches and displays the user-friendly activity log from the backend.
-   **`debug-log.js`**: Fetches and displays the raw technical/debug logs from the backend.
-   **`asset-search.js`**: (Placeholder) Intended for a global asset search feature.

### 4. Shared & Utility Modules

-   **`js/shared-ui.js`**: This module is imported by every HTML page. It dynamically injects the consistent site header and manages the user authentication menu (Login/Logout buttons).
-   **`js/firebase-init.js`**: This is the first JavaScript module loaded by the application. It securely fetches the Firebase configuration from the backend's `/api/config` endpoint and initializes the Firebase client-side services.

---

## Setup and Installation

1.  **Clone the Repository**
2.  **Install Dependencies:** Run `npm install` to download all required Node.js modules.
3.  **Environment Variables:** Create a `.env` file in the project root and add your Marketo API credentials and public Firebase configuration keys.
4.  **Firebase Service Account:** Download your `serviceAccountKey.json` from the Firebase console and place it in the project root.
5.  **Run the Application:** Start the server with `node js/server.js`. The application will be accessible at `http://localhost:3001`.
