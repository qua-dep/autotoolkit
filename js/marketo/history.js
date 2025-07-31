// public/js/marketo/history.js

export async function initHistory(container, api) {
    // 1. Create the HTML structure for the history tool
    const content = document.createElement('div');
    content.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-lg font-semibold text-black">Activity Log</h2>
                <button id="refresh-logs-btn" class="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 013.5 9" />
                    </svg>
                    Refresh
                </button>
            </div>
            <div id="history-log-container" class="p-4 md:p-6 space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto">
                <!-- Logs will be rendered here -->
            </div>
        </div>
    `;
    container.appendChild(content);

    const historyLogContainer = container.querySelector('#history-log-container');
    const refreshButton = container.querySelector('#refresh-logs-btn');

    // 2. Function to fetch and render logs
    async function loadLogs() {
        historyLogContainer.innerHTML = '<p class="text-gray-500">Loading logs...</p>';
        const currentUser = api.getCurrentUser();
        if (!currentUser) {
            historyLogContainer.innerHTML = '<p class="text-red-500">Error: Not logged in.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/logs/${currentUser.uid}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch logs. Server responded with ${response.status}`);
            }
            const logs = await response.json();

            if (logs.length === 0) {
                historyLogContainer.innerHTML = '<p class="text-gray-500">No activity has been recorded yet.</p>';
                return;
            }

            renderLogs(logs);

        } catch (error) {
            console.error('Error loading logs:', error);
            historyLogContainer.innerHTML = `<p class="text-red-500">Could not load activity logs. ${error.message}</p>`;
        }
    }

    // 3. Function to render the logs into the DOM
    function renderLogs(logs) {
        historyLogContainer.innerHTML = ''; // Clear existing content
        const levelColors = {
            INFO: 'bg-blue-100 text-blue-800',
            WARN: 'bg-yellow-100 text-yellow-800',
            ERROR: 'bg-red-100 text-red-800',
        };

        logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = 'p-3 border rounded-lg bg-gray-50/50';
            logElement.innerHTML = `
                <div class="flex items-center justify-between cursor-pointer" data-log-toggle="${log.id}">
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-semibold uppercase px-2 py-1 rounded-full ${levelColors[log.level] || 'bg-gray-100 text-gray-800'}">${log.level}</span>
                        <span class="font-medium text-gray-800">${log.message}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-gray-500">${new Date(log.timestamp).toLocaleString()}</span>
                        <svg data-arrow="${log.id}" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <div id="details-${log.id}" class="hidden mt-3 pt-3 border-t border-gray-200">
                    <pre class="text-xs bg-gray-900 text-white p-3 rounded-md overflow-x-auto"><code>${log.details}</code></pre>
                </div>
            `;
            historyLogContainer.appendChild(logElement);
        });
    }

    // 4. Add event listeners
    refreshButton.addEventListener('click', loadLogs);
    
    historyLogContainer.addEventListener('click', (e) => {
        const toggleHeader = e.target.closest('[data-log-toggle]');
        if (toggleHeader) {
            const logId = toggleHeader.dataset.logToggle;
            const detailsElement = container.querySelector(`#details-${logId}`);
            const arrowElement = container.querySelector(`[data-arrow="${logId}"]`);
            if (detailsElement) {
                detailsElement.classList.toggle('hidden');
                arrowElement.classList.toggle('rotate-180');
            }
        }
    });

    // 5. Initial load
    await loadLogs();
}
