import Parser from 'rss-parser';
import { db } from '@/lib/db';
import { sources, articles } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { extractFromUrl } from './extractor';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { processArticle } from '@/lib/services/event-manager';

const parser = new Parser();

export async function fetchAllRssSources(runId?: string) {
    // Log start
    await logger.info('Starting RSS Fetch Run', 'RSS_FETCHER', { runId });

    try {
        const activeSources = await db.select().from(sources).where(and(
            eq(sources.isActive, true),
            ne(sources.type, 'twitter')
        ));

        let totalNew = 0;
        let totalErrors = 0;

        for (const source of activeSources) {
            try {
                const feed = await parser.parseURL(source.url);

                // Process recent 10 items to avoid overwhelming
                for (const item of feed.items.slice(0, 10)) {
                    if (!item.link) continue;

                    // Check duplicate
                    const existing = await db.select().from(articles).where(eq(articles.url, item.link)).limit(1);
                    if (existing.length > 0) continue;

                    // Extract content
                    let content = item.contentSnippet || item.content || '';
                    let details: any = {};

                    try {
                        const extracted = await extractFromUrl(item.link);
                        if (extracted) {
                            content = extracted.content;
                            details = extracted;
                        }
                    } catch (e) {
                        console.warn(`Extraction failed for ${item.link}, using RSS snippet.`);
                    }

                    // Insert
                    // Insert
                    const newArticle = {
                        id: uuidv4(),
                        sourceId: source.id,
                        title: item.title || 'Untitled',
                        url: item.link,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        content: content,
                        contentCN: null,
                        rawHtml: null,
                        author: details.author || item.creator || item.author,
                        description: details.excerpt || item.contentSnippet,
                        heatScore: 0, // Initial score
                        eventId: null,
                        matchConfidence: null,
                        matchStatus: null,
                        isPaywalled: false,
                        createdAt: new Date(),
                    };

                    await db.insert(articles).values(newArticle);

                    // Trigger Event Processing
                    try {
                        // Cast to ArticleSelect (might need slight adjustment if types don't match exactly, but based on schema it should be close)
                        // Actually processArticle expects ArticleSelect which comes from valid DB read or matching shape.
                        // The shape matches schema.
                        await processArticle(newArticle as any);
                    } catch (pError) {
                        console.error(`Event processing failed for article ${newArticle.id}:`, pError);
                    }

                    totalNew++;
                }

            } catch (error: any) {
                console.error(`RSS Fetch Error for ${source.name}:`, error);
                await logger.error(`Failed to fetch RSS for ${source.name}: ${error.message}`, 'RSS_FETCHER', { runId, sourceId: source.id });
                totalErrors++;
            }
        }

        await logger.info(`RSS Fetch Run Completed. New articles: ${totalNew}, Errors: ${totalErrors}`, 'RSS_FETCHER', { runId, totalNew, totalErrors });
        return { totalNew, totalErrors };

    } catch (error: any) {
        console.error("Critical RSS Fetch Error:", error);
        await logger.error(`Critical RSS Fetch Error: ${error.message}`, 'RSS_FETCHER', { runId });
        throw error;
    }
}
