// control-panel-server.js
// This server acts as a remote control for your main application server.
// It's designed to live in a sub-directory (e.g., 'control-panel').

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000; // The port our control panel will run on.

// --- CONFIGURATION ---
// The file to run, located in the parent directory.
const SERVER_FILENAME = 'server.js';
// The directory where server.js is located.
const SERVER_DIRECTORY = path.join(__dirname, '../js');
const SERVER_COMMAND = 'node';
// --------------------

let serverProcess = null; // This will hold our running server process.

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the HTML file for the UI from the current directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to start the server
app.post('/start', (req, res) => {
    if (serverProcess) {
        return res.status(400).json({ status: 'error', message: 'Server is already running.' });
    }

    console.log(`Starting server: ${SERVER_COMMAND} ${SERVER_FILENAME} in ${SERVER_DIRECTORY}`);
    // Use spawn to run the server command.
    // Set the `cwd` (current working directory) to the parent directory
    // so `server.js` runs as if you were in that folder. This ensures
    // it can find any files it depends on.
    serverProcess = spawn(SERVER_COMMAND, [SERVER_FILENAME], { cwd: SERVER_DIRECTORY });

    // Listen for output from the server's console
    serverProcess.stdout.on('data', (data) => {
        console.log(`[Server Output]: ${data}`);
    });

    // Listen for errors from the server
    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error]: ${data}`);
    });

    // Handle the server process closing
    serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        serverProcess = null; // Clear the process variable
    });

    res.json({ status: 'success', message: 'Server started successfully.' });
});

// API endpoint to stop the server
app.post('/stop', (req, res) => {
    if (!serverProcess) {
        return res.status(400).json({ status: 'error', message: 'Server is not running.' });
    }

    console.log('Stopping server...');
    // Kill the process. SIGTERM is a graceful way to ask a process to terminate.
    serverProcess.kill('SIGTERM');
    serverProcess = null;

    res.json({ status: 'success', message: 'Server stopped successfully.' });
});

// API endpoint to check the server's status
app.get('/status', (req, res) => {
    if (serverProcess) {
        res.json({ isRunning: true });
    } else {
        res.json({ isRunning: false });
    }
});


app.listen(PORT, () => {
    console.log(`--- Server Control Panel ---`);
    console.log(`Control panel running at http://localhost:${PORT}`);
    console.log(`Point your browser there to start/stop your application.`);
});
