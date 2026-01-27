
import { db } from '@/lib/db';
import { people } from '@/lib/db/schema';
import { eq, like, or, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export class PeopleService {
    async list(params: { query?: string; role?: string; page?: number; limit?: number }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (params.query) {
            const searchPattern = `%${params.query}%`;
            conditions.push(
                or(
                    like(people.name, searchPattern),
                    like(people.nameJa, searchPattern),
                    like(people.nameKana, searchPattern),
                    like(people.nameEn, searchPattern)
                )
            );
        }

        if (params.role) {
            conditions.push(eq(people.role, params.role));
        }

        const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

        const data = await db.select()
            .from(people)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(people.updatedAt));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(people)
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
        const result = await db.select().from(people).where(eq(people.id, id)).limit(1);
        return result[0] || null;
    }

    async create(data: Omit<NewPerson, 'id' | 'createdAt' | 'updatedAt'>) {
        const id = uuidv4();
        const now = new Date();
        const newPerson: NewPerson = {
            id,
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await db.insert(people).values(newPerson);
        return newPerson;
    }

    async update(id: string, data: Partial<Omit<NewPerson, 'id' | 'createdAt' | 'updatedAt'>>) {
        const now = new Date();
        const updateData = {
            ...data,
            updatedAt: now,
        };

        await db.update(people)
            .set(updateData)
            .where(eq(people.id, id));

        return this.get(id);
    }

    async delete(id: string) {
        await db.delete(people).where(eq(people.id, id));
        return true;
    }
}

export class WikiSyncService {
    // Basic implementation using fetching from public Wikipedia API
    // Doc: https://ja.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&format=json&titles=岸田文雄

    private readonly API_ENDPOINT = 'https://ja.wikipedia.org/w/api.php';

    async searchCandidates(query: string) {
        const params = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: query,
            format: 'json',
            origin: '*'
        });

        try {
            const response = await fetch(`${this.API_ENDPOINT}?${params.toString()}`);
            const data = await response.json();
            return data.query?.search || [];
        } catch (error) {
            console.error('Wiki search error:', error);
            return [];
        }
    }

    async fetchDetails(title: string) {
        const params = new URLSearchParams({
            action: 'query',
            prop: 'extracts|pageimages|info',
            exintro: 'true',
            explaintext: 'true',
            piprop: 'original',
            inprop: 'url',
            titles: title,
            format: 'json',
            origin: '*'
        });

        try {
            const response = await fetch(`${this.API_ENDPOINT}?${params.toString()}`);
            const data = await response.json();
            const pages = data.query?.pages;
            if (!pages) return null;

            const pageId = Object.keys(pages)[0];
            if (pageId === '-1') return null;

            return pages[pageId];
        } catch (error) {
            console.error('Wiki fetch details error:', error);
            return null;
        }
    }
}
