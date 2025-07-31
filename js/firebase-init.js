// js/firebase-init.js

// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// A variable to hold the initialized auth service
let auth;

// An async function to fetch config and initialize Firebase
async function initializeFirebase() {
  try {
    // Fetch the configuration from our secure backend endpoint
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Could not fetch Firebase config. Is the server running?');
    }
    const firebaseConfig = await response.json();

    // Initialize Firebase with the fetched config
    const app = initializeApp(firebaseConfig);

    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    
    console.log("Firebase initialized successfully.");

  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // You could display an error message to the user on the page
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
        <h1>Error</h1>
        <p>Could not connect to the application services. Please try again later.</p>
        <p style="color: #666; font-size: 0.9rem;">${error.message}</p>
      </div>
    `;
  }
}

// Call the initialization function
await initializeFirebase();

// Export the initialized 'auth' instance so other scripts can use it.
// It will be 'undefined' until the async initialization is complete.
// Other scripts that import 'auth' will get the initialized instance.
export { auth };
