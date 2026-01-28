/**
 * Browser-based scraping using Puppeteer.
 * Bypasses anti-bot measures by using a real browser engine.
 */
import puppeteer, { Browser, Page } from 'puppeteer';
import { db } from '@/lib/db';
import { sources, articles } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { translationService } from '@/lib/services/translator';
import { extractFromHtml } from './extractor';

export interface NewsCandidate {
    title: string;
    url: string;
    sourceId: string;
    sourceName: string;
}

/**
 * Launch a shared browser instance for efficiency.
 */
async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
        ],
    });
}

/**
 * Check if a URL appears to be an RSS feed
 */
function isRssFeedUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.xml') ||
        lowerUrl.endsWith('.rss') ||
        lowerUrl.includes('/rss') ||
        lowerUrl.includes('/feed') ||
        lowerUrl.includes('atom');
}

/**
 * Parse an RSS feed and extract article links
 */
async function parseRssFeed(feedUrl: string): Promise<{ title: string; url: string }[]> {
    try {
        const RssParser = (await import('rss-parser')).default;
        const parser = new RssParser();
        const feed = await parser.parseURL(feedUrl);

        return (feed.items || []).slice(0, 20).map(item => ({
            title: item.title || '',
            url: item.link || '',
        })).filter(item => item.title && item.url);
    } catch (error: any) {
        console.error(`RSS parsing failed for ${feedUrl}:`, error.message);
        return [];
    }
}

/**
 * Fetch news candidates from a single source using Puppeteer or RSS parser.
 * Only extracts Title and URL, then translates Title to Simplified Chinese.
 */
async function fetchCandidatesFromSource(
    sourceId: string,
    sourceUrl: string,
    sourceName: string,
    sourceType: string,
    browser: Browser | null
): Promise<NewsCandidate[]> {
    const candidates: NewsCandidate[] = [];

    try {
        let links: { title: string; url: string }[] = [];

        // Check if this is an RSS feed URL
        if (isRssFeedUrl(sourceUrl)) {
            console.log(`Parsing as RSS feed: ${sourceName}`);
            links = await parseRssFeed(sourceUrl);
        } else {
            // Use browser-based extraction for HTML pages
            if (!browser) {
                console.warn(`Skipping ${sourceName}: Browser not initialized and not an RSS feed`);
                return [];
            }

            console.log(`Browser scraping: ${sourceName}`);
            const page = await browser.newPage();
            try {
                await page.setUserAgent(
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                );

                await page.goto(sourceUrl, {
                    waitUntil: 'networkidle2',
                    timeout: 30000,
                });

                // Extract links - common patterns for news sites
                links = await page.evaluate(() => {
                    const results: { title: string; url: string }[] = [];

                    const selectors = [
                        'article a', 'h2 a', 'h3 a', '.news-item a', '.article-link',
                        '.headline a', '[class*="article"] a', '[class*="news"] a',
                        'a[href*="/articles/"]', 'a[href*="/news/"]', 'a[href*="/story/"]',
                    ];

                    const seenUrls = new Set<string>();

                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach((el) => {
                            const anchor = el as HTMLAnchorElement;
                            const href = anchor.href;
                            const title = anchor.textContent?.trim() || '';

                            if (href && title && title.length > 5 && href.startsWith('http') && !seenUrls.has(href)) {
                                if (
                                    !href.includes('/login') &&
                                    !href.includes('/subscribe') &&
                                    !href.includes('/about') &&
                                    !href.includes('/contact') &&
                                    !href.includes('#')
                                ) {
                                    seenUrls.add(href);
                                    results.push({ title, url: href });
                                }
                            }
                        });
                    }

                    return results.slice(0, 20);
                });
            } finally {
                await page.close();
            }
        }

        console.log(`Found ${links.length} links from ${sourceName}`);

        // Filter out already-existing URLs
        for (const link of links) {
            const existing = await db.select({ id: articles.id })
                .from(articles)
                .where(eq(articles.url, link.url))
                .limit(1);

            if (existing.length === 0) {
                candidates.push({
                    title: link.title,
                    url: link.url,
                    sourceId,
                    sourceName,
                });
            }
        }

        console.log(`${candidates.length} new candidates from ${sourceName}`);
    } catch (error: any) {
        console.error(`Fetch failed for ${sourceName}:`, error.message);
        await logger.error(`Fetch failed for ${sourceName}: ${error.message}`, 'BROWSER_SCRAPER', { sourceId });
    }

    return candidates;
}

