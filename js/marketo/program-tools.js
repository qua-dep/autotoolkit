// public/js/marketo/program-tools.js

export function initProgramTools(container, appManager) {
    const state = appManager.getProgramToolsState();

    // --- Icons and Labels (for rendering) ---
    const icons = {
        program: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>`,
        email: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`,
        smartCampaignTrigger: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
        smartCampaignBatch: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>`,
        landingPage: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
        form: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`,
        smartList: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>`
    };
    const assetTypeLabels = {
        program: 'Program', email: 'Email', smartCampaignTrigger: 'Trigger Campaign',
        smartCampaignBatch: 'Batch Campaign', landingPage: 'Landing Page', form: 'Form',
        smartList: 'Smart List', list: 'List'
    };

    const content = document.createElement('div');
    content.innerHTML = `
        <div class="mb-6">
            <form id="searchForm" class="relative flex items-center w-full">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
                </div>
                <input type="text" class="form-input w-full pl-10 pr-4 py-2 border border-gray-200 rounded-l-md focus:ring-blue-500 focus:border-blue-500 border-r-0" id="programName" placeholder="Search by program name..." required>
                <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-r-md shadow-sm flex items-center justify-center" type="submit">
                Search
                </button>
            </form>
        </div>
        <div id="loader" class="hidden my-8 flex justify-center items-center gap-3">
            <div class="spinner h-8 w-8 rounded-full border-4 border-gray-200"></div>
            <span class="text-gray-600">Searching...</span>
        </div>
        <div id="errorMessage" class="hidden my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"></div>
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div id="tab-container" class="border-b border-gray-200">
                <div id="tab-bar" class="flex px-4"></div>
            </div>
            <div id="tab-content-container"></div>
        </div>
    `;
    container.appendChild(content);

    const searchForm = container.querySelector('#searchForm');
    const programNameInput = container.querySelector('#programName');
    const loader = container.querySelector('#loader');
    const errorMessageDiv = container.querySelector('#errorMessage');
    const tabBar = container.querySelector('#tab-bar');
    const tabContentContainer = container.querySelector('#tab-content-container');

    async function performSearch(programName) {
        const user = appManager.getCurrentUser();
        const connectionId = appManager.getSelectedConnectionId();
        if (!connectionId) {
            showError("Please select a connection first.");
            return;
        }
        showLoader();
        try {
            const response = await fetch(`/api/programs/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: programName, uid: user.uid, connectionId: connectionId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'An unknown error occurred.');
            
            const newTab = {
                id: data.program.id,
                program: data.program,
                assets: data.assets,
                activeFilters: new Set(Object.keys(assetTypeLabels)),
                selectedAssets: new Set(),
                sort: { column: 'name', direction: 'asc' },
                pagination: { currentPage: 1, perPage: 10 }
            };
            appManager.addProgramTab(newTab);

        } catch (err) {
            showError(`Error: ${err.message}`);
        } finally {
            hideLoader();
        }
    }

    function renderUI() {
        renderTabBar();
        const activeTab = state.tabs.find(t => t.id === state.activeTabId);
        if (activeTab) {
            let tabContent = document.getElementById(`tab-content-${state.activeTabId}`);
            if (!tabContent) {
                tabContent = createTabContent(state.activeTabId);
                tabContentContainer.innerHTML = '';
                tabContentContainer.appendChild(tabContent);
                addEventListenersToTab(tabContent);
            }
            
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            tabContent.classList.remove('hidden');

            renderProgramDetails(activeTab);
            renderActiveFilters(activeTab);
            renderAssets(activeTab);
        } else {
            tabContentContainer.innerHTML = '';
        }
    }

    function renderTabBar() {
        tabBar.innerHTML = '';
        state.tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            const isActive = state.activeTabId === tab.id;
            tabButton.className = `tab-button text-sm font-medium border-b-2 py-3 px-4 flex items-center ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;
            if(isActive) tabButton.style.marginBottom = '-1px';
            tabButton.dataset.tabId = tab.id;
            tabButton.innerHTML = `<span>${tab.program.name}</span><button data-close-id="${tab.id}" class="close-tab-btn ml-3 text-gray-400 hover:text-gray-600">&times;</button>`;
            tabBar.appendChild(tabButton);
        });
    }

    function createTabContent(tabId) {
        const content = document.createElement('div');
        content.id = `tab-content-${tabId}`;
        content.className = 'tab-content';
        let filterCheckboxesHTML = Object.entries(assetTypeLabels)
            .filter(([type]) => type !== 'program')
            .map(([type, label]) => `
                <label class="flex items-center space-x-2">
                    <input type="checkbox" data-filter-type="${type}" class="asset-filter-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm text-gray-700">${label}</span>
                </label>
            `).join('');
        content.innerHTML = `<div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="programDetails grid grid-cols-1 sm:grid-cols-3 gap-6 flex-grow"></div>
                    <div class="flex-shrink-0 ml-4">
                        <button class="refresh-btn bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md shadow-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 17H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" /></svg>
                            Refresh
                        </button>
                    </div>
                </div>
                <div class="filter-controls-container border-t border-b border-gray-200 py-3 mb-4">
                    <div class="flex items-center gap-4">
                        <span class="text-sm font-medium text-gray-700">Filter by Type:</span>
                        <div class="flex-grow flex items-center flex-wrap gap-x-4 gap-y-2">${filterCheckboxesHTML}</div>
                        <div class="flex-shrink-0">
                            <button class="filter-select-all text-sm font-medium text-blue-600 hover:text-blue-800">Select All</button>
                            <span class="text-gray-300 mx-1">|</span>
                            <button class="filter-select-none text-sm font-medium text-blue-600 hover:text-blue-800">Select None</button>
                        </div>
                    </div>
                </div>
                <div class="bulkActionBar hidden bg-gray-100 p-3 rounded-md mb-4 flex items-center justify-between">
                    <span class="selectionCount font-medium text-sm text-gray-700"></span>
                    <div>
                        <button data-action="activate" class="bulk-action-btn bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-1 px-3 rounded-md">Activate</button>
                        <button data-action="deactivate" class="bulk-action-btn bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1 px-3 rounded-md ml-2">Deactivate</button>
                        <button data-action="approve" class="bulk-action-btn bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded-md ml-2">Approve</button>
                        <button data-action="unapprove" class="bulk-action-btn bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-1 px-3 rounded-md ml-2">Unapprove</button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-4 text-left"><input type="checkbox" class="selectAllCheckbox h-4 w-4 text-blue-600 rounded"></th>
                                <th class="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="sort-btn" data-sort="type">Asset Type</button></th>
                                <th class="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="sort-btn" data-sort="name">Name</button></th>
                                <th class="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="sort-btn" data-sort="status">Status</button></th>
                                <th class="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="assetList bg-white divide-y divide-gray-200"></tbody>
                    </table>
                </div>
                <div class="noAssetsMessage hidden p-6 text-center text-gray-500">No assets found for the current filter selection.</div>
                <div class="pagination-controls hidden mt-4 flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select class="results-per-page-select border-gray-300 rounded-md shadow-sm">
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="pagination-info"></span>
                        <button class="prev-page-btn p-1 rounded-md hover:bg-gray-100 disabled:opacity-50" disabled>&lt;</button>
                        <button class="next-page-btn p-1 rounded-md hover:bg-gray-100 disabled:opacity-50" disabled>&gt;</button>
                    </div>
                </div>
            </div>`;
        return content;
    }
    
    function addEventListenersToTab(tabContentElement) {
        const tabId = parseInt(tabContentElement.id.replace('tab-content-', ''));
        const getTab = () => state.tabs.find(t => t.id === tabId);
        
        tabContentElement.addEventListener('change', (e) => {
            if (e.target.matches('[data-action-toggle]')) {
                handleSingleActionToggle(e.target);
            } else if (e.target.matches('.asset-checkbox') || e.target.matches('.selectAllCheckbox')) {
                const tab = getTab();
                const selectAll = tabContentElement.querySelector('.selectAllCheckbox');
                if (e.target === selectAll) {
                    tabContentElement.querySelectorAll('.asset-checkbox').forEach(cb => cb.checked = selectAll.checked);
                }
                updateBulkActionBar(tab);
            } else if (e.target.matches('.results-per-page-select')) {
                const tab = getTab();
                tab.pagination.perPage = parseInt(e.target.value, 10);
                tab.pagination.currentPage = 1;
                renderAssets(tab);
            }
        });
        
        tabContentElement.addEventListener('click', (e) => {
            const currentTab = getTab();
            if (!currentTab) return;

            if (e.target.closest('.sort-btn')) {
                const newSortColumn = e.target.closest('.sort-btn').dataset.sort;
                if (currentTab.sort.column === newSortColumn) {
                    currentTab.sort.direction = currentTab.sort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentTab.sort.column = newSortColumn;
                    currentTab.sort.direction = 'asc';
                }
                renderAssets(currentTab);
            } else if (e.target.closest('.prev-page-btn')) {
                if (currentTab.pagination.currentPage > 1) {
                    currentTab.pagination.currentPage--;
                    renderAssets(currentTab);
                }
            } else if (e.target.closest('.next-page-btn')) {
                const filteredAssets = currentTab.assets.filter(asset => currentTab.activeFilters.has(getFilterableAssetType(asset)));
                const totalPages = Math.ceil(filteredAssets.length / currentTab.pagination.perPage);
                if (currentTab.pagination.currentPage < totalPages) {
                    currentTab.pagination.currentPage++;
                    renderAssets(currentTab);
                }
            } else if (e.target.closest('.filter-controls-container')) {
                handleFilterChange(e, currentTab);
            } else if (e.target.closest('.bulkActionBar')) {
                const button = e.target.closest('.bulk-action-btn');
                if (button) performBulkAction(button.dataset.action, currentTab);
            } else if (e.target.closest('.refresh-btn')) {
                const lastSearch = state.tabs.find(t=>t.id === state.activeTabId)?.program.name;
                if (lastSearch) performSearch(lastSearch);
            }
        });
    }

    function handleFilterChange(e, tab) {
        let filtersChanged = false;
        if (e.target.matches('.asset-filter-checkbox')) {
            const filterType = e.target.dataset.filterType;
            if (e.target.checked) tab.activeFilters.add(filterType);
            else tab.activeFilters.delete(filterType);
            filtersChanged = true;
        } else if (e.target.matches('.filter-select-all')) {
            tab.activeFilters = new Set(Object.keys(assetTypeLabels));
            renderActiveFilters(tab);
            filtersChanged = true;
        } else if (e.target.matches('.filter-select-none')) {
            tab.activeFilters.clear();
            renderActiveFilters(tab);
            filtersChanged = true;
        }
        if (filtersChanged) {
            tab.pagination.currentPage = 1;
            renderAssets(tab);
        }
    }

    async function handleSingleActionToggle(toggle) {
        const id = toggle.id.replace('toggle-', '');
        const assetType = toggle.dataset.assetType;
        let action;
        if (assetType === 'smartCampaign') {
            action = toggle.checked ? 'activate' : 'deactivate';
        } else {
            action = toggle.checked ? 'approve' : 'unapprove';
        }
        const endpoint = `/api/${assetType === 'smartCampaign' ? 'campaigns' : assetType + 's'}/${id}/${action}`;
        const actionContainer = toggle.closest('[data-action-container]');
        const spinner = document.createElement('div');
        spinner.className = 'spinner h-5 w-5 rounded-full border-2 border-gray-200';
        actionContainer.innerHTML = '';
        actionContainer.appendChild(spinner);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: appManager.getCurrentUser().uid, connectionId: appManager.getSelectedConnectionId() })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            appManager.showToast(result.message, 'success');
            appManager.updateAssetState(result.data);
            const activeTab = state.tabs.find(t => t.id === state.activeTabId);
            renderAssets(activeTab);

        } catch (err) {
            appManager.showToast(err.message, 'error');
            const lastSearch = state.tabs.find(t=>t.id === state.activeTabId)?.program.name;
            if (lastSearch) await performSearch(lastSearch);
        }
    }
    
    async function performBulkAction(action, tab) {
        if (!tab || tab.selectedAssets.size === 0) return;
        
        const assetsToUpdate = tab.assets
            .filter(asset => tab.selectedAssets.has(String(asset.id)))
            .filter(asset => {
                if (action === 'activate' || action === 'deactivate') {
                    return asset.assetType === 'smartCampaign';
                }
                if (action === 'approve' || action === 'unapprove') {
                    return asset.assetType === 'email' || asset.assetType === 'landingPage';
                }
                return false;
            });
        
        if (assetsToUpdate.length === 0) {
            alert(`No assets of the correct type were selected for the action: "${action}"`);
            return;
        }

        showLoader();
        try {
            const res = await fetch('/api/assets/bulk-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assets: assetsToUpdate.map(a => ({ id: a.id, assetType: a.assetType })), 
                    action, 
                    uid: appManager.getCurrentUser().uid, 
                    connectionId: appManager.getSelectedConnectionId() 
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            appManager.showToast(result.message, 'success');
            const lastSearch = state.tabs.find(t=>t.id === state.activeTabId)?.program.name;
            if (lastSearch) await performSearch(lastSearch);
        } catch (err) {
            appManager.showToast(`Bulk action failed: ${err.message}`, 'error');
        } finally {
            hideLoader();
        }
    }

    function renderProgramDetails(tab) {
        const content = document.querySelector(`#tab-content-${tab.id} .programDetails`);
        if (!content) return;
        const { program } = tab;
        content.innerHTML = `<div><p class="text-sm text-gray-500">Name</p><p class="font-medium">${program.name}</p></div><div><p class="text-sm text-gray-500">ID</p><p class="font-medium">${program.id}</p></div><div><p class="text-sm text-gray-500">Channel</p><p class="font-medium">${program.channel}</p></div>`;
    }
    
    function renderActiveFilters(tab) {
        const content = document.getElementById(`tab-content-${tab.id}`);
        if (!content) return;
        const filterCheckboxes = content.querySelectorAll('.asset-filter-checkbox');
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = tab.activeFilters.has(checkbox.dataset.filterType);
        });
    }
    
    function renderAssets(tab) {
        const content = document.getElementById(`tab-content-${tab.id}`);
        if (!content) return;
    
        const assetListBody = content.querySelector('.assetList');
        const noAssetsMessage = content.querySelector('.noAssetsMessage');
        const paginationControls = content.querySelector('.pagination-controls');
        assetListBody.innerHTML = '';
        
        let filteredAssets = tab.assets.filter(asset => {
            const type = getFilterableAssetType(asset);
            return tab.activeFilters.has(type);
        });
        
        const { column, direction } = tab.sort;
        filteredAssets.sort((a, b) => {
            let valA, valB;
            if (column === 'type') {
                valA = getAssetTypeLabel(a);
                valB = getAssetTypeLabel(b);
            } else if (column === 'status') {
                valA = getStatusText(a);
                valB = getStatusText(b);
            } else {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        const { currentPage, perPage } = tab.pagination;
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const paginatedAssets = filteredAssets.slice(start, end);

        noAssetsMessage.classList.toggle('hidden', filteredAssets.length > 0);
        assetListBody.classList.toggle('hidden', paginatedAssets.length === 0);
        paginationControls.classList.toggle('hidden', filteredAssets.length === 0);
    
        paginatedAssets.forEach(asset => {
            const row = document.createElement('tr');
            row.id = `asset-${asset.id}`;
            const isActionable = asset.assetType === 'email' || asset.assetType === 'landingPage' || asset.assetType === 'smartCampaign';
            
            let statusHtml = getStatusHtml(asset);
            let toggleHtml = getToggleHtml(asset);
            let iconHtml = getIconHtml(asset);
            let labelHtml = getAssetTypeLabel(asset);
            let checkboxHtml = isActionable ? `<input type="checkbox" data-asset-id="${asset.id}" class="asset-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded">` : '';
    
            row.innerHTML = `<td class="p-4">${checkboxHtml}</td><td class="p-4 whitespace-nowrap text-sm"><div class="flex items-center"><div class="w-5 h-5 mr-3">${iconHtml}</div><span>${labelHtml}</span></div></td><td class="p-4 whitespace-nowrap font-medium">${asset.name}</td><td class="p-4 whitespace-nowrap text-sm">${statusHtml}</td><td class="p-4 text-center"><div class="inline-flex items-center justify-center h-6" data-action-container="${asset.id}">${toggleHtml}</div></td>`;
            assetListBody.appendChild(row);
        });
        
        updateSortIndicators(tab);
        updatePaginationControls(tab, filteredAssets.length);
        updateBulkActionBar(tab);
    }

    function updateSortIndicators(tab) {
        const content = document.getElementById(`tab-content-${tab.id}`);
        content.querySelectorAll('.sort-btn').forEach(btn => {
            const baseText = btn.dataset.sort.charAt(0).toUpperCase() + btn.dataset.sort.slice(1).replace(/([A-Z])/g, ' $1');
            btn.innerHTML = baseText;
            if (btn.dataset.sort === tab.sort.column) {
                btn.innerHTML += tab.sort.direction === 'asc' ? ' &uarr;' : ' &darr;';
            }
        });
    }

    function updatePaginationControls(tab, totalFiltered) {
        const content = document.getElementById(`tab-content-${tab.id}`);
        const { currentPage, perPage } = tab.pagination;
        const totalPages = Math.ceil(totalFiltered / perPage);

        const info = content.querySelector('.pagination-info');
        const prevBtn = content.querySelector('.prev-page-btn');
        const nextBtn = content.querySelector('.next-page-btn');
        const perPageSelect = content.querySelector('.results-per-page-select');

        perPageSelect.value = perPage;

        if (totalFiltered > 0) {
            const start = (currentPage - 1) * perPage + 1;
            const end = Math.min(start + perPage - 1, totalFiltered);
            info.textContent = `${start}-${end} of ${totalFiltered}`;
        } else {
            info.textContent = '0 results';
        }

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    function getStatusText(asset) {
        if (asset.assetType === 'smartCampaign') return asset.isActive ? 'Active' : 'Inactive';
        if (asset.assetType === 'email' || asset.assetType === 'landingPage') {
            return (asset.status === 'approved' || asset.status === 'approved with draft') ? 'Approved' : 'Not Approved';
        }
        return '';
    }
    
    function getFilterableAssetType(asset) {
        if (asset.assetType === 'smartCampaign') {
            return asset.type === 'batch' ? 'smartCampaignBatch' : 'smartCampaignTrigger';
        }
        return asset.assetType;
    }
    
    function getAssetTypeLabel(asset) {
        return assetTypeLabels[getFilterableAssetType(asset)] || asset.assetType;
    }
    
    function getIconHtml(asset) {
        return icons[getFilterableAssetType(asset)] || '';
    }
    
    function getStatusHtml(asset) {
        if (asset.assetType === 'smartCampaign') {
            return `<div class="flex items-center"><div class="h-2.5 w-2.5 rounded-full ${asset.isActive ? 'bg-green-500' : 'bg-gray-400'} mr-2"></div>${asset.isActive ? 'Active' : 'Inactive'}</div>`;
        }
        if (asset.assetType === 'email' || asset.assetType === 'landingPage') {
            const isApproved = asset.status === 'approved' || asset.status === 'approved with draft';
            return `<div class="flex items-center"><div class="h-2.5 w-2.5 rounded-full ${isApproved ? 'bg-green-500' : 'bg-gray-400'} mr-2"></div>${isApproved ? 'Approved' : 'Not Approved'}</div>`;
        }
        return '<span class="text-gray-400">-</span>';
    }
    
    function getToggleHtml(asset) {
        let isChecked, assetTypeForToggle;
        if (asset.assetType === 'smartCampaign') {
            isChecked = asset.isActive;
            assetTypeForToggle = 'smartCampaign';
        } else if (asset.assetType === 'email' || asset.assetType === 'landingPage') {
            isChecked = asset.status === 'approved' || asset.status === 'approved with draft';
            assetTypeForToggle = asset.assetType;
        } else {
            return '<span class="text-gray-400">-</span>';
        }
        return `<div class="relative inline-block w-10 align-middle select-none"><input type="checkbox" data-asset-type="${assetTypeForToggle}" data-action-toggle id="toggle-${asset.id}" class="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer transition-transform duration-200 ease-in-out checked:translate-x-4 checked:border-blue-600" ${isChecked ? 'checked' : ''}/><label for="toggle-${asset.id}" class="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-blue-600"></label></div>`;
    }
    function updateBulkActionBar(tab) {
        if (!tab) return;
        const content = document.getElementById(`tab-content-${tab.id}`);
        if (!content) return;
        const actionBar = content.querySelector('.bulkActionBar');
        const selectionCount = content.querySelector('.selectionCount');
        const selectedCheckboxes = content.querySelectorAll('.assetList .asset-checkbox:checked');
        
        tab.selectedAssets.clear();
        selectedCheckboxes.forEach(cb => tab.selectedAssets.add(cb.dataset.assetId));
    
        actionBar.classList.toggle('hidden', tab.selectedAssets.size === 0);
        if (tab.selectedAssets.size > 0) {
            selectionCount.textContent = `${tab.selectedAssets.size} asset(s) selected`;
        }
        updateSelectAllCheckboxState(tab);
    }
    
    function updateSelectAllCheckboxState(tab) {
        const content = document.getElementById(`tab-content-${tab.id}`);
        if (!content) return;
        const selectAllCheckbox = content.querySelector('.selectAllCheckbox');
        const allRenderedCheckboxes = content.querySelectorAll('.assetList .asset-checkbox');
        const checkedRenderedCheckboxes = content.querySelectorAll('.assetList .asset-checkbox:checked');
        if (allRenderedCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedRenderedCheckboxes.length === allRenderedCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedRenderedCheckboxes.length > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    function showLoader() { loader.classList.remove('hidden'); errorMessageDiv.classList.add('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
    function showError(message) { 
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.toggle('hidden', !message);
    }

    renderUI(); 

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const programName = programNameInput.value.trim();
        if (programName) performSearch(programName);
    });

    tabBar.addEventListener('click', (e) => {
        const tabButton = e.target.closest('.tab-button');
        const closeButton = e.target.closest('.close-tab-btn');
        if (closeButton) {
            e.stopPropagation();
            appManager.removeProgramTab(parseInt(closeButton.dataset.closeId, 10));
        } else if (tabButton) {
            appManager.setActiveProgramTab(parseInt(tabButton.dataset.tabId, 10));
        }
    });
}
