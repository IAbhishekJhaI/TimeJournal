    let serviceAccountKey = null;
    let spreadsheetId = null;
    let accessToken = null;
    let tokenExpiry = null;
    let activities = [];
    let selectedActivity = null;
    let currentDate = null;
    let timeSlots = {};
    let uploadedFile = null;
    const timeManager = new TimeManager();


    // Initialize on page load
    window.onload = function () {
        setupDragAndDrop();
        checkSavedSettings();
    };

    function setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        if (!dropZone || !fileInput) {
            console.error('Drop zone or file input not found!');
            return;
        }
        console.log('Setting up drag and drop...');

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop zone when dragging over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);

        // Handle click on drop zone (but not on browse button)
        dropZone.addEventListener('click', (e) => {
            // Only trigger file input if we didn't click the browse button
            if (!e.target.classList.contains('browse-button')) {
                fileInput.click();
            }
        }, false);

        // Handle file selection via browse button or click
        fileInput.addEventListener('change', (e) => {
            console.log('File input changed', e.target.files.length);
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        }, false);

        console.log('Drag and drop setup complete');
    }

    function handleDrop(e) {
        console.log('File dropped!');
        const dt = e.dataTransfer;
        const files = dt.files;
        console.log('Files:', files.length);
        handleFiles(files);
    }

    function handleFiles(files) {
        console.log('handleFiles called with', files.length, 'files');

        if (files.length === 0) {
            console.log('No files to handle');
            return;
        }

        const file = files[0];
        console.log('Processing file:', file.name, file.type, file.size);

        // Check if it's a JSON file
        if (!file.name.endsWith('.json')) {
            showStatus('Please upload a JSON file', 'error');
            return;
        }

        // Check file size (limit to 1MB for safety)
        if (file.size > 1024 * 1024) {
            showStatus('File too large. JSON files should be under 1MB', 'error');
            return;
        }

        uploadedFile = file;
        console.log('File accepted, reading...');

        // Read the file
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log('File read complete');
            try {
                const jsonContent = e.target.result;
                serviceAccountKey = JSON.parse(jsonContent);
                console.log('JSON parsed successfully');

                // Validate the JSON has required fields
                if (!serviceAccountKey.private_key || !serviceAccountKey.client_email) {
                    throw new Error('Invalid service account JSON - missing required fields');
                }

                console.log('JSON validated, showing file info');
                // Show file info
                showFileInfo(file);
                showStatus('JSON file loaded successfully!', 'success');
                setTimeout(() => {
                    const status = document.getElementById('setupStatus');
                    if (status) {
                        status.innerHTML = '';
                    }
                }, 2000);

            } catch (err) {
                console.error('Error parsing JSON:', err);
                showStatus('Invalid JSON file: ' + err.message, 'error');
                uploadedFile = null;
                serviceAccountKey = null;
            }
        };
        reader.onerror = function () {
            console.error('Error reading file');
            showStatus('Error reading file', 'error');
            uploadedFile = null;
        };
        reader.readAsText(file);
    }

    function showFileInfo(file) {
        console.log('Showing file info for:', file.name);
        const dropZoneContent = document.querySelector('.drop-zone-content');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = fileInfo.querySelector('.file-name');
        const fileSize = fileInfo.querySelector('.file-size');

        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        dropZoneContent.style.display = 'none';
        fileInfo.style.display = 'flex';
        console.log('File info displayed');
    }

    function removeFile() {
        console.log('Removing file');
        uploadedFile = null;
        serviceAccountKey = null;
        document.getElementById('fileInput').value = '';

        const dropZoneContent = document.querySelector('.drop-zone-content');
        const fileInfo = document.getElementById('fileInfo');

        dropZoneContent.style.display = 'block';
        fileInfo.style.display = 'none';

        showStatus('File removed', 'info');
        setTimeout(() => {
            const status = document.getElementById('setupStatus');
            if (status) {
                status.innerHTML = '';
            }
        }, 1500);
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function checkSavedSettings() {
        const savedKey = localStorage.getItem('timeTrackerServiceKey');
        const savedSpreadsheetId = localStorage.getItem('timeTrackerSpreadsheetId');

        if (savedKey && savedSpreadsheetId) {
            try {
                serviceAccountKey = JSON.parse(savedKey);
                spreadsheetId = savedSpreadsheetId;
                getAccessToken().then(() => {
                    showMainContent();
                }).catch(err => {
                    showStatus('Error authenticating: ' + err.message, 'error');
                    document.getElementById('setupSection').style.display = 'block';
                });
            } catch (err) {
                document.getElementById('setupSection').style.display = 'block';
            }
        } else {
            document.getElementById('setupSection').style.display = 'block';
        }
    }

    function saveSettings() {
        const spreadsheetIdInput = document.getElementById('spreadsheetIdInput').value.trim();

        if (!serviceAccountKey) {
            showStatus('Please upload your service account JSON file', 'error');
            return;
        }

        if (!spreadsheetIdInput) {
            showStatus('Please enter your Spreadsheet ID', 'error');
            return;
        }

        try {
            spreadsheetId = spreadsheetIdInput;

            // Save to localStorage
            localStorage.setItem('timeTrackerServiceKey', JSON.stringify(serviceAccountKey));
            localStorage.setItem('timeTrackerSpreadsheetId', spreadsheetId);

            // Get access token and proceed
            getAccessToken().then(() => {
                showMainContent();
            }).catch(err => {
                showStatus('Error authenticating: ' + err.message, 'error');
            });

        } catch (err) {
            showStatus('Invalid JSON format: ' + err.message, 'error');
        }
    }

    function resetSettings() {
        if (confirm('This will clear your saved settings. Continue?')) {
            localStorage.removeItem('timeTrackerServiceKey');
            localStorage.removeItem('timeTrackerSpreadsheetId');
            document.getElementById('mainContent').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
            removeFile();
            document.getElementById('spreadsheetIdInput').value = '';
            serviceAccountKey = null;
            accessToken = null;
            tokenExpiry = null;
        }
    }


    async function getAccessToken() {
        // Check if token is still valid (with 5 minute buffer)
        if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
            return accessToken;
        }

        // Create JWT
        const now = Math.floor(Date.now() / 1000);
        const expiry = now + 3600; // 1 hour

        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const claim = {
            iss: serviceAccountKey.client_email,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: expiry
        };

        // Sign JWT
        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(claim);
        const sJWT = KJUR.jws.JWS.sign('RS256', sHeader, sPayload, serviceAccountKey.private_key);

        // Exchange JWT for access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: sJWT
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get access token: ' + response.statusText);
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000);

        return accessToken;
    }

    async function showMainContent() {
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';

        // Update time window display
        timeManager.updateWindow();
        document.getElementById('timeWindowDisplay').textContent = timeManager.getDisplayRange();

        await loadActivities();
        await loadTimeWindow();

    }

    async function makeApiRequest(endpoint, options = {}) {
        await getAccessToken(); // Ensure token is valid

        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        return response.json();
    }

    //TODO: Refactor renderActivityGrid to handle subcategorical activities with expand/collapse functionality.
    function renderActivityGrid(activityTree) {
        const grid = document.getElementById('activityGrid');
        grid.innerHTML = '';

        activityTree.forEach(activity => {
            //Create wrapper for activity and sub-activities
            const wrapper = document.createElement('div');
            wrapper.className = 'activity-wrapper';

            //create main activty button
            const mainButton = document.createElement('div');
            mainButton.className = 'activity-button';
            if(activity.children && activity.children.length > 0){
                mainButton.classList.add('has-children');
            }
            mainButton.innerHTML = `
                        <div class="activity-code">${activity.code}</div>
                        <div class="activity-name">${activity.activity}</div>
                    `;
            if (activity.children && activity.children.length > 0) {
                mainButton.onclick = (e) => {
                    e.stopPropagation();
                    toggleSubActivities(activity, mainButton, wrapper);
                };
            } else {
                // If no children, directly select this activity on click
                mainButton.onclick = () => selectActivity(activity, mainButton);
            }
            wrapper.appendChild(mainButton);

            //Create sub-activity container (hidden by default)
            if (activity.children && activity.children.length > 0) {
                const subContainer = document.createElement('div');
                subContainer.className = 'sub-activities';
                subContainer.id = `sub-${activity.code}`;

                activity.children.forEach(child => {
                    const subButton = document.createElement('div');
                    subButton.className = 'sub-activity-button';
                    subButton.innerHTML = `
                                <div class="activity-code">${child.code}</div>
                                <div class="activity-name">${child.activity}</div>
                    `;
                    subButton.onclick = (e) => {
                        e.stopPropagation();
                        selectActivity(child, subButton);
                    };
                    subContainer.appendChild(subButton);
                });

                wrapper.appendChild(subContainer);
            }

            grid.appendChild(wrapper);
        });
    }

    function toggleSubActivities(activity, button, wrapper) {
        const subContainer = wrapper.querySelector('.sub-activities');
        const isExpanded = button.classList.contains('expanded');

        if (isExpanded) {
            //Collapse
            button.classList.remove('expanded');
            subContainer.classList.remove('show');
        } else {
            //Expand
            button.classList.add('expanded');
            subContainer.classList.add('show');
        }
    }

    function selectActivity(activity, button) {
        //Remove selection from all activity buttons
        document.querySelectorAll('.activity-button').forEach(btn => {
            btn.classList.remove('selected');
        });

        //Remove selection from all sub-activity buttons
        document.querySelectorAll('.sub-activity-button').forEach(btn => {
            btn.classList.remove('selected');
        });

        //Add selection to clicked button
        button.classList.add('selected');
        selectedActivity = activity;

        console.log('Selected activity:', activity.code, '-', activity.activity);
    }

    async function loadActivities() {
        try {
            showStatus('Loading activities...', 'info');

            const data = await makeApiRequest(
                `${spreadsheetId}/values/Categories!A2:C100`
            );

            const rows = data.values;
            if (!rows || rows.length === 0) {
                showStatus('No activities found. Check your Categories sheet.', 'error');
                return;
            }

            const allActivities = rows.filter(row => row[1] && row[2]).map(row => {
                parent= row[0] || '';   //Column A
                code= row[1];              //Column B
                activity: row[2]

                return{
                    parent: parent,
                    code: code,
                    activity: row[2]
                };
            });
            const parentActivities = [];
            const childActivities = [];

            allActivities.forEach(activity => {
                // If parent is empty or equals code, it's a parent activity
                if (!activity.parent || activity.parent === activity.code) {
                    parentActivities.push(activity);
                } else {
                    childActivities.push(activity);
                }
            });

            // Store all activities for later use
            activities = allActivities;

            // Create hierarchical structure
            const activityTree = parentActivities.map(parent => ({
                ...parent,
                children: childActivities.filter(child => child.parent === parent.code)
            }));

            renderActivityGrid(activityTree);
            showStatus('Activities loaded successfully!', 'success');
            setTimeout(() => document.getElementById('status').innerHTML = '', 2000);
        } catch (err) {
            showStatus('Error loading activities: ' + err.message, 'error');
        }
    }

    // function renderActivityGrid() {
    //     const grid = document.getElementById('activityGrid');
    //     grid.innerHTML = '';

    //     activities.forEach(activity => {
    //         const button = document.createElement('div');
    //         button.className = 'activity-button';
    //         button.innerHTML = `
    //                     <div class="activity-code">${activity.code}</div>
    //                     <div class="activity-name">${activity.activity}</div>
    //                 `;
    //         button.onclick = () => selectActivity(activity, button);
    //         grid.appendChild(button);
    //     });
    // }

    function selectActivity(activity, button) {
        document.querySelectorAll('.activity-button').forEach(btn => {
            btn.classList.remove('selected');
        });

        button.classList.add('selected');
        selectedActivity = activity;
    }

    async function loadTimeWindow() {
        try {
            showStatus('Loading time window data...', 'info');
            timeManager.updateWindow();
            document.getElementById('timeWindowDisplay').textContent = timeManager.getDisplayRange();

            // Fetch data for all involved dates
            const dates = timeManager.dates;
            timeSlots = {}; // Reset slots

            // Parallel fetch for all dates (usually 1 or 2)
            const promises = dates.map(date => loadDateData(date));
            await Promise.all(promises);

            renderTimeGrid();
            showStatus('Data loaded!', 'success');
            setTimeout(() => {
                const status = document.getElementById('status');
                if (status) status.innerHTML = '';
            }, 2000);
        } catch (err) {
            showStatus('Error loading data: ' + err.message, 'error');
        }
    }

    async function loadDateData(dateStr) {
        const data = await makeApiRequest(
            `${spreadsheetId}/values/Days!A2:CU500`
        );

        const rows = data.values || [];
        let rowData = null;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === dateStr) {
                rowData = rows[i];
                break;
            }
        }

        if (rowData) {
            for (let i = 2; i < rowData.length && i < 98; i++) {
                const hour = Math.floor((i - 2) / 4);
                const quarterIndex = (i - 2) % 4;
                // Store with date prefix to differentiate days in the rolling window
                const key = `${dateStr}-${hour}-${quarterIndex}`;
                if (rowData[i]) {
                    timeSlots[key] = rowData[i];
                }
            }
        }
    }




    function renderTimeGrid() {
        const container = document.getElementById('timeGridContainer');
        container.innerHTML = '';

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';

        const hourHeader = document.createElement('div');
        hourHeader.className = 'grid-header';
        hourHeader.textContent = 'Hour';
        gridContainer.appendChild(hourHeader);

        // Generate slots from TimeManager
        const slots = timeManager.getTimeSlots();

        // We need unique hours from slots (24 columns)
        const hours = [];
        for (let i = 0; i < slots.length; i += 4) {
            hours.push(slots[i]);
        }

        hours.forEach(slot => {
            const header = document.createElement('div');
            header.className = 'grid-header';
            let label = `${slot.hour}:00`;
            header.textContent = label;

            if (slot.isNewDay) {
                header.style.fontWeight = 'bold';
                header.style.color = '#2196F3';
                header.title = slot.date;
            }
            gridContainer.appendChild(header);
        });

        const minutes = ['00', '15', '30', '45'];

        for (let q = 0; q < 4; q++) {
            const minuteLabel = document.createElement('div');
            minuteLabel.className = 'grid-header';
            minuteLabel.textContent = `:${minutes[q]}`;
            gridContainer.appendChild(minuteLabel);

            for (let hIndex = 0; hIndex < hours.length; hIndex++) {
                const slot = slots[hIndex * 4 + q];
                const cell = document.createElement('div');
                cell.className = 'time-cell'; // Keep original class

                if (timeSlots[slot.key]) {
                    cell.textContent = timeSlots[slot.key];
                    cell.classList.add('filled');
                }

                cell.onclick = () => fillTimeSlot(slot.key, cell);
                gridContainer.appendChild(cell);
            }
        }

        container.appendChild(gridContainer);
    }

    function fillTimeSlot(key, cell) {
        if (!selectedActivity) {
            showStatus('Please select an activity first', 'error');
            setTimeout(() => {
                const status = document.getElementById('status');
                if (status) status.innerHTML = '';
            }, 2000);
            return;
        }

        if (timeSlots[key] === selectedActivity.code) {
            delete timeSlots[key];
            cell.textContent = '';
            cell.classList.remove('filled');
        } else {
            timeSlots[key] = selectedActivity.code;
            cell.textContent = selectedActivity.code;
            cell.classList.add('filled');
        }
    }

    async function saveToSheet() {
        try {
            showStatus('Saving to Google Sheets...', 'info');

            const dates = timeManager.dates;
            for (const dateStr of dates) {
                await saveDateData(dateStr);
            }

            showStatus('✅ Saved successfully to Google Sheets!', 'success');
        } catch (err) {
            showStatus('Error saving: ' + err.message, 'error');
        }
    }

    async function saveDateData(dateStr) {
        const data = await makeApiRequest(
            `${spreadsheetId}/values/Days!A2:B500`
        );

        const rows = data.values || [];
        let rowIndex = -1;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === dateStr) {
                rowIndex = i + 2;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Date ${dateStr} not found in sheet.`);
            throw new Error(`Date ${dateStr} not found in 'Days' sheet.`);
        }

        const values = [];
        for (let h = 0; h < 24; h++) {
            for (let q = 0; q < 4; q++) {
                const key = `${dateStr}-${h}-${q}`;
                values.push(timeSlots[key] || '');
            }
        }

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Days!C${rowIndex}:CU${rowIndex}?valueInputOption=RAW`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [values]
            })
        });
    }


    function showStatus(message, type) {
        // Try to find status element in main content first, then setup section
        let status = document.getElementById('status');
        if (!status || status.offsetParent === null) {
            status = document.getElementById('setupStatus');
        }

        if (status) {
            status.innerHTML = message;
            status.className = `status ${type}`;
            status.classList.remove('hidden');
            status.style.display = 'block';
        } else {
            console.log(message); // Fallback to console
        }
    }