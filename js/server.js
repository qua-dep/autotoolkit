// server.js
const express = require('express');
const axios = require('axios');
const cors =require('cors');
const path = require('path'); // Make sure path module is included
require('dotenv').config();

// --- Firebase Admin SDK Setup ---
const admin = require('firebase-admin');
// FIX: Use path.join to create a reliable path to the key file
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json')); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// --- End Firebase Setup ---

const app = express();
app.use(cors());
app.use(express.json());

// FIX: Correctly serve the 'public' and 'js' directories
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));


let accessToken = '';
let tokenExpiresAt = 0;

// --- Marketo API Authentication (remains the same) ---
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  console.log('🔄 Fetching new Marketo access token...');
  const url = `https://${process.env.MUNCHKIN_ID}.mktorest.com/identity/oauth/token`;
  try {
    const response = await axios.get(url, {
      params: {
        grant_type: 'client_credentials',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      },
    });

    accessToken = response.data.access_token;
    tokenExpiresAt = now + (response.data.expires_in - 60) * 1000;
    console.log('✅ New token acquired.');
    return accessToken;
  } catch (err) {
    console.error('❌ Error fetching access token:', err.response?.data || err.message);
    throw new Error('Could not authenticate with Marketo API.');
  }
}

// --- NEW: API Endpoint to create a user profile in Firestore ---
app.post('/api/create-user-profile', async (req, res) => {
    const { uid, email, firstName, lastName, companyName, phone } = req.body;

    if (!uid || !email) {
        return res.status(400).json({ message: 'Missing UID or email.' });
    }

    try {
        await db.collection('users').doc(uid).set({
            firstName,
            lastName,
            email,
            companyName,
            phone,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ User profile created in Firestore for UID: ${uid}`);
        res.status(201).json({ message: 'User profile created successfully.' });
    } catch (error) {
        console.error('❌ Error creating user profile in Firestore:', error);
        res.status(500).json({ message: 'Error creating user profile.' });
    }
});


// --- All your Marketo-related API endpoints remain the same ---
// ... (omitted for brevity, no changes needed here) ...
app.get('/api/instance/info', async (req, res) => {
    console.log('ℹ️ Fetching instance API usage...');
    try {
        const token = await getAccessToken();
        const munchkinId = process.env.MUNCHKIN_ID;

        const usageRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/v1/stats/usage.json`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const usageData = usageRes.data.result?.[0];

        const limitRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/v1/stats/usage/last7days.json`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const limitData = limitRes.data.result?.[0];

        if (!usageData || !limitData) {
            return res.status(404).json({ message: 'Could not retrieve usage data.' });
        }
        
        res.json({
            munchkinId: process.env.MUNCHKIN_ID,
            dailyUsage: usageData.total,
            usageLimit: limitData.total
        });
    } catch (err) {
        console.error('❌ Error fetching instance info:', err.response?.data || err.message);
        res.status(500).json({ message: 'An error occurred while fetching instance info.' });
    }
});
app.get('/api/assets/search', async (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 3) {
        return res.json([]); // Return empty if query is too short
    }
    
    console.log(`🔍 Searching all assets for: "${query}"`);
    try {
        const token = await getAccessToken();
        const munchkinId = process.env.MUNCHKIN_ID;

        const assetTypesToSearch = {
            program: 'programs',
            email: 'emails',
            landingPage: 'landingPages',
            form: 'forms',
            smartList: 'smartLists'
        };

        const searchPromises = Object.entries(assetTypesToSearch).map(([type, endpoint]) => 
            axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/${endpoint}.json`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { filterType: 'name', filterValues: query }
            }).then(response => 
                (response.data.result || []).map(asset => ({ ...asset, assetType: type }))
            ).catch(err => {
                console.warn(`⚠️ Could not search ${type}:`, err.message);
                return []; // Return empty array on error to not fail the whole search
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
app.get('/api/asset/:assetType/:id', async (req, res) => {
    const { assetType, id } = req.params;
    
    const assetTypeToApiPath = {
        'program': 'program',
        'email': 'email',
        'landingPage': 'landingPage',
        'smartCampaign': 'smartCampaign',
        'form': 'form',
        'smartList': 'smartList',
        'list': 'list',
    };

    const apiPath = assetTypeToApiPath[assetType];
    if (!apiPath) {
        return res.status(400).json({ message: 'Unsupported asset type provided.' });
    }

    console.log(`ℹ️ Fetching details for ${assetType} ID: ${id}`);
    try {
        const token = await getAccessToken();
        const munchkinId = process.env.MUNCHKIN_ID;

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
app.get('/api/programs/search', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ message: 'Missing program name' });
  }

  try {
    const token = await getAccessToken();
    const munchkinId = process.env.MUNCHKIN_ID;

    console.log(`🔍 Searching for program: "${name}"`);
    const searchRes = await axios.get(`https://${munchkinId}.mktorest.com/rest/asset/v1/program/byName.json`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { name },
    });

    const program = searchRes.data.result?.[0];
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    console.log(`👍 Found program: ${program.name} (ID: ${program.id})`);

    const folderParam = JSON.stringify({ id: program.id, type: "Program" });
    const commonConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: { folder: folderParam, maxReturn: 200 }
    };

    console.log(`📂 Fetching asset summaries for program ID ${program.id}...`);
    const [
        campaignSummariesRes, 
        emailSummariesRes, 
        landingPageSummariesRes,
        formsRes,
        smartListsRes,
        listsRes
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
                } catch (e) { /* Ignore if schedule not found */ }
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
    console.log(`ℹ️ Fetching details for assets...`);

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
const createActionEndpoint = (assetType, action) => async (req, res) => {
    const { id } = req.params;
    console.log(`▶️ Performing action "${action}" on ${assetType} ID: ${id}`);
    try {
        const token = await getAccessToken();
        const munchkinId = process.env.MUNCHKIN_ID;
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
    const { assets, action } = req.body;
    if (!assets || !action || !Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ message: 'Invalid request body.' });
    }

    console.log(`▶️ Performing bulk action "${action}" on ${assets.length} assets.`);

    try {
        const token = await getAccessToken();
        const munchkinId = process.env.MUNCHKIN_ID;

        const actionPromises = assets.map(asset => {
            let assetType, apiAction;
            
            if (asset.assetType === 'smartCampaign') {
                assetType = 'smartCampaign';
                apiAction = action === 'approve' ? 'activate' : 'deactivate';
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
