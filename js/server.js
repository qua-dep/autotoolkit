// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// --- Firebase Admin SDK Setup ---
const admin = require('firebase-admin');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json')); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// --- End Firebase Setup ---

// --- Persistent Firestore Logger ---
async function logToFirestore(uid, level, message, details = {}) {
    if (!uid) {
        console.log('Log attempt without UID:', { level, message });
        return;
    }
    try {
        const logEntry = {
            level,
            message,
            details: JSON.stringify(details, null, 2),
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        const collection = level === 'DEBUG' ? 'debug-logs' : 'logs';
        await db.collection('users').doc(uid).collection(collection).add(logEntry);
    } catch (error) {
        console.error('FATAL: Failed to write to log collection for user:', uid, error);
    }
}


const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));

// --- API Endpoints ---

app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
    });
});

app.get('/api/logs/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const logsRef = db.collection('users').doc(uid).collection('logs');
        const snapshot = await logsRef.orderBy('timestamp', 'desc').limit(100).get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                timestamp: data.timestamp.toDate().toISOString() 
            };
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error(`Error fetching logs for user ${uid}:`, error);
        res.status(500).json({ message: 'Failed to fetch logs.' });
    }
});

app.get('/api/debug-logs/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const logsRef = db.collection('users').doc(uid).collection('debug-logs');
        const snapshot = await logsRef.orderBy('timestamp', 'desc').limit(100).get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                timestamp: data.timestamp.toDate().toISOString() 
            };
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error(`Error fetching debug logs for user ${uid}:`, error);
        res.status(500).json({ message: 'Failed to fetch debug logs.' });
    }
});

app.post('/api/create-user-profile', async (req, res) => {
    const { uid, email, firstName, lastName, companyName } = req.body;
    if (!uid || !email) {
        return res.status(400).json({ message: 'Missing UID or email.' });
    }
    try {
        await db.collection('users').doc(uid).set({
            firstName, lastName, email, companyName,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await logToFirestore(uid, 'INFO', 'User profile created');
        res.status(201).json({ message: 'User profile created successfully.' });
    } catch (error) {
        console.error('Error creating user profile in Firestore:', error);
        res.status(500).json({ message: 'Error creating user profile.' });
    }
});

app.get('/api/user-profile/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User profile not found.' });
        }
        res.status(200).json(userDoc.data());
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile.' });
    }
});

app.post('/api/connections', async (req, res) => {
    const { uid, connectionName, munchkinId, clientId, clientSecret } = req.body;
    try {
        const connectionsRef = db.collection('users').doc(uid).collection('connections');
        const newConnection = await connectionsRef.add({
            name: connectionName, munchkinId, clientId, clientSecret, type: 'marketo',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await logToFirestore(uid, 'INFO', 'Marketo connection added', { connectionName, connectionId: newConnection.id });
        res.status(201).json({ message: 'Connection saved successfully.', id: newConnection.id });
    } catch (error) {
        await logToFirestore(uid, 'ERROR', 'Failed to add Marketo connection', { error: error.message });
        res.status(500).json({ message: 'Failed to save connection.' });
    }
});

app.get('/api/connections/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const connectionsRef = db.collection('users').doc(uid).collection('connections');
        const snapshot = await connectionsRef.orderBy('createdAt').get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const connections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(connections);
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ message: 'Failed to fetch connections.' });
    }
});

app.delete('/api/connections/:uid/:connectionId', async (req, res) => {
    const { uid, connectionId } = req.params;
    try {
        const connectionRef = db.collection('users').doc(uid).collection('connections').doc(connectionId);
        await connectionRef.delete();
        await logToFirestore(uid, 'INFO', 'Connection deleted', { connectionId });
        res.status(200).json({ message: 'Connection deleted successfully.' });
    } catch (error) {
        await logToFirestore(uid, 'ERROR', 'Failed to delete connection', { connectionId, error: error.message });
        res.status(500).json({ message: 'Failed to delete connection.' });
    }
});


// --- Marketo API Section ---
const tokenCache = new Map();

async function getMarketoCredentials(uid, connectionId) {
    const connDoc = await db.collection('users').doc(uid).collection('connections').doc(connectionId).get();
    if (!connDoc.exists) {
        throw new Error('Connection not found.');
    }
    return connDoc.data();
}

