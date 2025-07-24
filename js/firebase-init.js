// js/firebase-init.js

// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCRdqHyT3xFbcsrhTZ3d4vUVSORSh4YzXI",
  authDomain: "autotoolkit-web-app.firebaseapp.com",
  projectId: "autotoolkit-web-app",
  storageBucket: "autotoolkit-web-app.firebasestorage.app",
  messagingSenderId: "339805363283",
  appId: "1:339805363283:web:fab4149f211e3a93993aa6",
  measurementId: "G-V8C9N3F02K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export the initialized 'auth' instance so other scripts can use it
export { auth };
