// js/shared-ui.js

import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const headerHTML = `
  <header class="border-b border-gray-200">
    <div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <div class="flex items-center gap-4">
        <a href="/" class="flex items-center gap-3">
          <div class="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 22H22L12 2Z" fill="white"/><path d="M12 11L7 22H17L12 11Z" fill="black"/></svg>
          </div>
          <span class="font-bold text-lg text-gray-800">autotoolkit.io</span>
        </a>
        <!-- App-specific title will be inserted here -->
        <div id="app-title-container" class="hidden md:block"></div>
      </div>
      <div class="flex items-center gap-4 text-gray-500">
         <!-- App-specific controls like the connection selector will go here -->
         <div id="app-header-controls" class="flex items-center gap-4"></div>
         <a href="/" class="hover:text-blue-600" title="Home"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></a>
         <a href="/dashboard.html" class="hover:text-blue-600" title="Dashboard"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></a>
         <div class="relative" id="user-menu-container">
            <button id="user-menu-button" class="hover:text-blue-600" title="Profile"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
            <div id="user-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10"></div>
         </div>
      </div>
    </div>
  </header>
`;

function setupAuthMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    if (!userMenuButton || !userMenuDropdown) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            userMenuDropdown.innerHTML = `
                <a href="/settings.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                <a href="#" id="logout-button" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log Out</a>
            `;
            document.getElementById('logout-button').addEventListener('click', (e) => {
                e.preventDefault();
                signOut(auth).then(() => {
                    window.location.href = '/login.html';
                }).catch((error) => console.error('Sign out error', error));
            });
        } else {
            userMenuDropdown.innerHTML = `
                <a href="/signup.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Up</a>
                <a href="/login.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log In</a>
            `;
        }
    });

    userMenuButton.addEventListener('click', () => {
        userMenuDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuButton.closest('#user-menu-container').contains(e.target)) {
            userMenuDropdown.classList.add('hidden');
        }
    });
}

export function loadHeader() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    setupAuthMenu();
}
