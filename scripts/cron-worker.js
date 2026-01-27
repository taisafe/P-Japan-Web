const cron = require('node-cron');
const fetch = require('node-fetch');

// Load environment variables if not using dotenv flow in production (Docker envs are passed directly)
// In dev, we might need dotenv, but this script is mainly for the Docker container.

console.log('[Scheduler] Cron Worker Starting...');

const SCHEDULE = process.env.CRON_SCHEDULE || '0 8 * * *'; // Default 8:00 AM
const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
    console.warn('[Scheduler] No CRON_SECRET set! Security Warning.');
}

console.log(`[Scheduler] Scheduled for: ${SCHEDULE}`);

cron.schedule(SCHEDULE, async () => {
    console.log(`[Scheduler] [${new Date().toISOString()}] Triggering Daily Briefing...`);

    try {
        const response = await fetch(`${API_URL}/api/cron/daily-briefing`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        const text = await response.text();

        if (!response.ok) {
            console.error(`[Scheduler] Failed: ${response.status} ${response.statusText}`, text);
        } else {
            console.log(`[Scheduler] Success:`, text);
        }
    } catch (err) {
        console.error('[Scheduler] Connection Error:', err);
    }
});

// Keep process alive
process.stdin.resume();
