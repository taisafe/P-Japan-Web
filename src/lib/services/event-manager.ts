import { db } from '@/lib/db';
import { articles, events, sources } from '@/lib/db/schema';
import { calculateSimilarity } from '@/lib/services/similarity';
import { calculateEventHeatScore } from '@/lib/services/scoring';
import { eq, gt, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { type InferSelectModel } from 'drizzle-orm';

type ArticleSelect = InferSelectModel<typeof articles>;

/**
 * Recalculate the heat score for an event based on its confirmed articles.
 * Uses the M6 scoring algorithm with source debias and time decay.
 */
async function recalculateEventScore(eventId: string): Promise<number> {
    // Fetch the event
    const event = await db.query.events.findFirst({
        where: eq(events.id, eventId),
    });
    if (!event) return 0;

    // Fetch articles with sources for this event
    const eventArticles = await db.query.articles.findMany({
        where: eq(articles.eventId, eventId),
        with: {
            source: true,
        },
    });

    // Map to the format expected by scoring service
    const articlesWithSources = eventArticles.map(a => ({
        id: a.id,
        sourceId: a.sourceId,
        matchStatus: a.matchStatus as 'confirmed' | 'pending' | 'rejected' | null,
        publishedAt: a.publishedAt,
        source: a.source ? { id: a.source.id, weight: a.source.weight } : null,
    }));

    const newScore = calculateEventHeatScore(event, articlesWithSources);

    // Update the event's heat score
    await db.update(events)
        .set({ heatScore: newScore })
        .where(eq(events.id, eventId));

    return newScore;
}

export async function processArticle(article: ArticleSelect) {
    // 1. Find active events (last 48h)
    const timeThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const activeEvents = await db.query.events.findMany({
        where: gt(events.lastUpdatedAt, timeThreshold),
        orderBy: [desc(events.lastUpdatedAt)],
    });

    let bestEventId: string | null = null;
    let maxScore = 0;

    // 2. Similarity Check
    if (activeEvents.length > 0) {
        const articleText = (article.title + " " + (article.description || "")).trim();

        for (const event of activeEvents) {
            const eventText = (event.title + " " + (event.summary || "")).trim();
            const score = await calculateSimilarity(articleText, eventText);

            if (score > maxScore) {
                maxScore = score;
                bestEventId = event.id;
            }
        }
    }

    // 3. Hybrid Logic
    const MATCH_THRESHOLD = 0.85;
    const PENDING_THRESHOLD = 0.60;

    let matchStatus: 'confirmed' | 'pending' | 'rejected' = 'confirmed';

    if (maxScore > PENDING_THRESHOLD && bestEventId) {
        if (maxScore > MATCH_THRESHOLD) {
            matchStatus = 'confirmed';
        } else {
            matchStatus = 'pending';
        }

        // Update Article
        await db.update(articles)
            .set({
                eventId: bestEventId,
                matchConfidence: maxScore,
                matchStatus: matchStatus
            })
            .where(eq(articles.id, article.id));

        // Update Event Metadata and recalculate score if confirmed
        if (matchStatus === 'confirmed') {
            await db.update(events)
                .set({ lastUpdatedAt: new Date() })
                .where(eq(events.id, bestEventId));

            // Recalculate heat score using M6 algorithm
            await recalculateEventScore(bestEventId);
        }

    } else {
        // Create New Event
        const newEventId = uuidv4();
        await db.insert(events).values({
            id: newEventId,
            title: article.title,
            summary: article.description || article.title,
            heatScore: article.heatScore || 1,
            firstSeenAt: new Date(),
            lastUpdatedAt: new Date(),
            status: 'active'
        });

        // Link Article
        await db.update(articles)
            .set({
                eventId: newEventId,
                matchConfidence: 1.0,
                matchStatus: 'confirmed'
            })
            .where(eq(articles.id, article.id));

        // Calculate initial heat score
        await recalculateEventScore(newEventId);
    }
}