async function getMarketoAccessToken({ munchkinId, clientId, clientSecret }) {
    const cacheKey = clientId;
    const cached = tokenCache.get(cacheKey);
    const now = Date.now();
    if (cached && now < cached.expiresAt) {
        return cached.accessToken;
    }
    const url = `https://${munchkinId}.mktorest.com/identity/oauth/token`;
    try {
        const response = await axios.get(url, {
            params: { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret },
        });
        const accessToken = response.data.access_token;
        const expiresAt = now + (response.data.expires_in - 60) * 1000;
        tokenCache.set(cacheKey, { accessToken, expiresAt });
        return accessToken;
    } catch (err) {
        console.error('❌ Error fetching access token:', err.response?.data || err.message);
        throw new Error('Could not authenticate with Marketo API.');
    }
}

app.post('/api/programs/search', async (req, res) => {
  const { name, uid, connectionId } = req.body;
  if (!name || !uid || !connectionId) {
    return res.status(400).json({ message: 'Missing program name, uid, or connectionId' });
  }

  await logToFirestore(uid, 'INFO', 'Program search initiated', { programName: name, connectionId });
  try {
    const credentials = await getMarketoCredentials(uid, connectionId);
    const token = await getMarketoAccessToken(credentials);
    const { munchkinId } = credentials;

    const searchRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/program/byName.json`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { name },
    });

    const program = searchRes.data.result?.[0];
    if (!program) {
      await logToFirestore(uid, 'WARN', 'Program not found', { programName: name });
      return res.status(404).json({ message: 'Program not found' });
    }
    
    const folderParam = JSON.stringify({ id: program.id, type: "Program" });
    const commonConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: { folder: folderParam, maxReturn: 200 }
    };

    const [
        campaignSummariesRes, emailSummariesRes, landingPageSummariesRes,
        formsRes, smartListsRes, listsRes
    ] = await Promise.all([
        axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/smartCampaigns.json`, commonConfig),
        axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/emails.json`, commonConfig),
        axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/landingPages.json`, commonConfig),
        axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/forms.json`, commonConfig),
        axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/smartLists.json`, commonConfig),
        axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/lists.json`, commonConfig)
    ]);

    const createDetailPromise = async (assetType, summary) => {
        try {
            const detailRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/${assetType}/${summary.id}.json`, { headers: { Authorization: `Bearer ${token}` } });
            const detail = detailRes.data.result?.[0];
            if (!detail) return null;
            if (assetType === 'smartCampaign' && detail.type === 'batch') {
                try {
                    const scheduleRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/smartCampaign/${summary.id}/schedule.json`, { headers: { Authorization: `Bearer ${token}` } });
                    detail.schedule = scheduleRes.data.result?.[0];
                } catch (e) { /* Ignore schedule fetch errors */ }
            }
            return detail;
        } catch (err) {
            console.warn(`⚠️ Could not fetch details for ${assetType} ${summary.id}:`, err.message);
            return null;
        }
    };

    const assetTypesToDetail = {
        smartCampaign: campaignSummariesRes.data.result || [],
        email: emailSummariesRes.data.result || [],
        landingPage: landingPageSummariesRes.data.result || [],
    };

    let detailedAssets = [];
    for (const [assetType, summaries] of Object.entries(assetTypesToDetail)) {
        if (summaries.length === 0) continue;
        const results = await Promise.all(summaries.map(summary => createDetailPromise(assetType, summary)));
        results.filter(Boolean).forEach(detail => detailedAssets.push({ ...detail, assetType }));
    }

    const forms = (formsRes.data.result || []).map(asset => ({ ...asset, assetType: 'form' }));
    const smartLists = (smartListsRes.data.result || []).map(asset => ({ ...asset, assetType: 'smartList' }));
    const lists = (listsRes.data.result || []).map(asset => ({ ...asset, assetType: 'list' }));

    let allAssets = [...detailedAssets, ...forms, ...smartLists, ...lists];
    allAssets.sort((a, b) => a.name.localeCompare(b.name));
    
    await logToFirestore(uid, 'INFO', 'Program search successful', { programName: name, programId: program.id, assetsFound: allAssets.length });
    res.json({ program, assets: allAssets });

  } catch (err) {
    await logToFirestore(uid, 'ERROR', 'Program search failed', { programName: name, error: err.message, stack: err.stack });
    res.status(500).json({ message: 'An error occurred while searching for the program.' });
  }
});

const createActionEndpoint = (assetType, action) => async (req, res) => {
    const { id } = req.params;
    const { uid, connectionId } = req.body; 

    const logDetails = { assetType, action, assetId: id, connectionId };
    await logToFirestore(uid, 'INFO', `Action '${action}' initiated for ${assetType}`, logDetails);

    try {
        const credentials = await getMarketoCredentials(uid, connectionId);
        const token = await getMarketoAccessToken(credentials);
        const { munchkinId } = credentials;

        const response = await axios.post(`https://${munchkinId}.mktorest.com/rest/asset/v1/${assetType}/${id}/${action}.json`, null, {
            headers: { Authorization: `Bearer ${token}` }
        });
        await logToFirestore(uid, 'DEBUG', `Marketo API Success: ${action} ${assetType}`, { request: logDetails, response: response.data });

        const updatedAssetRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/${assetType}/${id}.json`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const updatedAsset = updatedAssetRes.data.result?.[0];
        if (!updatedAsset) {
            throw new Error('Failed to fetch updated asset details after action.');
        }

        await logToFirestore(uid, 'INFO', `Action '${action}' successful for ${assetType}`, { ...logDetails, updatedStatus: updatedAsset.status || updatedAsset.isActive });
        res.status(200).json({ message: 'Action successful', data: { ...updatedAsset, assetType } });

    } catch (err) {
        const errorData = err.response?.data || { message: err.message };
        await logToFirestore(uid, 'ERROR', `Action '${action}' failed for ${assetType}`, { ...logDetails, error: errorData });
        res.status(500).json({ message: `Failed to perform action on ${assetType}. Reason: ${errorData?.errors?.[0]?.message || err.message}` });
    }
};

app.post('/api/campaigns/:id/activate', createActionEndpoint('smartCampaign', 'activate'));
app.post('/api/campaigns/:id/deactivate', createActionEndpoint('smartCampaign', 'deactivate'));
app.post('/api/emails/:id/approve', createActionEndpoint('email', 'approveDraft'));
app.post('/api/emails/:id/unapprove', createActionEndpoint('email', 'unapprove'));
app.post('/api/landingPages/:id/approve', createActionEndpoint('landingPage', 'approveDraft'));
app.post('/api/landingPages/:id/unapprove', createActionEndpoint('landingPage', 'unapprove'));

app.post('/api/assets/bulk-action', async (req, res) => {
    const { assets, action, uid, connectionId } = req.body;
    if (!assets || !action || !uid || !connectionId || !Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ message: 'Invalid request body.' });
    }

    const logDetails = { action, assetCount: assets.length, assetIds: assets.map(a => a.id) };
    await logToFirestore(uid, 'INFO', `Bulk action '${action}' initiated`, logDetails);

    try {
        const credentials = await getMarketoCredentials(uid, connectionId);
        const token = await getMarketoAccessToken(credentials);
        const { munchkinId } = credentials;

        const actionPromises = assets.map(asset => {
            let assetType, apiAction;
            
            if (asset.assetType === 'smartCampaign') {
                assetType = 'smartCampaign';
                apiAction = action === 'activate' ? 'activate' : 'deactivate';
            } else if (asset.assetType === 'email') {
                assetType = 'email';
                apiAction = action === 'approve' ? 'approveDraft' : 'unapprove';
            } else if (asset.assetType === 'landingPage') {
                assetType = 'landingPage';
                apiAction = action === 'approve' ? 'approveDraft' : 'unapprove';
            } else {
                return Promise.resolve({ id: asset.id, status: 'skipped', reason: 'Unsupported asset type for bulk action' });
            }

            const url = `https://${munchkinId}.mktorest.com/rest/asset/v1/${assetType}/${asset.id}/${apiAction}.json`;
            return axios.post(url, null, { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    logToFirestore(uid, 'DEBUG', `Marketo API Success (Bulk): ${action} ${assetType}`, { request: {assetId: asset.id}, response: response.data });
                    return { id: asset.id, status: 'success' };
                })
                .catch(err => {
                    const errorData = err.response?.data || { message: err.message };
                    logToFirestore(uid, 'ERROR', `Marketo API Error (Bulk): ${action} ${assetType}`, { request: {assetId: asset.id}, error: errorData });
                    return { id: asset.id, status: 'failed', reason: errorData?.errors?.[0]?.message || err.message };
                });
        });

        const results = await Promise.all(actionPromises);
        
        await logToFirestore(uid, 'INFO', `Bulk action '${action}' completed`, { ...logDetails, results });
        res.status(200).json({ message: 'Bulk action completed.', results });

    } catch (err) {
        await logToFirestore(uid, 'ERROR', `Bulk action '${action}' failed`, { ...logDetails, error: err.message });
        res.status(500).json({ message: 'An error occurred during the bulk action.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
