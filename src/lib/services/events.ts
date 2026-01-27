
import { db } from '@/lib/db';
import { articles, events } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export class EventsService {
    async list(params: { page?: number; limit?: number }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;

        const data = await db.query.events.findMany({
            orderBy: [desc(events.lastUpdatedAt)],
            limit: limit,
            offset: offset,
            with: {
                articles: {
                    limit: 5,
                    orderBy: [desc(articles.publishedAt)],
                    columns: { id: true, title: true, publishedAt: true }
                }
            }
        });

        // Get article counts for each event
        // This is N+1 if not careful, but Drizzle query handling is decent. 
        // Better to use a separate aggregation query or subquery.
        // For MVP, we'll fetch extra info or just trust the 'with' limitation?
        // Actually, let's do a join count.

        const counts = await db.select({
            eventId: articles.eventId,
            count: sql<number>`count(*)`
        })
            .from(articles)
            .groupBy(articles.eventId);

        const countMap = new Map(counts.map(c => [c.eventId, c.count]));

        const results = data.map(event => ({
            ...event,
            articleCount: countMap.get(event.id) || 0
        }));

        const totalResult = await db.select({ count: sql<number>`count(*)` }).from(events);

        return {
            data: results,
            total: totalResult[0]?.count || 0,
            page,
            limit,
            totalPages: Math.ceil((totalResult[0]?.count || 0) / limit),
        };
    }

    async get(id: string) {
        return db.query.events.findFirst({
            where: eq(events.id, id),
            with: {
                articles: {
                    orderBy: [desc(articles.publishedAt)],
                    with: {
                        source: true
                    }
                }
            }
        });
    }
}
