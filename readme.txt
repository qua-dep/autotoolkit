==============================
Marketo Program Dashboard
==============================

Last Updated: July 22, 2025

## Table of Contents

1.  Overview
2.  Features
3.  Technology Stack
4.  Project Structure
5.  Setup and Installation
6.  API Endpoints
7.  Notes for Developers

---

### 1. Overview

This is a full-stack web application that provides a dashboard for interacting with the Marketo REST API. It allows users to search for a Marketo program by name and view all of its associated assets in a single, organized interface. The primary goal is to provide a tool for managing and performing bulk status changes on assets within a program, such as activating campaigns or approving emails.

The application operates as a single-page interface powered by a Node.js backend that securely communicates with the Marketo API.

---

### 2. Features

* **Marketo Authentication**: The backend handles OAuth 2.0 authentication with the Marketo API and automatically caches the access token to optimize API calls.
* **Program Search**: Users can search for any Marketo program by its exact name.
* **Comprehensive Asset View**: Fetches and displays a wide range of assets from a program, including:
    * Batch & Trigger Smart Campaigns
    * Emails
    * Landing Pages
    * Forms
    * Smart Lists & Static Lists
* **Interactive UI**:
    * **Tabbed Interface**: Open multiple programs in different tabs for easy comparison and management.
    * **Filtering & Sorting**: Filter the asset list by type and sort by name, type, or status.
    * **Individual Actions**: Use UI toggles to activate/deactivate campaigns or approve/unapprove emails and landing pages individually.
    * **Bulk Actions**: Select multiple assets and perform bulk status changes (e.g., Approve All, Deactivate All).

---

### 3. Technology Stack

* **Backend**:
    * **Runtime**: Node.js
    * **Framework**: Express.js
    * **Dependencies**:
        * `axios`: For making HTTP requests to the Marketo API.
        * `cors`: To handle Cross-Origin Resource Sharing.
        * `dotenv`: To manage environment variables for credentials.
* **Frontend**:
    * **Languages**: HTML5, CSS, Vanilla JavaScript (ES6+)
    * **Styling**: Tailwind CSS (loaded via CDN)
* **API**:
    * Interacts directly with the Marketo REST API for all asset and program data.

---

### 4. Project Structure

/
|-- server.js           # Main backend server file, handles all API logic.
|-- index.html          # The single-page frontend application. Contains all UI and client-side logic.
|-- .env                # (Required, not provided) Stores Marketo API credentials.
|-- package.json        # (Implied) Lists backend dependencies.
|-- /public
    |-- styles.css      # (Implied) Custom styles for the application.

---

### 5. Setup and Installation

1.  **Install Dependencies**: Navigate to the project root and run:
    `npm install`

2.  **Create Environment File**: Create a `.env` file in the project root. This is required for API authentication. Add the following variables with your Marketo instance details:
    `MUNCHKIN_ID=your-munchkin-id`
    `CLIENT_ID=your-client-id`
    `CLIENT_SECRET=your-client-secret`
    `PORT=3001`

3.  **Start the Server**: Run the following command from the project root:
    `node server.js`

4.  **Access the Application**: Open your web browser and navigate to `http://localhost:3001` (or the port you specified in your `.env` file).

---

### 6. API Endpoints

The `server.js` file exposes the following REST endpoints for the frontend to consume.

* `GET /api/programs/search?name=<programName>`
    * Searches for a program by name and returns its details along with a comprehensive list of all associated assets.

* `POST /api/campaigns/:id/activate`
    * Activates the specified Smart Campaign.

* `POST /api/campaigns/:id/deactivate`
    * Deactivates the specified Smart Campaign.

* `POST /api/emails/:id/approve`
    * Approves the specified email draft.

* `POST /api/emails/:id/unapprove`
    * Unapproves the specified email.

* `POST /api/landingPages/:id/approve`
    * Approves the specified landing page draft.

* `POST /api/landingPages/:id/unapprove`
    * Unapproves the specified landing page.

* `POST /api/assets/bulk-action`
    * Performs an action ('approve' or 'unapprove') on a list of assets sent in the request body.

---

### 7. Notes for Developers

* **Missing Endpoint**: The frontend code in `index.html` attempts to call a `/api/instance/info` endpoint to display API usage statistics on the home page. This endpoint is **not** defined in the provided `server.js` file. It will need to be implemented for the "Instance Information" section to function correctly.
* **Error Handling**: The backend includes basic error handling that forwards messages from the Marketo API to the frontend. The frontend displays these messages in a designated error div.
* **Static Files**: The server is configured to serve static files from a `/public` directory. This is where `styles.css` should be placed.
