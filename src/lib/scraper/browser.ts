import puppeteerCore from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';

// Helper to determine if we are running locally or in a container
const isProduction = process.env.NODE_ENV === 'production';

export async function launchBrowser(): Promise<Browser> {
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    // Local development: try to use standard puppeteer which handles its own chrome
    if (!executablePath && !isProduction) {
        try {
            // Dynamic import to avoid unwanted bundling impact if possible, 
            // though in Next.js server components it's less of an issue.
            const { default: puppeteerLocal } = await import('puppeteer');
            return puppeteerLocal.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }) as unknown as Browser;
        } catch (e) {
            console.warn("Local puppeteer not found, trying puppeteer-core with default paths...");
            // Fallback for core if local chrome path is somehow known or needed
        }
    }

    // Production (Docker) or if path is set
    // We expect PUPPETEER_EXECUTABLE_PATH to be set in Dockerfile (/usr/bin/chromium-browser)
    return puppeteerCore.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu' // Often needed in docker
        ],
        executablePath: executablePath || '/usr/bin/chromium-browser', // Fallback default for Alpine
        headless: true,
    });
}

export async function extractWithBrowser(url: string): Promise<string | null> {
    let browser = null;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();

        // Set a realistic User Agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Go to URL and wait for network idle to ensure dynamic content loads
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Get the full HTML
        const content = await page.content();
        return content;

    } catch (error) {
        console.error("Browser Extraction Failed:", error);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
