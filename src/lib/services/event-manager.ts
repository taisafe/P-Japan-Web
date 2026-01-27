import { db } from '@/lib/db';
import { articles, events } from '@/lib/db/schema';
import { calculateSimilarity } from '@/lib/services/similarity';
import { eq, gt, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { type InferSelectModel } from 'drizzle-orm';

type ArticleSelect = InferSelectModel<typeof articles>;

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

        // Update Event Metadata if confirmed
        if (matchStatus === 'confirmed') {
            await db.update(events)
                .set({
                    lastUpdatedAt: new Date(),
                    heatScore: sql`${events.heatScore} + ${article.heatScore || 1}`
                })
                .where(eq(events.id, bestEventId));
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
    }
}
