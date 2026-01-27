
import { db } from '@/lib/db';
import { articles, articlePeople, sources, events } from '@/lib/db/schema';
import { eq, desc, and, sql, like, or } from 'drizzle-orm';
import { type InferSelectModel } from 'drizzle-orm';

export type Article = typeof articles.$inferSelect;

export class ArticlesService {

    async list(params: { page?: number; limit?: number; query?: string; sourceId?: string }) {
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
}
