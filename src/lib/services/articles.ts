
import { db } from '@/lib/db';
import { articles, articlePeople, sources, events } from '@/lib/db/schema';
import { eq, desc, and, sql, like, or } from 'drizzle-orm';
import { type InferSelectModel } from 'drizzle-orm';

export type Article = typeof articles.$inferSelect;

export class ArticlesService {

    async list(params: { page?: number; limit?: number; query?: string; sourceId?: string; date?: string }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (params.query) {
            conditions.push(or(
                like(articles.title, `%${params.query}%`),
                like(articles.titleCN, `%${params.query}%`),
                like(articles.content, `%${params.query}%`)
            ));
        }

        if (params.sourceId) {
            conditions.push(eq(articles.sourceId, params.sourceId));
        }

        if (params.date) {
            // Filter by date (YYYY-MM-DD)
            // SQLite stores dates as timestamps (milliseconds) or strings depending on configuration.
            // Based on schema, it is integer (timestamp).
            // We need to match the range for that day.
            const dateStart = new Date(params.date);
            dateStart.setHours(0, 0, 0, 0);

            const dateEnd = new Date(params.date);
            dateEnd.setHours(23, 59, 59, 999);

            conditions.push(and(
                sql`${articles.publishedAt} >= ${dateStart.getTime()}`,
                sql`${articles.publishedAt} <= ${dateEnd.getTime()}`
            ));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db.query.articles.findMany({
            where: whereClause,
            limit: limit,
            offset: offset,
            orderBy: [desc(articles.publishedAt)],
            with: {
                source: true,
                event: true,
            }
        });

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(articles)
            .where(whereClause);

        return {
            data,
            total: totalResult[0]?.count || 0,
            page,
            limit,
            totalPages: Math.ceil((totalResult[0]?.count || 0) / limit),
        };
    }

    async get(id: string) {
        const article = await db.query.articles.findFirst({
            where: eq(articles.id, id),
            with: {
                source: true,
                event: true,
                articlePeople: {
                    with: {
                        person: true
                    }
                }
            }
        });
        return article || null;
    }

    async updateTags(id: string, tags: string[]) {
        await db.update(articles)
            .set({ tags: tags }) // Drizzle handles JSON stringify if mode is json
            .where(eq(articles.id, id));
    }

    async updateTitleCN(id: string, titleCN: string) {
        await db.update(articles)
            .set({ titleCN })
            .where(eq(articles.id, id));
    }

    async linkPerson(articleId: string, personId: string) {
        // Check if already linked
        const existing = await db.query.articlePeople.findFirst({
            where: and(
                eq(articlePeople.articleId, articleId),
                eq(articlePeople.personId, personId)
            )
        });

        if (!existing) {
            await db.insert(articlePeople).values({
                articleId,
                personId
            });
        }
    }

    async unlinkPerson(articleId: string, personId: string) {
        await db.delete(articlePeople)
            .where(and(
                eq(articlePeople.articleId, articleId),
                eq(articlePeople.personId, personId)
            ));
    }

    async getAvailableDates() {
        // Fetch distinct dates from publishedAt
        // We need to group by date part of publishedAt
        const result = await db.select({
            date: sql<string>`date(${articles.publishedAt} / 1000, 'unixepoch', 'localtime')`
        })
            .from(articles)
            .where(sql`${articles.publishedAt} IS NOT NULL`)
            .groupBy(sql`date(${articles.publishedAt} / 1000, 'unixepoch', 'localtime')`)
            .orderBy(desc(sql`date(${articles.publishedAt} / 1000, 'unixepoch', 'localtime')`));

        return result.map(r => r.date).filter(Boolean);
    }

    async delete(id: string) {
        // First delete related records to avoid foreign key constraint
        await db.delete(articlePeople).where(eq(articlePeople.articleId, id));
        // Then delete the article
        await db.delete(articles).where(eq(articles.id, id));
    }
}