/**
 * Fetch candidates from all active sources and save as 'candidate' status.
 */
export async function fetchAllCandidates(runId?: string) {
    await logger.info('Starting Fetch Run', 'BROWSER_SCRAPER', { runId });

    let browser: Browser | null = null;
    let totalNew = 0;
    let totalErrors = 0;

    try {
        const activeSources = await db.select().from(sources).where(
            and(eq(sources.isActive, true), ne(sources.type, 'twitter'))
        );

        // Pre-check if we need browser
        const needsBrowser = activeSources.some(s => !isRssFeedUrl(s.url));
        if (needsBrowser) {
            console.log('Detected non-RSS sources, launching browser...');
            browser = await launchBrowser();
        }

        for (const source of activeSources) {
            try {
                const candidates = await fetchCandidatesFromSource(
                    source.id,
                    source.url,
                    source.name,
                    source.type,
                    browser
                );

                // Save candidates with translated titles
                for (const candidate of candidates) {
                    let titleCN = '';
                    if (source.type === 'jp') {
                        try {
                            titleCN = await translationService.translateTitle(candidate.title);
                        } catch (e) {
                            console.warn(`Title translation failed for: ${candidate.title}`);
                        }
                    }

                    const newArticle = {
                        id: uuidv4(),
                        sourceId: source.id,
                        title: candidate.title,
                        titleCN: titleCN || null,
                        url: candidate.url,
                        status: 'candidate' as const,
                        publishedAt: null,
                        content: null,
                        contentCN: null,
                        rawHtml: null,
                        author: null,
                        description: null,
                        heatScore: 0,
                        eventId: null,
                        matchConfidence: null,
                        matchStatus: null,
                        isPaywalled: false,
                        createdAt: new Date(),
                    };

                    await db.insert(articles).values(newArticle);
                    totalNew++;
                }
            } catch (error: any) {
                console.error(`Error processing source ${source.name}:`, error);
                await logger.error(`Failed source ${source.name}: ${error.message}`, 'BROWSER_SCRAPER', { runId, sourceId: source.id });
                totalErrors++;
            } finally {
                await db.update(sources)
                    .set({ lastFetchedAt: new Date() })
                    .where(eq(sources.id, source.id));
            }
        }

        await logger.info(`Fetch Completed. New candidates: ${totalNew}, Errors: ${totalErrors}`, 'BROWSER_SCRAPER', { runId, totalNew, totalErrors });
        return { totalNew, totalErrors };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Fetch full article content for a specific URL using Puppeteer.
 */
export async function fetchFullArticleContent(url: string): Promise<{ content: string; author?: string; description?: string } | null> {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        const html = await page.content();

        // Use the existing extractor logic
        const extracted = await extractFromHtml(html, url);

        if (extracted) {
            return {
                content: extracted.content,
                author: extracted.author || undefined,
                description: extracted.excerpt || undefined,
            };
        }

        return null;
    } catch (error: any) {
        console.error(`Full article fetch failed for ${url}:`, error.message);
        return null;
    } finally {
        await page.close();
        await browser.close();
    }
}

/**
 * Extract HTML from a URL using Puppeteer (for use with extractFromHtml).
 */
export async function extractWithBrowser(url: string): Promise<string | null> {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        return await page.content();
    } catch (error: any) {
        console.error(`Browser HTML extraction failed for ${url}:`, error.message);
        return null;
    } finally {
        await page.close();
        await browser.close();
    }
}

