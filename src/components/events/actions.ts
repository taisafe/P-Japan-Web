'use server'

import { db } from "@/lib/db";
import { articles, events } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';

export async function resolveMerge(articleId: string, decision: 'approve' | 'reject') {
    const article = await db.query.articles.findFirst({
        where: eq(articles.id, articleId),
        with: { event: true }
    });

    if (!article || !article.eventId) return;

    if (decision === 'approve') {
        // Confirm match
        await db.update(articles)
            .set({ matchStatus: 'confirmed' })
            .where(eq(articles.id, articleId));

        // Update event heat
        await db.update(events)
            .set({ heatScore: sql`${events.heatScore} + ${article.heatScore || 1}` })
            .where(eq(events.id, article.eventId));

    } else {
        // Reject match -> Create new event
        // Or just move to new event?
        // Logic: Create new event for this article.

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

        await db.update(articles)
            .set({
                eventId: newEventId,
                matchStatus: 'confirmed',
                matchConfidence: 1.0
            })
            .where(eq(articles.id, articleId));
    }

    revalidatePath('/');
}
