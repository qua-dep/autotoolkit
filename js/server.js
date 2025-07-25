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

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));

// --- User Profile & Connections API Endpoints ---
app.post('/api/create-user-profile', async (req, res) => {
    const { uid, email, firstName, lastName, companyName, phone } = req.body;
    if (!uid || !email) {
        return res.status(400).json({ message: 'Missing UID or email.' });
    }
    try {
        await db.collection('users').doc(uid).set({
            firstName, lastName, email, companyName, phone,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
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
    if (!uid || !connectionName || !munchkinId || !clientId || !clientSecret) {
        return res.status(400).json({ message: 'Missing required connection fields.' });
    }
    try {
        const connectionsRef = db.collection('users').doc(uid).collection('connections');
        const newConnection = await connectionsRef.add({
            name: connectionName,
            munchkinId,
            clientId,
            clientSecret,
            type: 'marketo',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(201).json({ message: 'Connection saved successfully.', id: newConnection.id });
    } catch (error) {
        console.error('Error saving connection:', error);
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
    if (!uid || !connectionId) {
        return res.status(400).json({ message: 'Missing UID or Connection ID.' });
    }
    try {
        const connectionRef = db.collection('users').doc(uid).collection('connections').doc(connectionId);
        await connectionRef.delete();
        console.log(`✅ Connection ${connectionId} deleted for user ${uid}.`);
        res.status(200).json({ message: 'Connection deleted successfully.' });
    } catch (error) {
        console.error('Error deleting connection:', error);
        res.status(500).json({ message: 'Failed to delete connection.' });
    }
});


// --- REFACTORED Marketo API Section ---
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

    console.log(`🔄 Fetching new Marketo access token for ${munchkinId}...`);
    const url = `https://${munchkinId}.mktorest.com/identity/oauth/token`;
    try {
        const response = await axios.get(url, {
            params: {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            },
        });

        const accessToken = response.data.access_token;
        const expiresAt = now + (response.data.expires_in - 60) * 1000;
        
        tokenCache.set(cacheKey, { accessToken, expiresAt });
        
        console.log(`✅ New token acquired for ${munchkinId}.`);
        return accessToken;
    } catch (err) {
        console.error('❌ Error fetching access token:', err.response?.data || err.message);
        throw new Error('Could not authenticate with Marketo API.');
    }
}


// --- UPDATED Marketo API Endpoints ---
app.post('/api/programs/search', async (req, res) => {
  const { name, uid, connectionId } = req.body;
  if (!name || !uid || !connectionId) {
    return res.status(400).json({ message: 'Missing program name, uid, or connectionId' });
  }

  try {
    const credentials = await getMarketoCredentials(uid, connectionId);
    const token = await getMarketoAccessToken(credentials);
    const { munchkinId } = credentials;

    console.log(`🔍 Searching for program: "${name}" in instance ${munchkinId}`);
    const searchRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/program/byName.json`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { name },
    });

    const program = searchRes.data.result?.[0];
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    const folderParam = JSON.stringify({ id: program.id, type: "Program" });
    const commonConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: { folder: folderParam, maxReturn: 200 }
    };

    console.log(`📂 Fetching asset summaries for program ID ${program.id}...`);
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
                } catch (e) { /* Ignore */ }
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
    
    console.log(`✅ Found ${allAssets.length} total assets.`);
    res.json({ program, assets: allAssets });

  } catch (err) {
    console.error('❌ Error in program search:', err.response?.data || err.message);
    res.status(500).json({ message: 'An error occurred while searching for the program.' });
  }
});

// --- Refactored Asset Search Endpoints ---
app.post('/api/assets/search', async (req, res) => {
    const { query, uid, connectionId } = req.body;
    if (!query || query.length < 3) {
        return res.json([]);
    }
    if (!uid || !connectionId) {
        return res.status(400).json({ message: 'Missing uid or connectionId' });
    }
    
    console.log(`🔍 Searching all assets for: "${query}"`);
    try {
        const credentials = await getMarketoCredentials(uid, connectionId);
        const token = await getMarketoAccessToken(credentials);
        const { munchkinId } = credentials;

        const assetTypesToSearch = {
            program: 'programs', email: 'emails', landingPage: 'landingPages',
            form: 'forms', smartList: 'smartLists'
        };

        const searchPromises = Object.entries(assetTypesToSearch).map(([type, endpoint]) => 
            axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/${endpoint}.json`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { filterType: 'name', filterValues: query }
            }).then(response => 
                (response.data.result || []).map(asset => ({ ...asset, assetType: type }))
            ).catch(err => {
                console.warn(`⚠️ Could not search ${type}:`, err.message);
                return [];
            })
        );
        
        const resultsByAsset = await Promise.all(searchPromises);
        const combinedResults = resultsByAsset.flat().sort((a, b) => a.name.localeCompare(b.name));
        res.json(combinedResults);

    } catch (err) {
        console.error('❌ Error during global asset search:', err.message);
        res.status(500).json({ message: 'An error occurred during asset search.' });
    }
});

app.post('/api/asset/:assetType/:id', async (req, res) => {
    const { assetType, id } = req.params;
    const { uid, connectionId } = req.body;

    if (!uid || !connectionId) {
        return res.status(400).json({ message: 'Missing uid or connectionId' });
    }

    const assetTypeToApiPath = {
        'program': 'program', 'email': 'email', 'landingPage': 'landingPage',
        'smartCampaign': 'smartCampaign', 'form': 'form', 'smartList': 'smartList', 'list': 'list',
    };

    const apiPath = assetTypeToApiPath[assetType];
    if (!apiPath) {
        return res.status(400).json({ message: 'Unsupported asset type provided.' });
    }

    console.log(`ℹ️ Fetching details for ${assetType} ID: ${id}`);
    try {
        const credentials = await getMarketoCredentials(uid, connectionId);
        const token = await getMarketoAccessToken(credentials);
        const { munchkinId } = credentials;

        const detailRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/${apiPath}/${id}.json`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const detail = detailRes.data.result?.[0];
        if (!detail) {
            return res.status(404).json({ message: 'Asset not found.' });
        }
        res.json(detail);

    } catch (err) {
        console.error(`❌ Error fetching asset ${assetType} ${id}:`, err.response?.data || err.message);
        res.status(500).json({ message: `An error occurred while fetching the asset.` });
    }
});


// --- Action Endpoints ---
const createActionEndpoint = (assetType, action) => async (req, res) => {
    const { id } = req.params;
    const { uid, connectionId } = req.body; 

    if (!uid || !connectionId) {
        return res.status(400).json({ message: 'Missing uid or connectionId' });
    }

    console.log(`▶️ Performing action "${action}" on ${assetType} ID: ${id}`);
    try {
        const credentials = await getMarketoCredentials(uid, connectionId);
        const token = await getMarketoAccessToken(credentials);
        const { munchkinId } = credentials;

        await axios.post(`https://${munchkinId}.mktorest.com/rest/asset/v1/${assetType}/${id}/${action}.json`, null, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.status(200).json({ message: `${assetType} action successful` });
    } catch (err) {
        const errorMessage = err.response?.data?.errors?.[0]?.message || err.message;
        console.error(`❌ Error performing action "${action}" on ${assetType} ${id}:`, errorMessage);
        res.status(500).json({ message: `Failed to perform action on ${assetType}. Reason: ${errorMessage}` });
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

    console.log(`▶️ Performing bulk action "${action}" on ${assets.length} assets.`);

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
                return Promise.resolve({ id: asset.id, status: 'skipped', reason: 'Unsupported asset type' });
            }

            const url = `https://${munchkinId}.mktorest.com/rest/asset/v1/${assetType}/${asset.id}/${apiAction}.json`;
            return axios.post(url, null, { headers: { Authorization: `Bearer ${token}` } })
                .then(() => ({ id: asset.id, status: 'success' }))
                .catch(err => ({ id: asset.id, status: 'failed', reason: err.response?.data?.errors?.[0]?.message || err.message }));
        });

        const results = await Promise.all(actionPromises);
        console.log('✅ Bulk action complete.', results);
        res.status(200).json({ message: 'Bulk action completed.', results });

    } catch (err) {
        console.error('❌ Error during bulk action:', err.message);
        res.status(500).json({ message: 'An error occurred during the bulk action.' });
    }
});


// Server start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
