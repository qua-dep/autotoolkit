// Import the initialized auth object from our new config file
import { auth } from './firebase-init.js';
// Import the specific auth functions we need for this file
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// This part runs on every page that includes this script
document.addEventListener('DOMContentLoaded', () => {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    if (!userMenuButton || !userMenuDropdown) {
        return;
    }

    // Use onAuthStateChanged to listen for login/logout events
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in
            userMenuDropdown.innerHTML = `
                <a href="#" id="logout-button" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log Out</a>
            `;
            document.getElementById('logout-button').addEventListener('click', (e) => {
                e.preventDefault();
                signOut(auth).then(() => {
                    // Sign-out successful.
                    console.log('User signed out');
                    window.location.href = '/login.html';
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            });
        } else {
            // User is logged out
            userMenuDropdown.innerHTML = `
                <a href="/signup.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Up</a>
                <a href="/login.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log In</a>
            `;
        }
    });

    // --- Dropdown toggle logic ---
    userMenuButton.addEventListener('click', () => {
        userMenuDropdown.classList.toggle('hidden');
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
            userMenuDropdown.classList.add('hidden');
        }
    });
});
