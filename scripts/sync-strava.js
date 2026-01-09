import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import polyline from '@mapbox/polyline';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
const outputPath = path.resolve(__dirname, '../src/data/strava-activities.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Simple .env.local parser/writer
const loadEnv = () => {
    try {
        if (!fs.existsSync(envPath)) return {};
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim();
        });
        return env;
    } catch (e) {
        return {};
    }
};

const saveEnv = (env) => {
    const content = Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(envPath, content);
};

async function sync() {
    const env = loadEnv();
    const CLIENT_ID = process.env.VITE_STRAVA_CLIENT_ID || env.VITE_STRAVA_CLIENT_ID;
    const CLIENT_SECRET = process.env.VITE_STRAVA_CLIENT_SECRET || env.VITE_STRAVA_CLIENT_SECRET;
    let REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN || env.STRAVA_REFRESH_TOKEN;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('Error: VITE_STRAVA_CLIENT_ID and VITE_STRAVA_CLIENT_SECRET must be in .env.local');
        process.exit(1);
    }

    // Step 1: Handle Initial Auth if no Refresh Token
    if (!REFRESH_TOKEN) {
        console.log('\n--- Strava Sync Setup ---');
        console.log('No refresh token found. Let\'s get one.');
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all`;
        console.log(`\n1. Open this URL in your browser:\n${authUrl}`);
        const codeUrl = await question('\n2. After authorizing, you will be redirected to a localhost URL. Paste the FULL URL here: ');

        try {
            const code = new URL(codeUrl.trim()).searchParams.get('code');
            if (!code) throw new Error('No code found in URL');

            const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                }),
            });

            const data = await tokenResponse.json();
            if (data.refresh_token) {
                REFRESH_TOKEN = data.refresh_token;
                env.STRAVA_REFRESH_TOKEN = REFRESH_TOKEN;
                saveEnv(env);
                console.log('Success! Refresh token saved to .env.local\n');
            } else {
                throw new Error('Failed to get refresh token: ' + JSON.stringify(data));
            }
        } catch (e) {
            console.error('Setup failed:', e.message);
            process.exit(1);
        }
    }

    // Step 2: Refresh access token
    console.log('Refreshing Strava access token...');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }),
    });

    if (!tokenResponse.ok) {
        throw new Error('Failed to refresh tokens: ' + await tokenResponse.text());
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    console.log('Fetching activities...');
    const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch activities (HTTP ${response.status}): ${errorText}`);
    }

    const activities = await response.json();

    if (!Array.isArray(activities)) {
        throw new Error('Strava API returned an object instead of an array. Response: ' + JSON.stringify(activities));
    }

    // Australia rough bounds
    const isInAustralia = (lat, lon) => lat >= -44 && lat <= -10 && lon >= 112 && lon <= 154;

    console.log(`Processing ${activities.length} activities...`);
    const processed = activities
        .map(activity => {
            if (activity.map?.summary_polyline) {
                activity.coordinates = polyline.decode(activity.map.summary_polyline);
            }
            return activity;
        })
        .filter(activity => {
            if (!activity.coordinates || activity.coordinates.length === 0) return false;
            const [lat, lon] = activity.coordinates[0];
            return isInAustralia(lat, lon);
        });

    console.log(`Found ${processed.length} activities in Australia. Fetching details and photos...`);

    // Step 3: Fetch details and photos for each activity
    const activitiesWithDetails = [];
    for (let i = 0; i < processed.length; i++) {
        const summaryActivity = processed[i];
        console.log(`  [${i + 1}/${processed.length}] Fetching details for: ${summaryActivity.name}`);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            // Fetch FULL activity details to get the description
            const detailResponse = await fetch(`https://www.strava.com/api/v3/activities/${summaryActivity.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!detailResponse.ok) {
                console.warn(`    Failed to fetch details for ${summaryActivity.id}: ${detailResponse.statusText}`);
                activitiesWithDetails.push(summaryActivity);
                continue;
            }

            const activity = await detailResponse.json();
            // Re-decode polyline as details might have more points, or just reuse summary
            if (activity.map?.polyline) {
                activity.coordinates = polyline.decode(activity.map.polyline);
            } else if (summaryActivity.coordinates) {
                activity.coordinates = summaryActivity.coordinates;
            }

            if (activity.total_photo_count > 0) {
                console.log(`    Fetching photos...`);
                await new Promise(resolve => setTimeout(resolve, 300));

                const photosResponse = await fetch(`https://www.strava.com/api/v3/activities/${activity.id}/photos?size=1000&photo_sources=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (photosResponse.ok) {
                    const photos = await photosResponse.json();
                    if (Array.isArray(photos)) {
                        activity.photos = photos.map(p => {
                            const url = p.urls?.['1000'] || Object.values(p.urls || {}).pop();
                            return {
                                url,
                                location: p.location,
                                timestamp: p.created_at,
                                caption: p.caption // Capture the caption
                            };
                        }).filter(p => !!p.url);
                        console.log(`    Found ${activity.photos.length} photos.`);
                    }
                }
            }
            activitiesWithDetails.push(activity);
        } catch (err) {
            console.warn(`  Error processing activity ${summaryActivity.id}: ${err.message}`);
            activitiesWithDetails.push(summaryActivity);
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(activitiesWithDetails, null, 2));
    console.log(`Successfully synced ${activitiesWithDetails.length} activities to ${outputPath}`);
    process.exit(0);
}

sync().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
