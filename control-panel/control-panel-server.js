// control-panel-server.js
// This server acts as a remote control for your main application server.

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
// The port our control panel will run on. This is different from your main app's port.
const PORT = 3000; 

// --- CONFIGURATION ---
// This configuration tells the control panel where to find your main server file.
// It's set up to work from within a 'control-panel' sub-directory.
const SERVER_FILENAME = 'server.js';
const SERVER_DIRECTORY = path.join(__dirname, '..', 'js'); // Correctly points to the 'js' folder
const SERVER_COMMAND = 'node';
// --------------------

let serverProcess = null; // This will hold our running server process.

app.use(express.json());

// Serve the HTML file for the UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to start the server
app.post('/start', (req, res) => {
    if (serverProcess) {
        return res.status(400).json({ status: 'error', message: 'Server is already running.' });
    }

    console.log(`Starting server: ${SERVER_COMMAND} ${SERVER_FILENAME} in ${SERVER_DIRECTORY}`);
    // Use spawn to run the server command in its correct directory.
    serverProcess = spawn(SERVER_COMMAND, [SERVER_FILENAME], { cwd: SERVER_DIRECTORY });

    // Listen for output from the server's console
    serverProcess.stdout.on('data', (data) => {
        console.log(`[App Server]: ${data}`);
    });

    // Listen for errors from the server
    serverProcess.stderr.on('data', (data) => {
        console.error(`[App Server Error]: ${data}`);
    });

    // Handle the server process closing
    serverProcess.on('close', (code) => {
        console.log(`App server process exited with code ${code}`);
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
